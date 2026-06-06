# Research Framework

**Route:** `/research-framework`  
**File:** `src/pages/ResearchFramework.tsx`

---

## Purpose

A structured, step-by-step fundamental analysis process for evaluating stocks before taking a position. It is an **educational and process** page — no live data is fetched. It guides the user through 7 sequential phases of analysis, each with a detailed checklist, red/green flags, key metrics table, and links to the relevant live-data tools within the app.

It also embeds the `AutoAnalysis` component (imported from `src/components/AutoAnalysis`) which may trigger AV API calls — see the AutoAnalysis section below.

---

## No External API Calls (base page)

All content is static. The 7 phases are defined as a hardcoded `PHASES` array in the component. No Alpha Vantage key is required to view this page.

---

## Phase Structure

Each phase is defined by the `Phase` interface:

```ts
interface Phase {
  id: number;
  title: string;
  tagline: string;
  accent: string;          // hex colour for visual accent
  icon: string;            // emoji
  objective: string;       // 1–2 paragraph description
  context: string;         // detailed professional context
  checklist: CheckItem[];  // items with optional flag colour
  redFlags: string[];      // warning signals
  greenFlags: string[];    // positive signals
  keyMetrics: { name: string; description: string }[];
  tools: ToolLink[];       // links to other pages in the app
  proTip: string;          // expert tip for the phase
}

interface CheckItem {
  text: string;
  flag?: 'green' | 'red' | 'yellow';
}

interface ToolLink {
  label: string;
  path: string;           // app route (e.g. "/financials")
  description: string;
  accent: string;
}
```

---

## The 7 Phases

### Phase 1 — Understand the Business
**Accent:** `#8b5cf6` (purple)

No tool links. Focus: business model, moat, TAM, revenue type (recurring vs transactional), management quality.

**Checklist highlights:**
- Can you explain the business in ≤2 sentences?
- Revenue model: subscription / transaction / licensing / advertising / services?
- TAM growing, stable, or shrinking?
- Top 3 competitors + differentiation?
- Moat type: network effects, switching costs, cost advantage, brand, patents?

**Key metrics:** Revenue mix, revenue concentration (>20% single customer = risk), customer churn, Net Revenue Retention, TAM penetration rate.

---

### Phase 2 — Financial Health Check
**Accent:** `#10b981` (green)

**Tool links:**
- `/financials` — Financial Statements (income, balance, cash flow, Piotroski, Altman)
- `/stocks-glossary` — Stock Ratios Reference

**Checklist highlights:**
- Revenue CAGR 3–5 years (auto-analysis uses up to 4yr lookback dynamically)
- Gross margin stable or expanding?
- FCF: for high-growth companies focus on **FCF margin** (≥10% is solid); for mature companies focus on **FCF conversion ratio** (FCF / net income ≥ 85%)
- Net Debt / EBITDA below 3×? (not computable when EBITDA is negative — assess absolute debt vs revenue instead)
- Interest coverage > 5×? (not meaningful when EBIT is negative — evaluate debt load relative to revenue)
- Working capital trend (rising DSO = revenue quality concern)
- SBC as % of revenue — if > 10%, GAAP margins understate true cost
- Piotroski F-Score ≥ 7
- Altman Z-Score > 2.6
- SG&A and R&D growing slower than revenue?

**Red flags:** Revenue growing but FCF declining; net income positive but OCF negative; EBITDA negative with significant debt; share count increasing >3%/yr (check SHARES_OUTSTANDING history).

---

### Phase 3 — Earnings Quality & Surprise History
**Accent:** `#3b82f6` (blue)

**Tool links:**
- `/earnings-history` — Earnings Surprises tracker

**Checklist highlights:**
- EPS beat rate over last 8 quarters > 75%?
- **Recent 4Q beat rate** — is execution improving or deteriorating vs the full 8Q record?
- Average EPS surprise > 3%? (but check: if actual EPS growth is flat or negative, high surprise % may just reflect conservative guidance, not real outperformance)
- Forward EPS estimates: are analyst revisions trending up or down quarter-over-quarter?
- Any "kitchen sink" quarters with large write-offs?
- Guidance trend: raising or cutting?
- Is EPS growth from genuine operations, or driven by buybacks/lower tax rate?

**Red flags:** Back-to-back revenue misses; EPS beat from buybacks/tax only; guidance cut mid-year; recurring "non-recurring" charges; beat rate strong over 8Q but deteriorating in last 4Q.

**Pro tip:** What matters is results vs expectations. A company growing EPS 20% against a 25% expectation will sell off. Always anchor to consensus, not absolute numbers. Watch forward estimate revisions — they lead price more reliably than past beats.

---

### Phase 4 — Valuation Assessment
**Accent:** `#f59e0b` (amber)

**Tool links:**
- `/valuation` — Valuation Snapshot (full ratio dashboard)
- `/stocks-glossary` — Stock Ratios Reference

**Checklist highlights:**
- P/E vs sector median — premium justified by growth? For high-growth companies use growth-adjusted P/E (normalized PEG = P/E ÷ EPS CAGR); for mature companies use strict bands
- **Negative PEG ratio** = forward earnings expected to decline; treat as value/mature stock regardless of other growth signals
- PEG ratio below 1.5? (below 1.0 = Peter Lynch's golden zone)
- EV/EBITDA vs sector? (not meaningful when EBITDA is negative — use EV/Sales instead for pre-profit companies)
- For high-growth companies: **EV/Revenue** (EV/Sales) is a better cross-company comparator than 52-week range position
- Check whether PEG-implied growth rate aligns with direct analyst EPS estimate forecasts — large divergence (>15pp) signals the DCF input may be unreliable
- Current price vs analyst target — for high-growth stocks, analyst targets frequently lag price; weigh accordingly
- Multiple contracted or expanded YTD vs earnings growth?

**Green flags:** P/FCF below 15× with consistent >10% FCF growth; stock at discount to 3-year average multiple; PEG below 1.0; EV/EBITDA below sector median with ROIC above sector; EV/Sales below 5× for a high-growth company.

---

### Phase 5 — Intrinsic Value (DCF)
**Accent:** `#6366f1` (indigo)

**Tool links:**
- `/dcf` — DCF Calculator

**Checklist highlights:**
- Base case: consensus revenue growth for years 1–3 (use direct analyst EPS estimate growth if available; PEG-implied CAGR as secondary source), conservative beyond
- Cap growth assumptions at **40%/yr** for the projection period — higher rates rarely hold over 5 years
- Bull case: company executes its best stated targets
- Bear case: include **negative growth scenarios** (down to -20%/yr for highly cyclical or leveraged companies)
- WACC 9–11% for most US large-cap
- Terminal growth 2–3%, never above GDP
- **Subtract net debt** (total debt minus cash) from enterprise value to get equity value per share — this is the number to compare against current price
- Margin of safety target: 20–40% below base case **equity** intrinsic value
- Verify share count against SHARES_OUTSTANDING registry — OVERVIEW's figure can lag for companies actively buying back
- Reverse DCF: what growth rate does today's price imply?

**Key metrics:** WACC, terminal growth rate, FCF margin projected, intrinsic equity value range (bear/base/bull), margin of safety, implied growth rate, net debt per share.

**Pro tip:** The most useful DCF output is the *reverse* — plug in the current price and solve for the implied growth rate. If the market implies 35% CAGR for 10 years and the business has never grown above 20%, the stock is priced for perfection. Also verify that the PEG-implied growth rate is consistent with direct analyst estimate forecasts — a large divergence means your DCF inputs need scrutiny.

---

### Phase 6 — Dividend & Capital Return
**Accent:** `#ec4899` (pink)

**Tool links:**
- `/dividends` — Dividend Safety Dashboard

**Checklist highlights:**

**Dividend payers:**
- FCF payout ratio below 70%?
- Earnings payout ratio below 60%?
- Dividend growth consistent over 5+ years?
- Is the company a Dividend Aristocrat (25+ years increases)?
- Debt-funded dividend? (debt rising while dividend paid)
- Yield anomalously high (>6% often signals expected cut)?

**Non-dividend payers:**
- FCF yield (FCF / live market cap using current price) — is cash being generated?
- **Net buyback yield** = (gross buybacks − SBC) / market cap. A company repurchasing $2B while granting $2B in stock options has a net buyback yield of 0% — no real capital return
- **Return on equity** (ROIC proxy) — is the reinvested capital generating returns above cost of capital?
- Is there a clear capital allocation policy, or is cash accumulating with no stated return mechanism?
- **Share count trajectory**: verify via SHARES_OUTSTANDING history — a buyback program offset entirely by SBC means shares are not actually shrinking

**Red flags (both):** Net buyback yield negative (SBC exceeds gross buybacks); payout ratio above 100% of FCF; yield trap; dividend cut history; high debt + buybacks simultaneously (EBITDA/Net Debt > 2× with active repurchases).

---

### Phase 7 — Sentiment, Insider Activity & Risk
**Accent:** `#ef4444` (red)

**Tool links:** (none defined in PHASES data)

**Checklist highlights:**

**News sentiment:**
- Is the 90-day news narrative positive, negative, or neutral?
- Is sentiment trending in or against the direction of your thesis?

**Insider activity (INSIDER_TRANSACTIONS — last 180 days):**
- Are insiders net buyers or sellers by dollar value?
- Net buy ratio > 60%: constructive signal — insiders have skin in the game
- Net sell ratio > 70%: warrants scrutiny, though selling alone may reflect diversification or liquidity needs
- Insider buying during an earnings trough is a particularly strong signal of management confidence

**Risk & position sizing:**
- Maximum position size for conviction level?
- Defined stop-loss or thesis break level?
- Macro risks (rate sensitivity, FX, commodities)?
- Catalyst timeline — when do you expect re-rating?
- Is this a core or satellite position?

---

## UI / Interaction Model

### Phase navigation

Left sidebar (or top tabs on mobile) lists all 7 phases. Clicking a phase selects it and scrolls to the detail panel. The active phase is highlighted with its accent colour.

### Phase detail panel

Each active phase shows:
1. **Objective** — short statement of what this phase answers
2. **Context** — multi-paragraph professional explanation (~200–300 words)
3. **Checklist** — items with colour-coded flag dots (green/yellow/red)
4. **Red Flags** — bulleted list of warning signs
5. **Green Flags** — bulleted list of positive signals
6. **Key Metrics** — name + description table
7. **App Tools** — clickable cards linking to the relevant live-data pages (using `useNavigate`)
8. **Pro Tip** — single expert insight callout

### CheckItem flag colours

| Flag value | Dot colour | Meaning |
|-----------|-----------|---------|
| `'green'` | `#10b981` | Strongly positive criterion |
| `'red'` | `#ef4444` | Risk / negative criterion |
| `'yellow'` | `#f59e0b` | Neutral / requires judgment |
| undefined | no dot | informational |

---

## AutoAnalysis Component

The page imports `AutoAnalysis` from `src/components/AutoAnalysis`. This component uses the stored Alpha Vantage key to run a full automated analysis when a ticker is entered — covering Phases 2–7 with growth-regime-adjusted scoring. See `docs/pages/auto-analysis.md` for full details.

**Data sources used (11 API calls):**
- Company overview, live price, income statement, balance sheet, cash flow — core financials
- Earnings history (8Q) — beat rate, surprise, trough detection
- Dividend history — payout coverage
- News sentiment — AV NLP scores
- **Earnings estimates** — forward EPS revision signals and DCF fallback growth rate
- **Insider transactions** — net buy/sell ratio over last 180 days
- **Shares outstanding history** — annualised dilution rate; fresher share count for DCF

**Phase-by-phase automation summary:**

| Phase | What the auto-analysis adds beyond the manual checklist |
|-------|--------------------------------------------------------|
| 2 — Financial Health | Regime-aware FCF scoring (margin vs conversion); negative EBIT/EBITDA guards; dynamic CAGR lookback |
| 3 — Earnings Quality | Recent 4Q beat rate vs historical; sandbagging cap when EPS growth ≤ 0; forward estimate revision signal |
| 4 — Valuation | Growth-adjusted P/E; EV/Sales for high-growth; negative EBITDA suppression; analyst estimate cross-check |
| 5 — Auto-DCF | Net-debt-adjusted equity value; analyst estimate fallback; bear floor to -20%; growth cap at 40% |
| 6 — Capital Return | Live market cap for yield; ROE sub-criterion; capital allocation clarity; dilution signal from share registry |
| 7 — Sentiment | Insider net buy/sell ratio with trough-modifier; rolling news trend |

---

## Limitations

- **Entirely static manual content** — the framework checklist does not pull live data. It is a process guide; the AutoAnalysis component provides the quantitative automation.
- **Phase 7 has no dedicated tool page** — insider and sentiment signals are surfaced only through the AutoAnalysis component.
- The framework is opinionated toward fundamental long-term equity analysis. It is less applicable to pure momentum, macro, or short-term trading approaches.
- **11 API calls per AutoAnalysis run** — on a free AV key (25/day), two full analyses exhaust the daily quota.
