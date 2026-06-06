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
- Revenue CAGR 3–5 years
- Gross margin stable or expanding?
- FCF consistently positive? FCF margin vs net margin?
- Net Debt / EBITDA below 3×?
- Interest coverage > 5×?
- Working capital trend (rising DSO = revenue quality concern)
- Piotroski F-Score ≥ 7
- Altman Z-Score > 2.6
- SG&A and R&D growing slower than revenue?

**Red flags:** Revenue growing but FCF declining; net income positive but OCF negative; share count increasing rapidly.

---

### Phase 3 — Earnings Quality & Surprise History
**Accent:** `#3b82f6` (blue)

**Tool links:**
- `/earnings-history` — Earnings Surprises tracker

**Checklist highlights:**
- EPS beat rate over last 8 quarters > 75%?
- Revenue beat rate > 65%?
- Average EPS surprise > 3%?
- Any "kitchen sink" quarters with large write-offs?
- Guidance trend: raising or cutting?

**Red flags:** Back-to-back revenue misses; EPS beat from buybacks/tax, not growth; guidance cut mid-year; recurring "non-recurring" charges.

**Pro tip:** What matters is results vs expectations. A company growing EPS 20% against a 25% expectation will sell off. Always anchor to consensus, not absolute numbers.

---

### Phase 4 — Valuation Assessment
**Accent:** `#f59e0b` (amber)

**Tool links:**
- `/valuation` — Valuation Snapshot (full ratio dashboard)
- `/stocks-glossary` — Stock Ratios Reference

**Checklist highlights:**
- P/E vs sector median — premium justified by growth?
- PEG ratio below 1.5?
- EV/EBITDA vs sector?
- P/FCF below 20× (FCF yield > 5%)?
- Current price vs analyst target and 52-week range?
- Multiple contracted or expanded YTD vs earnings growth?

**Green flags:** P/FCF below 15× with consistent >10% FCF growth; stock at discount to 3-year average multiple; PEG below 1.0; EV/EBITDA below sector median with ROIC above sector.

---

### Phase 5 — Intrinsic Value (DCF)
**Accent:** `#6366f1` (indigo)

**Tool links:**
- `/dcf` — DCF Calculator

**Checklist highlights:**
- Base case: consensus revenue growth for years 1–3, conservative beyond
- Bull case: company executes its best stated targets
- Bear case: growth halves, margins compress 200bps
- WACC 9–11% for most US large-cap
- Terminal growth 2–3%, never above GDP
- Margin of safety target: 20–40% below base case intrinsic value
- Reverse DCF: what growth rate does today's price imply?

**Key metrics:** WACC, terminal growth rate, FCF margin projected, intrinsic value range (bear/base/bull), margin of safety, implied growth rate.

**Pro tip:** The most useful DCF output is the *reverse* — plug in the current price and solve for the implied growth rate. If the market implies 35% CAGR for 10 years and the business has never grown above 20%, the stock is priced for perfection.

---

### Phase 6 — Dividend & Capital Return
**Accent:** `#ec4899` (pink)

**Tool links:**
- `/dividends` — Dividend Safety Dashboard

**Checklist highlights:**
- FCF payout ratio below 70%?
- Earnings payout ratio below 60%?
- Dividend growth consistent over 5+ years?
- Is the company a Dividend Aristocrat (25+ years increases)?
- Debt-funded dividend? (debt rising while dividend paid)
- Total shareholder yield = dividend yield + buyback yield?
- Yield anomalously high (>6% often signals expected cut)?

**Red flags:** Payout ratio above 100% of FCF; yield trap (stock collapsed, yield artificially high); dividend cut history; high debt + high payout in rising rate environment.

---

### Phase 7 — Risk & Position Sizing
**Accent:** `#ef4444` (red)

**Tool links:** (none defined in PHASES data)

**Checklist highlights:**
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

The page imports `AutoAnalysis` from `src/components/AutoAnalysis`. This component (details in its own documentation) may use the stored Alpha Vantage key to automatically run a quick analysis when a ticker is entered. It lives at the top or bottom of the framework page as a "quick start" feature.

---

## Limitations

- **Entirely static content** — the framework does not pull live data into the checklist. It is a process guide, not an automated screener.
- **Phase 7 has no tool links** — risk and position sizing is addressed conceptually but no dedicated in-app tool exists for it.
- The framework is opinionated toward fundamental long-term equity analysis. It is less applicable to pure momentum, macro, or short-term trading approaches.
