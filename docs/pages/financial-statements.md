# Financial Statements

**Route:** `/financials`  
**File:** `src/pages/FinancialStatements.tsx`

---

## Purpose

Displays the three core financial statements — Income Statement, Balance Sheet, and Cash Flow Statement — for any US-listed ticker, along with derived ratio and earnings-quality tabs. Each tab auto-detects notable changes and surfaces them as colour-coded flags so users can spot issues without reading every line item.

---

## Data Source

**API:** Alpha Vantage (REST, JSON)  
**Key storage:** `localStorage` under the key `av_api_key` (shared across all pages via `LS_AV_KEY` constant in `src/lib/avClient.ts`)  
**Rate limit:** 25 calls/day on the free tier. A 1 100 ms `sleep()` is injected between each sequential call to avoid hitting the per-minute limit.

### Endpoints called (3 sequential requests)

| Call # | AV `function` param | Data returned |
|--------|---------------------|---------------|
| 1 | `INCOME_STATEMENT` | `annualReports[]` + `quarterlyReports[]` |
| 2 | `BALANCE_SHEET` | `annualReports[]` + `quarterlyReports[]` |
| 3 | `CASH_FLOW` | `annualReports[]` + `quarterlyReports[]` |

Each report is a flat object of string fields (e.g. `"totalRevenue": "383285000000"`). The string `"None"` is treated as missing data.

---

## State Shape

```ts
interface FinData {
  incomeAnnual:     AVReport[];
  incomeQuarterly:  AVReport[];
  balanceAnnual:    AVReport[];
  balanceQuarterly: AVReport[];
  cashflowAnnual:   AVReport[];
  cashflowQuarterly: AVReport[];
}
```

The user toggles between **Annual** and **Quarterly** periods. The active period selects which array is used for tables and flags.

---

## Tabs

### 1. Income Statement (`income`)

**Rows displayed (4 most recent periods):**

| Label | AV field key |
|-------|-------------|
| Revenue | `totalRevenue` |
| Cost of Revenue | `costOfRevenue` |
| Gross Profit | `grossProfit` |
| R&D | `researchAndDevelopment` |
| SG&A | `sellingGeneralAndAdministrative` |
| Operating Income | `operatingIncome` |
| EBITDA | `ebitda` |
| Net Income | `netIncome` |
| EPS (diluted) | `dilutedEPS` |

**YoY column:** For annual data, compares period 0 vs period 1. For quarterly, compares period 0 vs period 4 (same quarter prior year).

**Auto-detected flags (`incomeFlags`):**

| Flag | Trigger condition | Severity |
|------|-------------------|----------|
| Revenue declining | YoY < −5% | warn |
| Strong revenue growth | YoY > +20% | good |
| Gross margin compression | GM delta < −2pp | warn |
| Gross margin expansion | GM delta > +2pp | good |
| R&D growing faster than revenue | R&D YoY > Revenue YoY + 10pp | info |
| SG&A growing faster than revenue | SG&A YoY > Revenue YoY + 10pp | warn |
| Net income declining sharply | NI YoY < −15% | warn |
| Very low effective tax rate | Tax / EBT < 5% | info |
| High effective tax rate | Tax / EBT > 40% | info |

### 2. Balance Sheet (`balance`)

**Rows displayed:**

| Label | AV field key |
|-------|-------------|
| Cash & Equivalents | `cashAndCashEquivalentsAtCarryingValue` |
| Short-term Investments | `shortTermInvestments` |
| Total Current Assets | `totalCurrentAssets` |
| Total Assets | `totalAssets` |
| Total Current Liabilities | `totalCurrentLiabilities` |
| Long-term Debt | `longTermDebt` |
| Total Liabilities | `totalLiabilities` |
| Stockholders' Equity | `totalShareholderEquity` |
| Shares Outstanding | `commonStockSharesOutstanding` (displayed in millions/billions) |

**Auto-detected flags (`balanceFlags`):**

| Flag | Trigger | Severity |
|------|---------|----------|
| Cash declining significantly | Cash YoY < −25% | warn |
| Long-term debt growing | LTD YoY > +20% | warn |
| Negative stockholders equity | equity < 0 | warn |
| Share dilution | Shares YoY > +3% | warn |
| Share buybacks active | Shares YoY < −3% | good |
| High leverage ratio | Total Liabilities / Total Assets > 85% | warn |
| Current ratio < 1 | Current Assets / Current Liabilities < 1.0 | warn |

### 3. Cash Flow (`cashflow`)

**Rows displayed:**

| Label | AV field key |
|-------|-------------|
| Operating Cash Flow | `operatingCashflow` |
| CapEx | `capitalExpenditures` |
| Free Cash Flow | Computed: OCF − \|CapEx\| |
| Dividends Paid | `dividendPayout` |
| Share Repurchases | `paymentsForRepurchaseOfCommonStock` |
| Net Investing | `cashflowFromInvestment` |
| Net Financing | `cashflowFromFinancing` |

**Auto-detected flags (`cashflowFlags`):**

| Flag | Trigger | Severity |
|------|---------|----------|
| Operating CF lags net income | OCF < Net Income × 0.5 (when NI > 0) | warn |
| Negative free cash flow | FCF < 0 | warn |
| FCF growing strongly | FCF YoY > +25% (prev FCF was positive) | good |
| FCF declining significantly | FCF YoY < −30% (FCF still positive) | warn |
| Significant share repurchases | Buybacks > $100M | good |

### 4. Ratios (`ratios`)

Derived from the most recent annual or quarterly reports. All calculated client-side, no additional API calls.

| Ratio | Formula | Source fields |
|-------|---------|---------------|
| Gross Margin | Gross Profit / Revenue | `grossProfit`, `totalRevenue` |
| Operating Margin | Operating Income / Revenue | `operatingIncome`, `totalRevenue` |
| Net Margin | Net Income / Revenue | `netIncome`, `totalRevenue` |
| FCF Margin | FCF / Revenue | computed FCF, `totalRevenue` |
| Current Ratio | Current Assets / Current Liabilities | `totalCurrentAssets`, `totalCurrentLiabilities` |
| Debt-to-Equity | Long-term Debt / Equity | `longTermDebt`, `totalShareholderEquity` |
| ROE | Net Income / Equity | `netIncome`, `totalShareholderEquity` |
| ROA | Net Income / Total Assets | `netIncome`, `totalAssets` |

### 5. Quality (`quality`)

Contains two composite scores computed entirely from available financial statement data:

**Piotroski F-Score (0–9)**  
Each of the 9 binary signals contributes 1 point:

| Signal | Source |
|--------|--------|
| ROA > 0 | `netIncome`, `totalAssets` |
| OCF > 0 | `operatingCashflow` |
| ROA improving YoY | compared with prior period |
| Accruals: OCF > ROA | Earnings quality |
| Leverage improving (LTD/Assets decreasing) | `longTermDebt`, `totalAssets` |
| Current ratio improving | `totalCurrentAssets`, `totalCurrentLiabilities` |
| No new share issuance | `commonStockSharesOutstanding` |
| Gross margin improving | `grossProfit`, `totalRevenue` |
| Asset turnover improving | `totalRevenue`, `totalAssets` |

Score ≥ 7 = financially strong; ≤ 3 = weak.

**Altman Z-Score**  
For non-financial companies:  
`Z = 1.2×X1 + 1.4×X2 + 3.3×X3 + 0.6×X4 + 1.0×X5`

| Variable | Formula |
|----------|---------|
| X1 | Working Capital / Total Assets |
| X2 | Retained Earnings / Total Assets |
| X3 | EBIT / Total Assets |
| X4 | Market Value Equity / Total Liabilities (approximated with book equity) |
| X5 | Revenue / Total Assets |

Z > 2.6 = safe; 1.8–2.6 = grey zone; < 1.8 = distress.

---

## Number Formatting

The local `fmt()` function formats raw numbers (in dollars from AV) into human-readable strings:

| Magnitude | Format |
|-----------|--------|
| ≥ $1T | `$X.XXt` |
| ≥ $1B | `$X.XB` |
| ≥ $1M | `$XM` |
| ≥ $1K | `$XK` |
| < $1K | `$X.XX` |

`"None"` strings from AV are parsed by the local `n()` helper (returns `undefined`) and displayed as `—`.

---

## Educational Content (inline)

Each statement tab includes an expandable `LearnRow` per line item with:
- **Short-term impact** — how this metric moves the stock on earnings day
- **Long-term / valuation** — how analysts incorporate it into models
- **Gotcha** — common misreading or manipulation technique to watch for

This content is static (hardcoded strings in the component).

---

## Limitations / Notes

- **No caching** — every search fires 3 live API calls. Repeated lookups within the same session re-fetch.
- **Free tier**: 25 requests/day total across all pages sharing the same key.
- The Altman Z-Score uses book equity as a proxy for market cap in X4, which understates Z for companies trading at a large premium to book.
- Financial Statements has its own local copy of `avFetch` and `sleep` (not importing from `src/lib/avClient.ts`) — a minor duplication.
