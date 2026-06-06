# Dividend Safety Dashboard

**Route:** `/dividends`  
**File:** `src/pages/DividendSafety.tsx`

---

## Purpose

Evaluates whether a company's dividend is sustainable. Combines dividend payment history, free cash flow coverage, payout ratio, and year-over-year growth to produce a three-tier safety rating. Particularly relevant for Wheel strategy traders who collect premium on dividend-paying stocks and need to avoid dividend cut risk.

---

## Data Source

**API:** Alpha Vantage  
**Key storage:** `localStorage` → `av_api_key`  
**API calls per search:** 3 (sequential, 1 100 ms sleep between each)

| Call # | AV function | Data used |
|--------|-------------|-----------|
| 1 | `DIVIDENDS` | `data[]` — up to 40 most recent dividend payments |
| 2 | `CASH_FLOW` | `annualReports[]` — up to 6 years |
| 3 | `INCOME_STATEMENT` | `annualReports[]` — up to 6 years |

### Field mapping

**DIVIDENDS** (`data[]`):
```ts
interface DividendEntry {
  ex_dividend_date: string;  // "2024-11-08"
  amount: string;            // per-share dividend amount
}
```

**CASH_FLOW** (`annualReports[0]`):
- `operatingCashflow`
- `capitalExpenditures`
- `dividendPayout` — total dividends paid (absolute value used)

**INCOME_STATEMENT** (`annualReports[0]`):
- `netIncome`

---

## Data Transformation

### Annual DPS (last 12 months)

Filters dividend entries where `ex_dividend_date ≥ today − 1 year`, then sums all `amount` values:
```
annualDPS = Σ amount for entries in last 12 months
```

### FCF (most recent annual)

```
FCF = operatingCashflow − |capitalExpenditures|
```

CapEx sign is normalised with `Math.abs()` before subtraction.

### Payout Ratio

```
payoutRatio = |dividendPayout| / netIncome
```

Only computed when `netIncome > 0`. Uses total dividends paid from the cash flow statement (actual cash outflow) divided by net income — this is more accurate than EPS-based payout ratios.

### FCF Coverage

```
fcfCoverage = FCF / |dividendPayout|
```

Only computed when `dividendPayout > 0`.

### Years of Payments

Counts the unique calendar years present in the dividend history array (up to 40 records). Used as a proxy for dividend streak length.

### Annual Dividend Chart Data

Groups all dividend entries by year (`ex_dividend_date.slice(0, 4)`), sums amounts per year. Sorted ascending by year for the area chart.

### YoY Dividend Growth

```
divGrowth = (latestYear.total − prevYear.total) / prevYear.total × 100
```

Compares the two most recent complete years in the aggregated annual chart data.

### YoY Per-Payment Change (table)

For each payment in the 16-row table, compares to `divs[i + 4]` — the payment 4 entries back, approximating the same quarter one year ago:
```
chg = (amount − prevSameAmount) / prevSameAmount × 100
```

---

## Safety Rating (`computeSafety`)

Returns one of three values based on priority rules:

| Rating | Condition |
|--------|-----------|
| **At Risk** | `payoutRatio > 1.0` (paying out more than earned) OR `payoutRatio < 0` OR `fcfCoverage < 0` |
| **Watch** | `payoutRatio > 0.75` OR `fcfCoverage < 1.2` OR `yearsOfPayments < 3` |
| **Safe** | None of the above apply |

Colour mapping:
- Safe → `#10b981` (green)
- Watch → `#f59e0b` (amber)
- At Risk → `#ef4444` (red)

---

## UI Sections

### Safety badge

Large coloured badge (Safe / Watch / At Risk) with explanatory text. Only shown if `paysDividends` is true (at least one dividend with a non-null, non-zero amount exists).

### Dividend Metrics grid

| Tile | Value | Colour thresholds |
|------|-------|-------------------|
| ANNUAL DPS (LTM) | summed last-12m payments, 4 dp | green |
| PAYOUT RATIO | payoutRatio × 100% | <60% green, <80% amber, ≥80% red |
| FCF COVERAGE | fcfCoverage × | ≥1.5 green, ≥1.0 amber, <1.0 red |
| FREE CASH FLOW | fmtMoney | positive green, negative red |
| DIVIDENDS PAID | fmtMoney from CF statement | neutral |
| YoY DIV GROWTH | % | positive green, negative red |
| YEARS OF PAYMENTS | count | ≥10 green, ≥5 amber, <5 red; note if ≥25 ("Aristocrat candidate") |
| PAYMENTS TRACKED | raw count | neutral |

### Benchmark reference card

Static two-column table showing:
- **Payout ratio benchmarks**: <40%, 40–60%, 60–75%, 75–100%, >100% with colour and label
- **FCF coverage benchmarks**: >2.0×, 1.5–2.0×, 1.0–1.5×, 0.5–1.0×, <0.5×

### Annual Dividend Per Share History chart

Area chart (Recharts `AreaChart`) of aggregated annual DPS, only shown if ≥ 2 years of data. Green gradient fill, dot markers.

### Recent Dividend Payments table

Up to 16 rows showing:
- Ex-dividend date
- Amount per share (4 decimal places)
- YoY change % (comparing to `divs[i + 4]`)

---

## No-Dividend State

If `paysDividends` is false (no payments found or all amounts are 0/null), a warning card is shown instead of all metrics:

> `"{TICKER} does not pay a dividend"` — with a note that the stock may still be suitable for the Wheel via premium only.

---

## Shared Utilities

From `src/lib/avClient.ts`:
- `avFetch`, `nn`, `fmtMoney`, `sleep`

---

## Limitations

- **Dividend history capped at 40 entries** — for companies paying quarterly, this covers ~10 years. Weekly or monthly payers may have shorter coverage.
- **Payout ratio uses annual net income vs annual dividends paid** — for companies with seasonally lumpy earnings, this can be misleading. The FCF coverage metric is more reliable.
- **YoY per-payment comparison assumes quarterly cadence** — `divs[i + 4]` as the prior-year equivalent only works cleanly for quarterly payers. Monthly payers (12 per year) or semi-annual payers (2 per year) will show incorrect YoY changes.
- **No adjustment for special dividends** — large one-time special dividends inflate the annualDPS figure.
- **Years of payments ≠ consecutive years** — the `yearSet` count of unique years does not verify continuity; a company could have skipped a year and still show 10 years.
- **3 API calls per search** — the most expensive page in terms of rate limit usage (3 of 25 free daily calls).
