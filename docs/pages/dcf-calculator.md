# DCF Intrinsic Value Calculator

**Route:** `/dcf`  
**File:** `src/pages/DCFCalculator.tsx`

---

## Purpose

An interactive discounted cash flow (DCF) model that fetches real historical Free Cash Flow data from Alpha Vantage and lets the user adjust growth, terminal growth, and discount rate assumptions via sliders. Outputs intrinsic value per share, enterprise value, and a sensitivity table. Designed to produce a valuation *range*, not a precise price target.

---

## Data Source

**API:** Alpha Vantage  
**Key storage:** `localStorage` → `av_api_key`  
**API calls per search:** 2 (sequential, 1 200 ms sleep between them)

| Call # | AV function | Data used |
|--------|-------------|-----------|
| 1 | `OVERVIEW` | `SharesOutstanding`, `AnalystTargetPrice`, `Name`, `Sector` |
| 2 | `CASH_FLOW` | `annualReports[]` — up to 6 most recent |

### Cash flow report fields used

```
fiscalDateEnding
operatingCashflow
capitalExpenditures
```

---

## Data Transformation

### FCF History

For each of the 6 most recent annual cash flow reports:

```
FCF = operatingCashflow − |capitalExpenditures|
```

CapEx is stored as a negative number in AV; `Math.abs()` is applied before subtracting to ensure the formula is correct regardless of sign convention.

Records where either field is `"None"` are excluded. The resulting array is **reversed** so it displays oldest-to-newest in the UI.

### Base FCF

`baseFCF` = FCF computed from `annualReports[0]` (the most recent fiscal year). This is the starting point for projections.

If `baseFCF ≤ 0`, the DCF model is disabled and a warning is shown. The model requires positive FCF — negative-FCF companies (pre-profit growth stocks) are not suited for this approach.

---

## DCF Model (`computeDCF`)

### Inputs

| Parameter | Default | Range |
|-----------|---------|-------|
| Growth Rate (Yr 1–5) | 10% | 1%–40% per year |
| Terminal Growth Rate | 3% | 1%–7% |
| Discount Rate (WACC) | 10% | 5%–20% |
| Base FCF | auto-filled from latest annual data | — |
| Shares Outstanding | auto-filled from OVERVIEW | — |

### Projection (5 years)

```
FCF_t = FCF_{t-1} × (1 + growthRate)
```

Year 1 starts from `baseFCF`:
```
Year 1 FCF = baseFCF × (1 + growthRate)
Year 2 FCF = Year 1 FCF × (1 + growthRate)
... (compounded for 5 years)
```

### Terminal Value (Gordon Growth Model, end of Year 5)

```
TV = Year5_FCF × (1 + terminalGrowth) / (discountRate − terminalGrowth)
```

Guard: if `discountRate ≤ terminalGrowth`, the function returns `null` (mathematically undefined).

### Present Value

Each projected FCF is discounted:
```
PV_t = FCF_t / (1 + discountRate)^t
```

Terminal value discounted:
```
PV_TV = TV / (1 + discountRate)^5
```

### Enterprise Value

```
EV = Σ PV_t (t=1..5) + PV_TV
```

### Intrinsic Value Per Share

```
IV/share = EV / SharesOutstanding
```

> **Model caveat (shown on page):** This is a simplified equity DCF — it does **not** subtract net debt from enterprise value. The output should be treated as a range, not a precise target. Stock-based compensation is also not deducted from FCF.

---

## Sensitivity Table

A 5×5 grid crossing:
- **Rows:** Discount rates `[7%, 9%, 11%, 13%, 15%]`
- **Columns:** Growth rates `[5%, 10%, 15%, 20%, 25%]`

For each cell, `computeDCF` is called with the cell's rate/growth combination and the current `terminalGrowth` and `baseFCF`. The result (`intrinsicPerShare`) is:
- **Green** if above the entered current price
- **Red** if below
- **Highlighted** (purple background, bold) for the currently selected WACC + growth combination

---

## Margin of Safety

```
MoS = (intrinsicValue − currentPrice) / currentPrice × 100
```

`currentPrice` is taken from the user-entered field. If empty, falls back to `AnalystTargetPrice` from the OVERVIEW call.

| MoS | Background colour |
|-----|------------------|
| > +20% | Green tint |
| −20% to +20% | Amber tint |
| < −20% | Red tint |

---

## UI Components

### FCF History bar

Horizontal list of year + FCF value for up to 6 years. Latest year marked with ★. Negative FCF shown in red.

### Assumption sliders

Three `<input type="range">` sliders with live labels:
- Growth Rate: 1%–40%, step 1%
- Terminal Growth: 1%–7%, step 0.5%
- Discount Rate: 5%–20%, step 0.5%

All re-compute the DCF result reactively via `useMemo`.

### Result tiles

| Tile | Value |
|------|-------|
| INTRINSIC VALUE / SHARE | amber, large |
| ENTERPRISE VALUE | formatted fmtMoney |
| PV OF TERMINAL VALUE | + % of total EV |
| MARGIN OF SAFETY | conditional colour |

### Projected FCF table

Two rows × 6 columns (Year 1–5 + Terminal):
- **Projected FCF** — nominal future values
- **Present Value** — discounted values (shown in purple)

---

## Shared Utilities

From `src/lib/avClient.ts`:
- `avFetch(fn, symbol, apiKey)` — fetch wrapper with rate-limit error handling
- `nn(val)` — parse string to number, treating `"None"` as null
- `fmtMoney(val)` — format number to T/B/M/K/$X.XX
- `sleep(ms)` — promise-based delay

---

## Limitations

- **Equity DCF, no net debt adjustment** — Enterprise value is used as a proxy for equity value. For highly leveraged companies, this overstates intrinsic value per share.
- **No SBC deduction** — Stock-based compensation is not subtracted from FCF, which inflates intrinsic value for companies that compensate heavily in stock.
- **Single growth rate for all 5 years** — Real DCF models often use a declining growth schedule (high growth fading to terminal). This model assumes constant growth for simplicity.
- **Negative FCF companies unsupported** — The page shows a warning and disables the model output if `baseFCF ≤ 0`.
- **No caching** — Every search fires 2 API calls.
