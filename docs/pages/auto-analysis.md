# Auto-Analysis

**Component:** `src/components/AutoAnalysis.tsx`  
**Scoring engine:** `src/lib/autoAnalysis.ts`  
**Used on:** `/research-framework` (embedded at the top of the page)

---

## Purpose

Runs a full automated fundamental analysis of any ticker across Phases 2–7 of the Research Framework. Fetches 10 Alpha Vantage endpoints (11 API calls) sequentially, detects a **growth regime**, then scores each phase 0–100 using growth-regime-adjusted criteria. Outputs a composite grade, per-phase grade cards with expandable detail, and a three-scenario DCF table.

Phase 1 (Business Understanding) and Phase 8 (Decision & Sizing) are excluded because they require human judgment that cannot be automated.

---

## API Calls

**Cost:** 11 calls per run (of the 25 free daily calls).  
**Key storage:** `localStorage` → `av_api_key` (also saved on each run).  
**Throttle:** 1 200 ms `sleep()` between each call.  
**Abort:** An `abortRef` flag is checked after each call — clicking Cancel stops the sequence mid-flight.

| Step # | AV function | Data used in | Fatal? |
|--------|-------------|-------------|--------|
| 1 | `OVERVIEW` | All phases (company metadata + ratios) | Yes |
| 2 | `GLOBAL_QUOTE` | Phase 4 (live price), Phase 5 (MoS), Phase 6 (live market cap) | No |
| 3 | `INCOME_STATEMENT` | Phase 2, growth regime | No |
| 4 | `BALANCE_SHEET` | Phase 2, Phase 4 (EV/Sales), Phase 5 (net debt) | No |
| 5 | `CASH_FLOW` | Phase 2, Phase 5 (FCF), Phase 6 | No |
| 6 | `EARNINGS` | Phase 3 (quarterly + annual EPS history) | No |
| 7 | `DIVIDENDS` | Phase 6 | No |
| 8 | `NEWS_SENTIMENT` | Phase 7 | No |
| 9 | `EARNINGS_ESTIMATES` | Phase 3 (revision flags), Phase 4 (cross-check), Phase 5 (fallback) | No |
| 10 | `INSIDER_TRANSACTIONS` | Phase 7 (insider buy/sell flags) | No |
| 11 | `SHARES_OUTSTANDING` | Phase 5 (fresh share count), Phase 6 (dilution signal) | No |

Steps 7–11 are silently swallowed on error (non-fatal). The `GLOBAL_QUOTE` call is made immediately after OVERVIEW without a named step card — it is counted as call 2 but does not appear in the progress panel.

---

## New Data Types

Three new interfaces support the v3 endpoints:

```ts
export interface AVEarningsEstimate {
  fiscalDateEnding: string;
  estimatedEPS: string;
  numberOfAnalysts?: string;
  EPSEstimated?: string;
}

export interface AVInsiderTransaction {
  transactionType: string;   // 'P' = purchase, 'S' = sale
  shares: string;
  sharePrice: string;
  transactionDate: string;
}

export interface AVSharesEntry {
  date: string;
  commonStockSharesOutstanding: string;
}
```

---

## Growth Regime Detection (`detectGrowthRegime`)

Computed once after all data is fetched. Passed as a shared `GrowthRegimeInfo` object into Phases 2, 3, 4, and 5.

### Inputs

| Signal | Source |
|--------|--------|
| Implied EPS CAGR | `ForwardPE / PEGRatio` (e.g. 71.9 / 1.3 = 55.3 → 55.3%/yr) |
| Recent quarterly EPS growth | `QuarterlyEarningsGrowthYOY` from OVERVIEW |
| Revenue CAGR | Computed from `annualReports[0..3].totalRevenue` |
| Trough detection | LTM EPS (`annualEarnings[0]`) < EPS 3 years ago (`annualEarnings[2]`) |

### Primary Regime (drives scoring curves in Phases 2, 4 & 5)

| Condition | Regime |
|-----------|--------|
| revCagr < 20% **AND** quarterly rev growth > 30% | `inflection` |
| forwardGrowth > 25% | `high_growth` |
| forwardGrowth ≥ 10% | `moderate_growth` |
| `PEGRatio < 0` (negative PEG) | `mature` (forced override) |
| Otherwise | `mature` |

The **negative PEG guard** (new in v3): if AV returns a negative PEG ratio, `impliedEpsCAGR` is set to null and `primary` is forced to `'mature'`. A `bad` flag is added to Phase 4.

### Recovery Modifier (independent from primary)

Set to `'recovery'` when `isTrough = true`. This modifier:
- Does **not** change the primary regime or valuation scoring curves
- Caps Phase 3 EPS growth score at 20/25
- Is noted in insider transaction flags (Phase 7)

---

## Scoring Architecture

Each phase returns a `PhaseScore` (interface unchanged):

```ts
interface PhaseScore {
  phase: number;
  title: string;
  score: number;          // 0–100
  grade: Grade;           // 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  headline: string;
  summary: string;
  details: ScoreDetail[];
  flags: { text: string; type: FlagType }[];
  dcfScenarios?: DCFScenario[];  // Phase 5 only
  regime?: GrowthRegime;
  regimeLabel?: string;
}
```

### Grade thresholds

| Score | Grade |
|-------|-------|
| ≥ 90 | A+ |
| ≥ 80 | A |
| ≥ 70 | B+ |
| ≥ 60 | B |
| ≥ 50 | C+ |
| ≥ 40 | C |
| ≥ 30 | D |
| < 30 | F |

---

## Phase 2 — Financial Health (`scoreFinancialHealth`)

**Signature:** `(income, balance, cashflow, regime)`  
**Total: 100 pts across 5 criteria**

| Criterion | Max pts | Scoring driver |
|-----------|---------|----------------|
| Revenue CAGR | 20 | Dynamic lookback: `min(income.length-1, 4)` years; label shows actual period (e.g. "Revenue CAGR (4yr)") |
| Gross Margin | 15 | `grossProfit / totalRevenue`; trend vs 3 years ago |
| Operating Margin (GAAP) | 15 | Trend vs 2 years ago; SBC warning badge if SBC/rev > 10% |
| FCF Quality | 15 | **Regime-split** (see below) |
| Net Debt / EBITDA | 20 | Net debt / EBITDA; **negative EBITDA guard** (see below) |
| Interest Coverage | 15 | EBIT / \|interestExpense\|; **negative EBIT guard** (see below) |

### 2a — FCF Quality: regime-split scoring

| Regime | Scoring metric | Thresholds |
|--------|---------------|-----------|
| `high_growth` or `inflection` | **FCF margin** (FCF / revenue) | ≥20% → 15pts, ≥10% → 11pts, ≥0% → 7pts, <0% → 3pts |
| `moderate_growth` or `mature` | **FCF conversion ratio** (FCF / \|netIncome\|) | >1.2× → 15pts, >0.85× → 12pts, >0.60× → 8pts, >0.30× → 4pts, else → 1pt |

Detail label changes to `"FCF Margin"` for high-growth/inflection, `"FCF Conversion / Quality"` otherwise.

### 2b — Interest Coverage: negative EBIT guard

If `operatingIncome < 0`:
- **Low debt** (`totalDebt < revenue`): 5/15 pts, `neutral` flag — "Operating loss but low debt burden"
- **High debt** (`totalDebt >= revenue`): 0/15 pts, `bad` flag — "Operating loss with significant debt"
- Ratio is not computed or displayed in either case.

### 2c — Net Debt / EBITDA: negative EBITDA guard

If computed EBITDA ≤ 0:
- Fixed 5/20 pts
- Detail note: `"N/A — EBITDA negative"`
- `bad` flag raised
- Ratio not computed or displayed

### 2d — Revenue CAGR: extended lookback

Uses `cagrYears = Math.min(income.length - 1, 4)` instead of a hardcoded 3. Formula: `(rev[0] / rev[cagrYears])^(1/cagrYears) - 1`. The detail label reflects the actual period.

**SBC flag:** If `stockBasedCompensation / revenue > 10%`, a `neutral` flag is raised and a `⚠` warning badge is attached to Operating Margin and (for mature/moderate) FCF Conversion detail rows.

---

## Phase 3 — Earnings Quality (`scoreEarningsQuality`)

**Signature:** `(quarterly, annual, regime, estimatesData?)`  
**Total: 100 pts across 4 criteria** · Uses last 8 quarters of `quarterlyEarnings`

| Criterion | Max pts | Formula |
|-----------|---------|---------|
| EPS Beat Rate | 30 | `beats / 8Q` where beat = `surprisePercentage > 0` |
| Avg EPS Surprise % | 25 | Mean of `surprisePercentage` across 8Q (see sandbagging cap) |
| EPS Growth YoY | 25 | `(q[0].reportedEPS - q[4].reportedEPS) / |q[4].reportedEPS|` |
| Execution Consistency | 20 | `beatRate × 20` (beat rate re-applied as consistency proxy) |

### 3a — Recency-weighted beat rate (flags only, score unchanged)

After computing the 8Q `beatRate`, also computes `recentBeatRate` from the 4 most recent quarters:
- If `recentBeatRate < 0.5` AND `beatRate ≥ 0.75`: `bad` flag — deteriorating execution
- If `recentBeatRate ≥ 0.75` AND `beatRate < 0.5`: `good` flag — improving execution

### 3b — Sandbagging cap on surprise score

`epsGrowthForCap` is computed from `q[0]` vs `q[4]` before the surprise score. If `epsGrowthForCap ≤ 0` (flat or declining actual EPS), the Avg EPS Surprise score is **capped at 15/25** regardless of `avgSurprise` magnitude. A `neutral` flag is added.

### 3c — Trough detection index fix

Trough comparison now uses `annualEarnings[2]` (3 fiscal years ago) instead of the previous `annualEarnings[3]` (4 years ago). Comment: `// annualEarnings[0] = most recent, annualEarnings[2] = 3 fiscal years ago`.

### Estimates revision signal (from EARNINGS_ESTIMATES)

If `estimatesData` has ≥ 2 future estimates (filtered to dates after the latest reported quarter):
- `est0` = next quarter's consensus EPS; `est1` = the one after
- If `(est0 - est1) / |est1| > 10%`: `good` flag — "Forward EPS estimates trending up"
- If `< -10%`: `bad` flag — "Forward EPS estimates being revised down"

---

## Phase 4 — Valuation (`scoreValuation`)

**Signature:** `(ov, price, regime, balance, estimatesData?)`  
**Total: 100 pts across 5 criteria** · Growth-regime-adjusted

| Criterion | Max pts (normal) | Max pts (neg. EBITDA) | Notes |
|-----------|-----------------|----------------------|-------|
| P/E (Forward or Trailing) | 20 | 35 | Regime-adjusted scoring |
| PEG Ratio | 25 | 30 | Universal |
| EV / EBITDA | 25 | 0 | Suppressed when EBITDA ≤ 0 |
| 52-Wk Range *or* EV/Sales | 15 | 15 | Regime gate (see 4c) |
| Analyst Target Upside | 15 | 15 | Context-aware framing |

### 4a — Negative PEG guard

If `PEGRatio < 0`: adds `bad` flag in Phase 4. Regime is already forced to `'mature'` by `detectGrowthRegime`. The normalized PEG path in P/E scoring is skipped.

### 4b — EV/EBITDA suppression for negative EBITDA

Checks `nn(ov.EBITDA) <= 0` (raw EBITDA value from OVERVIEW):
- EV/EBITDA criterion: 0 pts, note "Not applicable — EBITDA negative", no warning badge, `neutral` flag
- To keep phase total reachable to 100: P/E max scaled to 35 (× 35/20), PEG max scaled to 30 (× 30/25)

### 4c — 52-week range: regime gate

| Regime | Criterion shown |
|--------|----------------|
| `high_growth` or `inflection` | **EV / Revenue** = `(MarketCap + debt - cash) / RevenueTTM` from balance sheet. Score: < 5× → 15, < 10× → 11, < 20× → 7, ≥ 20× → 3 |
| `moderate_growth` or `mature` | **Price vs 52-Week Range** (unchanged) |

### Estimates cross-check (from EARNINGS_ESTIMATES)

If `estimatesData` provides ≥ 2 annual EPS estimates:
- Computes `directForwardGrowth = (nextYearEPS - thisYearEPS) / |thisYearEPS|`
- If `|impliedEpsCAGR/100 - directForwardGrowth| > 15pp`: `neutral` flag noting the divergence

---

## Phase 5 — Intrinsic Value / Auto-DCF (`scoreDCF`)

**Signature:** `(cashflow, ov, price, regime, balance?, freshShares?, estimatesData?)`  
**Total: 100 pts across 3 criteria**  
**WACC:** 10% (fixed) · **Terminal growth:** 3% (fixed)

| Criterion | Max pts |
|-----------|---------|
| Margin of Safety (Base scenario) | 45 |
| Historical FCF CAGR (2yr) | 25 |
| FCF Predictability (coefficient of variation) | 20 |

### Share count

Uses `freshShares` (from `SHARES_OUTSTANDING[0]`) if available, otherwise falls back to `ov.SharesOutstanding`.

### 5a — Bear scenario floor

Bear growth rate: `clamp(historicalCAGR, -0.20, 0.25)` — floor lowered from 0% to **-20%** to allow negative growth scenarios.

### 5b — Net debt adjustment (equity value)

After computing each scenario's enterprise value per share, subtracts:
```
netDebtPerShare = (shortLongTermDebtTotal - cashAndShortTermInvestments) / effectiveShares
equityValuePerShare = max(0, enterpriseValuePerShare - netDebtPerShare)
```
Both balance sheet fields come from `balance[0]`. If `equityValuePerShare < 0`, it is floored to `$0` and MoS is set to `-100%` (-1.0). The DCF table shows a note: *"Intrinsic value shown is equity value (enterprise value less net debt)."*

### 5c — Two-phase growth cap

Base scenario cap tightened from 60% to **40%**: `g1to3 = clamp(impliedCAGR / 100, 0, 0.40)`. A `neutral` flag is added if the cap was binding (i.e. `impliedCAGR / 100 > 0.40`).

### Three DCF Scenarios

#### Bear
- Growth: `clamp(historicalFCFCAGR, -0.20, 0.25)`, default 5% if unavailable
- Single-phase 5-year DCF + Gordon Growth terminal value
- Net debt subtracted → equity value per share

#### Base (primary for scoring)
If `impliedEpsCAGR` is available (PEG path):
- Years 1–3: `clamp(impliedCAGR / 100, 0, 0.40)` — **capped at 40%**
- Years 4–5: `clamp((impliedCAGR/100 + historicalCAGR) / 2, 0, 0.40)`

If `impliedEpsCAGR` unavailable — fallback priority:
1. Direct analyst estimate growth from `estimatesData` (`(nextYearEPS - thisYearEPS) / |thisYearEPS|`), clamped 0–40%
2. `recentEpsGrowth` from OVERVIEW, clamped 0–40%
3. `historicalCAGR × 1.5`, clamped 0–40%

#### Bull
- `baseGrowthRate × 1.25`, clamped at 80%
- Net debt subtracted → equity value per share

### Margin of Safety formula

```
MoS = (equityValuePerShare - marketPrice) / marketPrice
```

Scoring uses **Base** scenario MoS only.

---

## Phase 6 — Dividends & Capital Return (`scoreDividends`)

**Signature:** `(divEntries, cashflow, income, ov, currentPrice?, freshShares?, sharesData?)`

### 6a — Live market cap

For the non-dividend path, `liveMarketCap` replaces the stale `MarketCapitalization` from OVERVIEW:
```
liveMarketCap = currentPrice × (freshShares ?? ov.SharesOutstanding)
```
Falls back to `ov.MarketCapitalization` if either input is null/zero. Used for FCF Yield and Net Buyback Yield.

### Dividend path (hasDividend = true) — unchanged

| Criterion | Max pts |
|-----------|---------|
| Dividend Yield | 15 |
| FCF Payout Ratio | 35 |
| Dividend Growth | 25 |
| Earnings Payout Ratio | 25 |

### Non-dividend path — revised (6b)

Old `Reinvestment Quality (ROE proxy)` (10pts) + `Capital Return Structure` (30pts fixed) → replaced by two 15pt sub-criteria:

| Criterion | Max pts | Logic |
|-----------|---------|-------|
| FCF Yield | 30 | `FCF / liveMarketCap` (unchanged) |
| Net Buyback Yield (after SBC) | 20 | `(grossBuybacks - SBC) / liveMarketCap` (unchanged) |
| **Return on Equity (ROIC proxy)** | **15** | ROE > 15% → 15, > 10% → 11, > 5% → 7, > 0% → 3, ≤ 0% → 0 |
| **Capital Allocation Clarity** | **15** | See below |

**Capital Allocation Clarity scoring:**
- Net buyback yield > 1%: **15pts** — clear shareholder return
- Gross buybacks > 0 but net buyback yield ≤ 1%: **8pts** + `neutral` flag "SBC offsets buybacks"
- No buybacks AND cash > 20% of market cap: **5pts** + `neutral` flag "Large cash balance with no stated return"
- Otherwise: **8pts** (reinvesting into business)

**High-leverage cap** (unchanged trigger: `netDebt/EBITDA > 2` while buying back stock): both sub-criteria A and B capped at **5/15 each**.

### Dilution signal from SHARES_OUTSTANDING (Step 3c)

If `sharesData` has ≥ 2 entries:
```
annualisedDilutionRate = ((shares_now - shares_2yr) / shares_2yr) / 2
```
`shares_2yr` = the entry closest to 2 calendar years ago.
- > 3%/yr: `bad` flag — "Share count growing ~X%/yr"
- < -2%/yr: `good` flag — "Share count shrinking ~X%/yr — active buyback effect confirmed"

---

## Phase 7 — News Sentiment (`scoreSentiment`)

**Signature:** `(newsItems, ticker, ov, insiderData?, regime?)`

Scoring criteria and weighting are **unchanged** from v2. Two additions:

### Insider transaction flags (from INSIDER_TRANSACTIONS)

Requires ≥ 3 transactions in the last 180 days. Computes:
```
totalBuyValue  = Σ (shares × sharePrice) where transactionType === 'P'
totalSellValue = Σ (shares × sharePrice) where transactionType === 'S'
netBuyRatio    = totalBuyValue / (totalBuyValue + totalSellValue)
```

| netBuyRatio | Flag |
|-------------|------|
| > 0.60 | `good` — "Insiders net buyers in last 6 months (X%)" |
| < 0.30 | `bad` — "Heavy insider selling (X% sell). Note: may reflect diversification" |
| 0.30–0.60 | No flag |

If `regime.isTrough === true` AND `netBuyRatio > 0.60`, the good flag appends: *"— particularly notable during earnings trough."*

---

## Composite Score (`computeComposite`)

Weighted average of all 6 phase scores. **Weights updated in v3:**

| Phase | Weight (v2) | Weight (v3) |
|-------|-------------|-------------|
| 2 — Financial Health | 25% | **25%** (unchanged) |
| 3 — Earnings Quality | 20% | **15%** |
| 4 — Valuation | 20% | **17%** |
| 5 — Auto-DCF | 15% | **20%** |
| 6 — Dividends / Capital Return | 10% | **8%** |
| 7 — Sentiment | 10% | **15%** |

Sum: 100%. DCF gets more weight (equity value now net-debt-adjusted); Sentiment gets more weight (absorbs insider + estimate signals).

---

## UI Components

### Fetch Progress Panel

A 2-column grid of **10 step cards** (up from 7). Progress bar shows `doneCount / 10`.

### DCF Table

Now shows a footnote below the scenario rows:  
*"Intrinsic value shown is equity value (enterprise value less net debt)."*

All other UI components are unchanged from v2.

---

## Limitations & Caveats

- **11 API calls per run** — on a free AV key (25/day), two full analyses exhaust the daily quota.
- **WACC and terminal growth are fixed** (10%, 3%). The manual DCF Calculator allows user adjustment.
- **SBC not deducted from FCF** — flagged when SBC/revenue > 10%, but GAAP FCF is used in Phase 5.
- **PEG-implied CAGR** is a rough proxy and is now capped at 40% in the DCF. Negative PEG forces the mature regime.
- **Net debt adjustment** uses balance sheet book values — for companies with off-balance-sheet liabilities this understates true leverage.
- **Sentiment phase uses AV's NLP**, not the browser-local DistilBERT. AV's model is undisclosed.
- **Insider signals require ≥ 3 transactions in 180 days** — low-insider-activity companies produce no signal.
- **EARNINGS_ESTIMATES availability** varies by ticker and AV subscription tier.
- **Dilution signal requires 2+ years of SHARES_OUTSTANDING history** — recent IPOs will produce no signal.
