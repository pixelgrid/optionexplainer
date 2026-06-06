# Earnings Surprises

**Route:** `/earnings-history`  
**File:** `src/pages/EarningsSurprises.tsx`

---

## Purpose

Tracks historical EPS beats and misses for a ticker over up to 20 quarters. Designed to help options traders decide whether to sell premium into earnings (consistent beaters with small surprises are ideal) or avoid short volatility positions (inconsistent or large-miss stocks).

---

## Data Source

**API:** Alpha Vantage  
**Endpoint:** `EARNINGS`  
**Helper:** `avFetch()` from `src/lib/avClient.ts`  
**Key storage:** `localStorage` → `av_api_key`  
**API calls per search:** 1 (+ 300 ms sleep after)

### Response shape

```ts
{
  symbol: string;
  quarterlyEarnings: QuarterlyEarning[];
  annualEarnings: AnnualEarning[];
}
```

```ts
interface QuarterlyEarning {
  fiscalDateEnding: string;       // "2024-09-30"
  reportedDate: string;           // actual filing date
  reportedEPS: string;            // e.g. "1.64"
  estimatedEPS: string;           // analyst consensus
  surprise: string;               // absolute $ difference
  surprisePercentage: string;     // % difference
}

interface AnnualEarning {
  fiscalDateEnding: string;
  reportedEPS: string;
}
```

All fields are strings. `"None"` is treated as null by the `nn()` helper.

---

## Data Transformation

The component takes the first **20 quarterly records** (most recent first) and filters to those where both `estimatedEPS` and `reportedEPS` are non-null — these are `withEstimates`.

### Derived statistics

| Metric | Formula |
|--------|---------|
| Beat Rate | `beats.length / withEstimates.length × 100` |
| Average Surprise | Mean of `surprisePercentage` across `withEstimates` |
| Beat/Miss Streak | Walk `withEstimates` from index 0 forward; count consecutive quarters in the same direction |
| Quarters Tracked | `withEstimates.length` |
| Beats / Misses count | Filter by `surprisePercentage > 0` vs `< 0` |

A quarter is a **beat** if `surprisePercentage > 0`, a **miss** if `≤ 0`.

### Chart data

Last **12 quarters** of `withEstimates`, **reversed** (so oldest is leftmost on the chart):

```ts
{
  period: string;    // "2024-09" (YYYY-MM)
  surprise: number;  // surprisePercentage rounded to 2 dp
  reported: number;  // reportedEPS
  estimated: number; // estimatedEPS
}
```

---

## UI Sections

### Summary stat boxes

| Box | Value | Colour rule |
|-----|-------|-------------|
| BEAT RATE | `beatRate.toFixed(0)%` | ≥70% → green, ≥50% → amber, <50% → red |
| AVG SURPRISE | `avgSurprise.toFixed(1)%` (with + sign) | >2% → green, >0% → amber, <0% → red |
| CURRENT STREAK | `NQ BEATS` or `NQ MISSES` | beat → green, miss → red |
| QUARTERS TRACKED | count with estimate | neutral |
| BEATS / MISSES | `X / Y` | neutral |

### EPS Surprise % chart

Bar chart (Recharts `BarChart`) of `surprise` per period.  
- Each bar coloured individually: green if `≥ 0`, red if `< 0`.  
- Reference line at `y = 0`.

### Quarterly EPS Detail table

Up to **16 rows**, showing:

| Column | Source |
|--------|--------|
| Period | `fiscalDateEnding` (YYYY-MM) |
| Report Date | `reportedDate` |
| Estimated EPS | `estimatedEPS` as `$X.XX` |
| Reported EPS | `reportedEPS` as `$X.XX` |
| Surprise | `surprise` (absolute $) |
| Surprise % | `surprisePercentage` with badge (green/red/neutral) |

### Annual EPS History

Up to **8 annual records**, reversed (oldest left). Displayed as a simple horizontal list of year + EPS value. Negative EPS shown in red.

---

## Colour Logic (Surprise %)

| Condition | Colour |
|-----------|--------|
| `surprisePercentage > 0` | `#10b981` (green) |
| `surprisePercentage < 0` | `#ef4444` (red) |
| exactly 0 or null | `var(--text)` neutral |

---

## Educational Context (static)

Three inline cards explain why surprise history matters for options:
1. **Consistent beaters → sell premium** (short straddles/strangles edge)
2. **Volatile misses → avoid short vol** (miss distribution risk)
3. **Beat streak signals momentum** (guidance raises expand multiples)

---

## Limitations

- Only one API call needed, so this is the least rate-limit-intensive page (1 of 25 daily calls).
- `surprise` and `surprisePercentage` come directly from Alpha Vantage — they represent the difference vs analyst consensus at the time of reporting, not vs any in-house estimate.
- No caching; every search re-fetches.
- The "current streak" counts from the most recent quarter backward; if data is missing for recent quarters, the streak may start later in the array than expected.
