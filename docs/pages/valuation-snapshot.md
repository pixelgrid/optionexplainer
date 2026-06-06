# Valuation Snapshot

**Route:** `/valuation`  
**File:** `src/pages/ValuationSnapshot.tsx`

---

## Purpose

A one-stop valuation dashboard that pulls all key multiples, margins, growth rates, and price context for a ticker from two API calls. Designed to give a complete picture in under 10 seconds without requiring the user to navigate multiple data sources.

---

## Data Source

**API:** Alpha Vantage  
**Key storage:** `localStorage` → `av_api_key`  
**API calls per search:** 2 (sequential, 1 200 ms sleep between them)

| Call # | AV function | Data used |
|--------|-------------|-----------|
| 1 | `OVERVIEW` | All valuation, profitability, growth, and dividend fields |
| 2 | `GLOBAL_QUOTE` | Live price (`05. price`) |

### OVERVIEW fields consumed

```
Name, Exchange, Sector, Industry
MarketCapitalization, SharesOutstanding
TrailingPE, ForwardPE, PEGRatio
PriceToBookRatio, PriceToSalesRatioTTM
EVToRevenue, EVToEBITDA
EPS, DilutedEPSTTM
DividendYield, DividendPerShare
ProfitMargin, OperatingMarginTTM, GrossProfitTTM
ReturnOnAssetsTTM, ReturnOnEquityTTM
RevenueTTM, RevenuePerShareTTM
QuarterlyEarningsGrowthYOY, QuarterlyRevenueGrowthYOY
AnalystTargetPrice, Beta
52WeekHigh, 52WeekLow
50DayMovingAverage, 200DayMovingAverage
EBITDA
```

All values are strings from AV; parsed with the shared `nn()` helper from `src/lib/avClient.ts`. `"None"` → `null`.

### Validation

If `overview.Name` is missing or `"None"` after fetch, an error is thrown: `"No data found for <TICKER>"`. This catches invalid tickers cleanly.

---

## Derived Computations (client-side)

| Computed value | Formula |
|----------------|---------|
| **52-week range position** | `(price − low52) / (high52 − low52) × 100` — shown as % of range |
| **Analyst upside** | `(target − price) / price × 100` |
| **Above 50-day MA** | `price > ma50` |
| **Above 200-day MA** | `price > ma200` |
| **Gross Margin** | `GrossProfitTTM / RevenueTTM × 100` (AV doesn't return gross margin directly as a ratio) |
| **Operating Margin** | `OperatingMarginTTM × 100` (AV returns as decimal) |
| **Net Profit Margin** | `ProfitMargin × 100` |
| **ROE / ROA** | `ReturnOnEquityTTM × 100` / `ReturnOnAssetsTTM × 100` |
| **Revenue growth** | `QuarterlyRevenueGrowthYOY × 100` |
| **Earnings growth** | `QuarterlyEarningsGrowthYOY × 100` |

---

## UI Sections

### Company header

- Company name, ticker, exchange
- Sector (badge) and Industry (text)
- Live price from GLOBAL_QUOTE
- Market Cap (formatted T/B/M)
- Beta (amber if > 1.5)

### 52-week range bar

A visual progress bar from `low52` to `high52` with a dot at the current `price` position. Below it: the % of range value, plus ▲/▼ indicators for 50MA and 200MA.

### Analyst consensus target

Shown only if both `AnalystTargetPrice` and `price` are available. Displays:
- Target price
- Implied upside % (green if positive, red if negative)
- Card border turns green (>+10% upside) or red (<−10%) accordingly

### Valuation Multiples section

Tile grid, each with a colour-coded value:

| Tile | Source field | Colour thresholds |
|------|-------------|-------------------|
| P/E (TTM) | `TrailingPE` | <15 green, <25 amber, <40 orange, ≥40 red; negative = red |
| P/E (Forward) | `ForwardPE` | Same as trailing |
| P/B Ratio | `PriceToBookRatio` | <1 blue, <3 green, <6 amber, ≥6 red |
| P/S (TTM) | `PriceToSalesRatioTTM` | <2 green, <6 amber, <12 orange, ≥12 red |
| PEG Ratio | `PEGRatio` | <1 green, <2 amber, ≥2 red |
| EV/EBITDA | `EVToEBITDA` | <10 green, <20 amber, <35 orange, ≥35 red |
| EV/Revenue | `EVToRevenue` | neutral (no colour rule) |
| EPS (TTM) | `DilutedEPSTTM` | neutral |

> **Note:** Thresholds are general market benchmarks, not sector-adjusted. High-growth tech routinely exceeds these and appears "red" legitimately. The page includes a disclaimer to this effect.

### Profitability & Returns section

| Tile | Source | Colour |
|------|--------|--------|
| Gross Margin | Computed (see above) | neutral |
| Operating Margin | `OperatingMarginTTM` | >20% green, >10% amber, >0 orange, <0 red |
| Net Profit Margin | `ProfitMargin` | Same thresholds |
| ROE (TTM) | `ReturnOnEquityTTM` | >20% green, >10% amber, else red |
| ROA (TTM) | `ReturnOnAssetsTTM` | >8% green, >4% amber, else red |
| Revenue (TTM) | `RevenueTTM` | formatted fmtBig |
| EBITDA | `EBITDA` | formatted fmtBig |

### Growth & Income section

| Tile | Source | Colour |
|------|--------|--------|
| Revenue Growth (QoQ YoY) | `QuarterlyRevenueGrowthYOY` | >10% green, >0 amber, <0 red |
| Earnings Growth (QoQ YoY) | `QuarterlyEarningsGrowthYOY` | same |
| Dividend Yield | `DividendYield` | green if > 0, muted if none |
| Dividend / Share | `DividendPerShare` | neutral |
| Shares Outstanding | `SharesOutstanding` | formatted B/M |

---

## Number Formatting

`fmtBig()` (local helper):

| Magnitude | Format |
|-----------|--------|
| ≥ $1T | `$X.XXt` |
| ≥ $1B | `$X.XB` |
| ≥ $1M | `$XM` |
| < $1M | `$X` |

`fmt()` for ratios: `(n × mult).toFixed(2) + suffix` — used for EV/Revenue etc.

---

## Limitations

- Analyst target (`AnalystTargetPrice`) is a single consensus mean from AV — it does not show the range or number of analysts.
- Growth fields are quarter-over-quarter year-on-year (single data point), not multi-year CAGR.
- Colour thresholds are not sector-adjusted; a 40× P/E for a SaaS business at 30% growth is reasonable but shows red.
- No caching; every search fires 2 API calls.
