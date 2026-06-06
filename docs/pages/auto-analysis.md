# Auto-Analysis

**Component:** `src/components/AutoAnalysis.tsx`  
**Scoring engine:** `src/lib/autoAnalysis.ts`  
**Used on:** `/research-framework` (embedded at the top of the page)

---

## Purpose

Runs a full automated fundamental analysis of any ticker across Phases 2–7 of the Research Framework. Fetches 8 Alpha Vantage endpoints sequentially, detects a **growth regime**, then scores each phase 0–100 using growth-regime-adjusted criteria. Outputs a composite grade, per-phase grade cards with expandable detail, and a three-scenario DCF table.

Phase 1 (Business Understanding) and Phase 8 (Decision & Sizing) are excluded because they require human judgment that cannot be automated.

---

## API Calls

**Cost:** 8 calls per run (of the 25 free daily calls).  
**Key storage:** `localStorage` → `av_api_key` (also saved on each run).  
**Throttle:** 1 200 ms `sleep()` between each call.  
**Abort:** An `abortRef` flag is checked after each call — clicking Cancel stops the sequence mid-flight.

| Step # | AV function | Data used in |
|--------|-------------|-------------|
| 1 | `OVERVIEW` | All phases (company metadata + ratios) |
| 2 | `GLOBAL_QUOTE` | Phase 4 (live price for valuation), Phase 5 (margin of safety) |
| 3 | `INCOME_STATEMENT` | Phase 2, growth regime, Phase 5 |
| 4 | `BALANCE_SHEET` | Phase 2 |
| 5 | `CASH_FLOW` | Phase 2, Phase 5, Phase 6 |
| 6 | `EARNINGS` | Phase 3 (quarterly + annual EPS history) |
| 7 | `DIVIDENDS` | Phase 6 |
| 8 | `NEWS_SENTIMENT` | Phase 7 |

DIVIDENDS and NEWS_SENTIMENT failures are silently swallowed (non-fatal) — many tickers don't pay dividends and some have no recent news.

---

## Growth Regime Detection (`detectGrowthRegime`)

Computed once after all data is fetched. Passed as a shared `GrowthRegimeInfo` object into Phases 3, 4, and 5 to prevent each phase from independently computing a different regime.

### Inputs

| Signal | Source |
|--------|--------|
| Implied EPS CAGR | `ForwardPE / PEGRatio` (e.g. 71.9 / 1.3 = 55.3 → interpreted as 55.3%/yr) |
| Recent quarterly EPS growth | `QuarterlyEarningsGrowthYOY` from OVERVIEW |
| 3-year revenue CAGR | Computed from `annualReports[0..3].totalRevenue` |
| Trough detection | LTM EPS (`annualEarnings[0]`) < EPS 3 years ago (`annualEarnings[3]`) |

### Primary Regime (drives scoring curves in Phases 4 & 5)

The forward growth signal used is `impliedEpsCAGR` if available, otherwise `recentEpsGrowth × 100`.

| Condition | Regime |
|-----------|--------|
| revCagr < 20% **AND** quarterly rev growth > 30% | `inflection` |
| forwardGrowth > 25% | `high_growth` |
| forwardGrowth ≥ 10% | `moderate_growth` |
| Otherwise | `mature` |

### Recovery Modifier (independent from primary)

Set to `'recovery'` when `isTrough = true` (LTM EPS < EPS 3 years ago). This modifier:
- Does **not** change the primary regime or valuation scoring curves
- Caps Phase 3 EPS growth score at 20/25 (recovery growth is easier than compounding)
- Adds a trough-warning note to the EPS growth detail

### Regime colours in UI

| Regime | Chip colour |
|--------|-------------|
| `high_growth` / `inflection` | `#6366f1` (indigo) |
| `moderate_growth` | `#3b82f6` (blue) |
| `recovery` | `#f59e0b` (amber) |
| `mature` | `#64748b` (slate) |

---

## Scoring Architecture

Each phase returns a `PhaseScore`:

```ts
interface PhaseScore {
  phase: number;
  title: string;
  score: number;          // 0–100
  grade: Grade;           // 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  headline: string;       // one-sentence summary
  summary: string;        // compact metrics string shown in collapsed card
  details: ScoreDetail[]; // per-criterion breakdown
  flags: { text: string; type: FlagType }[];  // good/bad/neutral signals
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

**Total: 100 pts across 5 criteria**

| Criterion | Max pts | Source data |
|-----------|---------|-------------|
| Revenue CAGR (3yr) | 20 | `annualReports[0..3].totalRevenue` → `(rev0/rev3)^(1/3) - 1` |
| Gross Margin | 15 | `grossProfit / totalRevenue` (latest year) |
| Operating Margin (GAAP) | 15 | `operatingIncome / totalRevenue`, trend vs 2 years ago |
| FCF Conversion Quality | 15 | `FCF / |netIncome|` (conversion ratio drives score; FCF margin shown for context) |
| Net Debt / EBITDA | 20 | `(shortLongTermDebtTotal - cashAndShortTermInvestments) / EBITDA` |
| Interest Coverage | 15 | `operatingIncome / |interestExpense|` |

**SBC flag:** If `stockBasedCompensation / revenue > 10%`, a `neutral` flag is raised and a yellow `⚠` warning badge is attached to the Operating Margin and FCF details rows.

**FCF scoring note:** The score is driven by the **conversion ratio** (FCF / net income), not the FCF margin. The "exceptional FCF margin" good flag only fires when *both* conversion ≥ 85% **and** FCF margin > 15%. If margin is healthy but conversion is low, a nuanced neutral flag is raised instead.

---

## Phase 3 — Earnings Quality (`scoreEarningsQuality`)

**Total: 100 pts across 4 criteria** · Uses last 8 quarters of `quarterlyEarnings`

| Criterion | Max pts | Formula |
|-----------|---------|---------|
| EPS Beat Rate | 30 | `beats / 8Q` where beat = `surprisePercentage > 0` |
| Avg EPS Surprise % | 25 | Mean of `surprisePercentage` across 8Q |
| EPS Growth YoY | 25 | `(q[0].reportedEPS - q[4].reportedEPS) / |q[4].reportedEPS|` (same quarter prior year) |
| Execution Consistency | 20 | `beatRate × 20` (beat rate re-applied as consistency proxy) |

**Trough adjustment (EPS Growth):** If `regime.isTrough` is true, or the comparison quarter (q[4]'s year) was itself a trough year, the growth score is capped at 20/25. A `⚠ Recovery phase` warning badge is shown, and a `neutral` flag explains the trough-base distortion alongside the 3yr CAGR for context.

---

## Phase 4 — Valuation (`scoreValuation`)

**Total: 100 pts across 5 criteria** · Growth-regime-adjusted

| Criterion | Max pts | Notes |
|-----------|---------|-------|
| P/E (Forward preferred, fallback Trailing) | 20 | Scoring curve varies by regime (see below) |
| PEG Ratio | 25 | Universal across regimes |
| EV / EBITDA | 25 | GAAP basis; warning badge always shown |
| Price vs 52-Week Range | 15 | Position = `(price - low52) / (high52 - low52)` |
| Analyst Target Upside | 15 | `(target - price) / price`; framing adjusted for high-growth |

### Regime-adjusted P/E scoring

**High-growth / Inflection:** Uses a normalized PEG = `activePE / impliedCAGR`. Scored on this ratio, not the raw P/E. A P/E of 70× with 55% implied CAGR scores better than a P/E of 25× with 5% growth.

**Moderate-growth:** Wider fair-value band. P/E < 22 = fair value (vs 18 for mature).

**Mature / Value:** Strict bands. P/E < 12 = value, > 35 = expensive.

### Analyst Target framing

If the stock is trading **above** the analyst target (negative upside):
- **High-growth regime:** Score = 8/15 with a `neutral` flag noting that analyst targets for high-growth stocks frequently lag price as models are revised upward. Not treated as a bearish signal.
- **All other regimes:** Score = 2/15, flagged as neutral.

---

## Phase 5 — Intrinsic Value / Auto-DCF (`scoreDCF`)

**Total: 100 pts across 3 criteria**  
**WACC:** 10% (fixed)  **Terminal growth:** 3% (fixed)

| Criterion | Max pts |
|-----------|---------|
| Margin of Safety (Base scenario) | 45 |
| Historical FCF CAGR (2–3yr) | 25 |
| FCF Predictability (coefficient of variation) | 20 |

### Three DCF Scenarios

All three use `FCF = operatingCashflow - |capitalExpenditures|` from the most recent annual report as the starting FCF.

#### Bear scenario
- Growth rate: historical FCF CAGR (`(fcfs[0]/fcfs[2])^(1/2) - 1`), clamped 0–25%
- If historical CAGR unavailable: defaults to 5%
- Single-phase 5-year DCF + Gordon Growth terminal value

#### Base scenario (primary for scoring)
If `impliedEpsCAGR` (from P/E ÷ PEG) is available:
- Two-phase DCF: years 1–3 at `min(impliedCAGR, 60%)`, years 4–5 at `(impliedCAGR + historicalCAGR) / 2`
- This blends forward analyst expectations with historical reality

If not available (no PEG or ForwardPE data):
- Falls back to `max(recentEpsGrowth, historicalCAGR × 1.5)`, clamped at 40%
- A `neutral` flag is raised recommending the manual DCF Calculator

#### Bull scenario
- Growth rate: `baseGrowthRate × 1.25`, clamped at 80%

### Margin of Safety formula

```
MoS = (intrinsicValue - marketPrice) / marketPrice
```

Positive = stock is below intrinsic value (discount). Negative = stock trades above intrinsic value (premium).

Scoring is against the **Base** scenario MoS only. Bear and Bull are informational.

### FCF Predictability

Coefficient of variation of the last 3–4 annual FCF values:
```
CV = stdDev(fcfs) / |mean(fcfs)|
```
CV < 15% → very consistent (20/20 pts). CV > 50% → highly variable (5/20 pts).

---

## Phase 6 — Dividends & Capital Return (`scoreDividends`)

**Two separate scoring paths depending on whether the company pays a dividend.**

### Dividend path (hasDividend = true)

| Criterion | Max pts | Formula |
|-----------|---------|---------|
| Dividend Yield | 15 | `DividendYield` from OVERVIEW |
| FCF Payout Ratio | 35 | `|dividendPayout| / FCF` from cash flow |
| Dividend Growth | 25 | Recent 4-payment annualised vs oldest 4-payment annualised |
| Earnings Payout Ratio | 25 | `DividendPerShare / EPS` |

A yield > 6.5% triggers a `bad` flag (potential yield trap).  
FCF payout > 90% triggers a `bad` flag (dividend at risk).

### Non-dividend path

| Criterion | Max pts | Formula |
|-----------|---------|---------|
| FCF Yield | 30 | `FCF / MarketCapitalization` |
| Net Buyback Yield (after SBC) | 20 | `(grossBuybacks - SBC) / marketCap` |
| Reinvestment Quality (ROE proxy) | 10 | `ReturnOnEquityTTM` as ROIC proxy |
| Capital Return Structure | 30 | Fixed 30 pts unless high leverage (capped to 10) |

**Net Buyback Yield** subtracts SBC from gross buybacks. A company that repurchases $2B but grants $2B in stock options has a net buyback yield of 0% — no real capital return. Negative net buyback yield means dilution despite buybacks.

**High-leverage cap:** If `netDebt/EBITDA > 2` while conducting buybacks, the Capital Return Structure score is capped at 10/30 and a `bad` flag is raised.

---

## Phase 7 — News Sentiment (`scoreSentiment`)

Uses `AVNewsItem[]` from the `NEWS_SENTIMENT` endpoint. Each item contains AV's pre-computed `overall_sentiment_score` (−1 to +1) and `overall_sentiment_label`, plus optional `ticker_sentiment[]` for per-ticker scores within multi-ticker articles.

**Scoring:**
- Filters articles mentioning the specific ticker (from `ticker_sentiment` if available)
- Averages the relevant sentiment scores
- Maps average score to a 0–100 phase score and grade

This is the only phase that uses AV's own NLP sentiment, not the browser-local models from the News Sentiment page.

---

## Composite Score (`computeComposite`)

Weighted average of all 6 phase scores:

| Phase | Weight |
|-------|--------|
| 2 — Financial Health | 25% |
| 3 — Earnings Quality | 20% |
| 4 — Valuation | 20% |
| 5 — Auto-DCF | 15% |
| 6 — Dividends / Capital Return | 10% |
| 7 — Sentiment | 10% |

The composite grade uses the same `gradeFromScore` thresholds as individual phases.

---

## UI Components

### Fetch Progress Panel

A 2-column grid of 7 step cards (one per endpoint). Each transitions through `idle → loading → done` with icon (○ → ⟳ → ✓) and colour (grey → indigo → green). A master progress bar shows `doneCount / 7`.

### Company Header + Regime Badge

After scoring, shows company name, ticker, sector, and a colour-coded regime chip (e.g. `HIGH GROWTH`, `MODERATE GROWTH`, `MATURE`).

### Composite Card

Large grade badge (letter + score/100) with a headline sentence, a full-width score bar, and a mini per-phase colour strip below (7 segments, one per phase, coloured by each phase's grade).

Footer states the exact weighting used.

### Phase Result Cards (expandable)

Each phase collapses to show: grade badge, score bar, headline, summary string, regime chip (if applicable).

On expand:
- **Score Breakdown tab:** Each `ScoreDetail` shown as a card with label, value, mini score bar (points/maxPoints), note text, and optional amber warning badge.
- **Signals tab:** All flags listed with ✓ (good, green), ✗ (bad, red), or → (neutral, grey) icons.
- **DCF table (Phase 5 only):** Bear / Base★ / Bull scenarios showing growth rate, intrinsic value/share, and margin of safety.

### Colour mapping

| Grade | Colour |
|-------|--------|
| A+, A | `#10b981` (green) |
| B+, B | `#22c55e` (lighter green) |
| C+ | `#f59e0b` (amber) |
| C | `#fb923c` (orange) |
| D | `#ef4444` (red) |
| F | `#dc2626` (dark red) |

Score bars use the same thresholds: ≥75 green, ≥60 lighter green, ≥45 amber, ≥30 orange, <30 red.

---

## Limitations & Caveats

- **8 API calls per run** — the most expensive operation in the app. On a free AV key (25/day), three full analyses exhaust the daily quota.
- **WACC and terminal growth are fixed** (10%, 3%). The DCF Calculator page allows user adjustment; the Auto-DCF does not.
- **No net debt adjustment in DCF** — enterprise value used as equity value proxy. Overstates intrinsic value for highly leveraged companies.
- **SBC not deducted from FCF** — flagged when SBC/revenue > 10%, but the FCF figure used in Phase 5 is GAAP FCF before SBC.
- **PEG-implied CAGR** is a rough proxy (ForwardPE ÷ PEGRatio). For companies where analysts set PEG using a different growth period, this can be misleading.
- **Sentiment phase uses AV's NLP**, not the browser-local DistilBERT. AV's model is not disclosed; quality and recency vary.
- **Phase 7 scope** is limited to the articles returned by a single AV `NEWS_SENTIMENT` call (typically the 50 most recent). For low-coverage stocks, few or no articles may be returned.
- **Dividend growth calculation** compares the most recent 4 payments to the oldest 4 payments in the history array. For quarterly payers this approximates annual DPS comparison; for monthly payers (12 payments = 1 year) this comparison window is too narrow.
