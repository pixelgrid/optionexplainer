// ── Auto-Analysis Scoring Engine v2 ──────────────────────────────────────────
// Fixes applied: 1–9 per review doc (MRVL identified bugs + improvements)

import { nn } from './avClient';

// ── Shared types ──────────────────────────────────────────────────────────────

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
export type FlagType = 'good' | 'bad' | 'neutral';
export type GrowthRegime = 'high_growth' | 'moderate_growth' | 'mature' | 'recovery' | 'inflection';

export interface ScoreDetail {
  label: string;
  value: string;
  points: number;
  maxPoints: number;
  note: string;
  warning?: string;   // yellow inline badge e.g. "GAAP basis — SBC 14% of revenue"
}

export interface DCFScenario {
  label: 'Bear' | 'Base' | 'Bull';
  growthRate: number;      // decimal e.g. 0.15
  intrinsicValue: number | null;  // per share
  marginOfSafety: number | null;  // decimal
  method: string;          // human-readable description of inputs
}

export interface PhaseScore {
  phase: number;
  title: string;
  score: number;
  grade: Grade;
  headline: string;
  summary: string;
  details: ScoreDetail[];
  flags: { text: string; type: FlagType }[];
  dcfScenarios?: DCFScenario[];
  regime?: GrowthRegime;
  regimeLabel?: string;
}

export interface GrowthRegimeInfo {
  regime: GrowthRegime;
  impliedEpsCAGR: number | null;   // from P/E ÷ PEG
  recentEpsGrowth: number | null;  // QuarterlyEarningsGrowthYOY
  revCagr: number | null;          // 3yr historical revenue CAGR
  isTrough: boolean;               // LTM EPS < 3yr prior
  label: string;                   // human-readable
}

// ── Raw AV types ──────────────────────────────────────────────────────────────

export interface AVOverview {
  Name: string; Symbol: string; Exchange: string;
  Sector: string; Industry: string;
  MarketCapitalization: string; SharesOutstanding: string;
  TrailingPE: string; ForwardPE: string; PEGRatio: string;
  PriceToBookRatio: string; PriceToSalesRatioTTM: string;
  EVToRevenue: string; EVToEBITDA: string;
  EPS: string; DividendYield: string; DividendPerShare: string;
  ProfitMargin: string; OperatingMarginTTM: string;
  ReturnOnAssetsTTM: string; ReturnOnEquityTTM: string;
  RevenueTTM: string; QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string; Beta: string;
  '52WeekHigh': string; '52WeekLow': string;
  EBITDA: string; Currency: string;
}

export interface AVReport { fiscalDateEnding: string; [k: string]: string }

export interface AVEarningsQuarter {
  fiscalDateEnding: string; reportedDate: string;
  reportedEPS: string; estimatedEPS: string;
  surprise: string; surprisePercentage: string;
}

export interface AVEarningsAnnual {
  fiscalDateEnding: string; reportedEPS: string;
}

export interface AVDividendEntry { ex_dividend_date: string; amount: string }

export interface AVNewsItem {
  title: string; summary: string; source: string;
  time_published: string;
  overall_sentiment_score: number; overall_sentiment_label: string;
  ticker_sentiment?: { ticker: string; ticker_sentiment_score: string; ticker_sentiment_label: string }[];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function gradeFromScore(s: number): Grade {
  if (s >= 90) return 'A+'; if (s >= 80) return 'A';
  if (s >= 70) return 'B+'; if (s >= 60) return 'B';
  if (s >= 50) return 'C+'; if (s >= 40) return 'C';
  if (s >= 30) return 'D';  return 'F';
}

function r(v: AVReport, key: string): number | null { return nn(v[key]) }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function pctLabel(v: number | null): string {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}
function xLabel(v: number | null): string {
  if (v == null) return '—'; return v.toFixed(1) + 'x';
}
function fmt2(v: number | null): string {
  if (v == null) return '—'; return v.toFixed(1);
}

function parseAVDate(s: string): Date | null {
  // AV format: "20240115T130000"
  try {
    return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`);
  } catch { return null; }
}

function daysBefore(d: Date, n: number): Date {
  const t = new Date(d); t.setDate(t.getDate() - n); return t;
}

// ── Growth Regime Detector ────────────────────────────────────────────────────
// Fix 9 architectural: single shared function, computed once, passed to phases 3,4,5

export function detectGrowthRegime(
  ov: AVOverview,
  income: AVReport[],
  _quarterlyEarnings: AVEarningsQuarter[],
  annualEarnings: AVEarningsAnnual[]
): GrowthRegimeInfo {
  // Implied EPS CAGR from P/E ÷ PEG (analyst consensus baked into PEG ratio)
  const fpe = nn(ov.ForwardPE);
  const peg = nn(ov.PEGRatio);
  const impliedEpsCAGR = fpe != null && peg != null && peg > 0 && fpe > 0
    ? fpe / peg   // e.g. 71.9 / 1.3 = 55.3 → interpret as 55.3% per year
    : null;

  // Recent quarterly EPS growth (YoY)
  const recentEpsGrowth = nn(ov.QuarterlyEarningsGrowthYOY);

  // 3yr revenue CAGR from income statement
  const revs = income.slice(0, 4).map(s => r(s, 'totalRevenue'));
  let revCagr: number | null = null;
  if (revs[0] != null && revs[3] != null && revs[3] > 0)
    revCagr = Math.pow(revs[0] / revs[3], 1 / 3) - 1;

  // Trough detection: is LTM EPS below EPS from 3 years ago?
  const ltmEPS = nn(annualEarnings[0]?.reportedEPS);
  const eps3yrAgo = nn(annualEarnings[3]?.reportedEPS);
  const isTrough = ltmEPS != null && eps3yrAgo != null && ltmEPS < eps3yrAgo;

  // Derive regime
  // Primary signal: implied EPS CAGR from PEG; fallback: recent quarterly
  const fwdGrowth = impliedEpsCAGR ?? (recentEpsGrowth != null ? recentEpsGrowth * 100 : null);

  // Historical FCF CAGR for inflection detection (needed for Fix 7)
  const fwdRevGrowth = nn(ov.QuarterlyRevenueGrowthYOY);

  let regime: GrowthRegime;
  if (isTrough) {
    regime = 'recovery';
  } else if (
    (revCagr != null && revCagr < 0.20) &&
    (fwdRevGrowth != null && fwdRevGrowth > 0.30)
  ) {
    regime = 'inflection';
  } else if (fwdGrowth != null && fwdGrowth > 25) {
    regime = 'high_growth';
  } else if (fwdGrowth != null && fwdGrowth >= 10) {
    regime = 'moderate_growth';
  } else {
    regime = 'mature';
  }

  const label =
    regime === 'high_growth'   ? `High-growth regime (implied EPS CAGR: ~${fwdGrowth != null ? fwdGrowth.toFixed(0) : '?'}%)` :
    regime === 'moderate_growth' ? `Moderate-growth regime (~${fwdGrowth != null ? fwdGrowth.toFixed(0) : '?'}% EPS CAGR)` :
    regime === 'mature'         ? 'Mature / value regime' :
    regime === 'recovery'       ? 'Recovery / trough regime — LTM EPS below 3yr prior' :
                                   'Growth inflection — historical FCF lag vs. forward revenue growth';

  return { regime, impliedEpsCAGR, recentEpsGrowth, revCagr, isTrough, label };
}

// ── Phase 2 — Financial Health ────────────────────────────────────────────────
// Fixes: 1 (FCF contradiction), 2 (SBC flag)

export function scoreFinancialHealth(
  income: AVReport[], balance: AVReport[], cashflow: AVReport[]
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  // ── SBC / Revenue (Fix 2) ─────────────────────────────────────────
  const cf0 = cashflow[0];
  const sbc = cf0 ? (r(cf0, 'stockBasedCompensation') ?? 0) : 0;
  const rev0 = income[0] ? r(income[0], 'totalRevenue') : null;
  const sbcRatio = sbc > 0 && rev0 != null && rev0 > 0 ? sbc / rev0 : null;
  const sbcHighFlag = sbcRatio != null && sbcRatio > 0.10;
  const sbcWarning = sbcHighFlag ? `Non-GAAP adj. needed — SBC ${(sbcRatio! * 100).toFixed(0)}% of revenue` : undefined;
  if (sbcHighFlag) {
    flags.push({
      text: `SBC is ${(sbcRatio! * 100).toFixed(0)}% of revenue — GAAP operating margin and FCF are understated on a cash compensation basis; compare to non-GAAP disclosures`,
      type: 'neutral'
    });
  }

  // ── Revenue CAGR (3yr) — 20pts ──
  const revs = income.slice(0, 4).map(s => r(s, 'totalRevenue'));
  let revCagr: number | null = null;
  if (revs[0] != null && revs[3] != null && revs[3] > 0)
    revCagr = Math.pow(revs[0] / revs[3], 1 / 3) - 1;
  const revPts = revCagr == null ? 8 :
    revCagr > 0.20 ? 20 : revCagr > 0.10 ? 15 : revCagr > 0.05 ? 10 : revCagr > 0 ? 6 : 2;
  total += revPts;
  details.push({ label: 'Revenue CAGR (3yr)', value: pctLabel(revCagr), points: revPts, maxPoints: 20,
    note: revCagr == null ? 'Insufficient history' : revCagr > 0.15 ? 'Strong top-line growth' : revCagr > 0.05 ? 'Moderate growth' : revCagr > 0 ? 'Slow growth' : 'Revenue declining' });
  if (revCagr != null && revCagr < 0) flags.push({ text: 'Revenue declining — top-line is shrinking', type: 'bad' });
  if (revCagr != null && revCagr > 0.20) flags.push({ text: `Strong revenue CAGR of ${(revCagr * 100).toFixed(0)}% — top-line momentum is excellent`, type: 'good' });

  // ── Gross Margin — 15pts ──
  const gm0 = income[0] ? (r(income[0], 'grossProfit') ?? 0) / (r(income[0], 'totalRevenue') ?? 1) : null;
  const gm3 = income[3] ? (r(income[3], 'grossProfit') ?? 0) / (r(income[3], 'totalRevenue') ?? 1) : null;
  const gmTrend = gm0 != null && gm3 != null ? gm0 - gm3 : null;
  const gmPts = gm0 == null ? 7 :
    gm0 > 0.60 ? 15 : gm0 > 0.40 ? 12 : gm0 > 0.25 ? 9 : gm0 > 0.15 ? 6 : 3;
  total += gmPts;
  details.push({ label: 'Gross Margin', value: gm0 != null ? (gm0 * 100).toFixed(1) + '%' : '—', points: gmPts, maxPoints: 15,
    note: gm0 == null ? 'Data unavailable' : `${gm0 > 0.50 ? 'Excellent' : gm0 > 0.30 ? 'Solid' : gm0 > 0.15 ? 'Thin' : 'Very thin'} gross margin${gmTrend != null ? `; ${gmTrend > 0.02 ? 'expanding ↑' : gmTrend < -0.02 ? 'compressing ↓' : 'stable →'} vs 3yr ago` : ''}` });
  if (gmTrend != null && gmTrend < -0.03) flags.push({ text: `Gross margin compressed ${(gmTrend * 100).toFixed(1)}pp over 3 years — competitive pressure or rising input costs`, type: 'bad' });
  if (gmTrend != null && gmTrend > 0.03) flags.push({ text: `Gross margin expanded ${(gmTrend * 100).toFixed(1)}pp over 3 years — pricing power improving`, type: 'good' });

  // ── Operating Margin trend — 15pts (Fix 2: uses GAAP; adds SBC warning if applicable) ──
  const om0 = income[0] ? (r(income[0], 'operatingIncome') ?? 0) / (r(income[0], 'totalRevenue') ?? 1) : null;
  const om2 = income[2] ? (r(income[2], 'operatingIncome') ?? 0) / (r(income[2], 'totalRevenue') ?? 1) : null;
  const omTrend = om0 != null && om2 != null ? om0 - om2 : null;
  const omPts = omTrend == null ? 7 : omTrend > 0.02 ? 15 : omTrend > 0 ? 11 : omTrend > -0.02 ? 7 : 2;
  total += omPts;
  details.push({ label: 'Operating Margin (GAAP)', value: om0 != null ? (om0 * 100).toFixed(1) + '%' : '—', points: omPts, maxPoints: 15,
    note: omTrend == null ? 'Insufficient data' : omTrend > 0.02 ? 'GAAP operating leverage improving — costs scaling slower than revenue' : omTrend > 0 ? 'Slight improvement' : omTrend > -0.02 ? 'Stable but slightly compressing' : 'GAAP operating margin deteriorating — investigate opex growth',
    warning: sbcWarning });
  if (omTrend != null && omTrend < -0.03) flags.push({ text: `Operating margin down ${(Math.abs(omTrend) * 100).toFixed(1)}pp — SG&A or R&D growing faster than revenue`, type: 'bad' });
  if (omTrend != null && omTrend > 0.03) flags.push({ text: `Operating leverage evident — GAAP margin expanding ${(omTrend * 100).toFixed(1)}pp`, type: 'good' });

  // ── FCF Conversion Quality — 15pts (Fix 1) ──
  // Score is driven by FCF/Net Income (conversion ratio), NOT FCF/Revenue (margin).
  // FCF margin is shown as the displayed value but does NOT drive the score.
  // The positive "exceptional margin" signal only fires when BOTH conversion ≥ 85% AND margin > 15%.
  let fcfPts = 7;
  let fcfNote = 'Data unavailable';
  let fcfLabel = '—';
  let fcfConversionRatio: number | null = null;
  let fcfMargin: number | null = null;

  if (cf0) {
    const ocf = r(cf0, 'operatingCashflow');
    const capex = r(cf0, 'capitalExpenditures');
    const ni = r(income[0], 'netIncome');
    const rev = r(income[0], 'totalRevenue');
    const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : ocf;

    fcfMargin = fcf != null && rev != null && rev > 0 ? fcf / rev : null;
    fcfConversionRatio = fcf != null && ni != null && ni !== 0 ? fcf / Math.abs(ni) : null;

    // Display: show both conversion ratio and margin
    if (fcfConversionRatio != null) {
      fcfLabel = `${(fcfConversionRatio * 100).toFixed(0)}% conv${fcfMargin != null ? ` · ${(fcfMargin * 100).toFixed(1)}% margin` : ''}`;
    } else if (fcfMargin != null) {
      fcfLabel = `${(fcfMargin * 100).toFixed(1)}% margin`;
    }

    // Score is conversion ratio
    if (fcfConversionRatio != null) {
      fcfPts = fcfConversionRatio > 1.2 ? 15 : fcfConversionRatio > 0.85 ? 12 : fcfConversionRatio > 0.60 ? 8 : fcfConversionRatio > 0.30 ? 4 : 1;
      fcfNote = fcfConversionRatio > 1.2 ? 'FCF exceeds net income — high earnings quality, no accrual games' :
        fcfConversionRatio > 0.85 ? 'Strong cash conversion — FCF closely tracks reported earnings' :
        fcfConversionRatio > 0.60 ? 'Moderate conversion — FCF below earnings; check working capital movements' :
        'Low cash conversion — reported earnings significantly exceed FCF; potential earnings quality concern';

      if (fcfConversionRatio < 0.50 && ni != null && ni > 0)
        flags.push({ text: 'Net income significantly exceeds FCF — check receivables buildup or aggressive revenue recognition', type: 'bad' });
      if (fcfConversionRatio > 1.20)
        flags.push({ text: 'FCF exceeds net income — earnings quality is high; D&A and working capital are additive to cash', type: 'good' });

      // Guard (Fix 1): positive FCF margin signal fires only when conversion is also ≥ 85%
      if (fcfMargin != null && fcfMargin > 0.15 && fcfConversionRatio >= 0.85) {
        flags.push({ text: `FCF margin ${(fcfMargin * 100).toFixed(1)}% and conversion ${(fcfConversionRatio * 100).toFixed(0)}% — both strong; cash generation is high quality`, type: 'good' });
      } else if (fcfMargin != null && fcfMargin > 0.15 && fcfConversionRatio < 0.85) {
        // Healthy margin but below-average conversion — surface nuanced signal, not positive checkmark
        flags.push({ text: `FCF margin ${(fcfMargin * 100).toFixed(1)}% is healthy but cash conversion is only ${(fcfConversionRatio * 100).toFixed(0)}% of net income — gap may reflect heavy working capital build or capitalised costs`, type: 'neutral' });
      }
    } else if (fcf != null && fcf < 0) {
      fcfPts = 1; fcfNote = 'Negative free cash flow — company consuming cash';
      flags.push({ text: 'Negative FCF — evaluate whether this is an investment-phase build or structural weakness', type: 'bad' });
    }
  }

  total += fcfPts;
  details.push({ label: 'FCF Conversion / Quality', value: fcfLabel, points: fcfPts, maxPoints: 15, note: fcfNote, warning: sbcWarning && fcfConversionRatio != null && fcfConversionRatio < 0.85 ? sbcWarning : undefined });

  // ── Leverage — 20pts ──
  let levPts = 10; let levNote = 'Data unavailable'; let levLabel = '—';
  const bal0 = balance[0];
  if (bal0) {
    const debt = r(bal0, 'shortLongTermDebtTotal') ?? r(bal0, 'longTermDebt') ?? 0;
    const cash = r(bal0, 'cashAndShortTermInvestments') ?? 0;
    const netDebt = debt - cash;
    const da = cf0 ? r(cf0, 'depreciationDepletionAndAmortization') : null;
    const oi = income[0] ? r(income[0], 'operatingIncome') : null;
    const ebitda = income[0] ? (r(income[0], 'ebitda') ?? (oi != null && da != null ? oi + Math.abs(da) : oi)) : null;
    const ratio = ebitda != null && ebitda > 0 ? netDebt / ebitda : null;
    levLabel = ratio != null ? xLabel(ratio) : '—';
    if (ratio != null) {
      levPts = ratio < 0 ? 20 : ratio < 1 ? 18 : ratio < 2 ? 14 : ratio < 3 ? 9 : ratio < 4 ? 4 : 1;
      levNote = ratio < 0 ? 'Net cash position — zero leverage risk' :
        ratio < 1 ? 'Very low leverage — less than 1yr EBITDA to repay all net debt' :
        ratio < 2 ? 'Conservative leverage — well within investment-grade thresholds' :
        ratio < 3 ? 'Moderate leverage — monitor in rising rate environment' :
        ratio < 4 ? 'Elevated leverage — limited financial flexibility' :
        'High leverage — debt servicing may crowd out investment and dividends';
      if (ratio > 3.5) flags.push({ text: `Net Debt/EBITDA of ${ratio.toFixed(1)}x is elevated — covenant and refinancing risk`, type: 'bad' });
      if (ratio < 0.5) flags.push({ text: `Near debt-free (${ratio.toFixed(1)}x) — balance sheet is a competitive advantage`, type: 'good' });
    }
  }
  total += levPts;
  details.push({ label: 'Net Debt / EBITDA', value: levLabel, points: levPts, maxPoints: 20, note: levNote });

  // ── Interest Coverage — 15pts ──
  let icPts = 7; let icNote = 'Data unavailable'; let icLabel = '—';
  if (income[0]) {
    const ebit = r(income[0], 'operatingIncome') ?? r(income[0], 'ebit');
    const ie = r(income[0], 'interestExpense');
    if (ebit != null && ie != null && ie !== 0) {
      const cov = ebit / Math.abs(ie);
      icLabel = xLabel(cov);
      icPts = cov > 10 ? 15 : cov > 5 ? 12 : cov > 3 ? 8 : cov > 1.5 ? 3 : 0;
      icNote = cov > 10 ? 'Extremely comfortable debt service' :
        cov > 5 ? 'Solid coverage — earnings can fall substantially before interest becomes a problem' :
        cov > 3 ? 'Adequate but watch if earnings decline' :
        cov > 1.5 ? 'Thin margin — a bad quarter could stress interest payments' :
        'Near-distress coverage — interest is consuming most operating profit';
      if (cov < 2) flags.push({ text: `Interest coverage of ${cov.toFixed(1)}x is dangerously low`, type: 'bad' });
    } else if (ie == null || ie === 0) {
      icPts = 15; icNote = 'No meaningful interest expense — debt-free or minimal leverage'; icLabel = 'N/A';
    }
  }
  total += icPts;
  details.push({ label: 'Interest Coverage', value: icLabel, points: icPts, maxPoints: 15, note: icNote });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Strong financial health — profitable, cash-generative, and conservatively financed' :
    score >= 65 ? 'Solid fundamentals with manageable risks — most metrics in healthy territory' :
    score >= 50 ? 'Mixed picture — some strengths but notable areas of concern' :
    score >= 35 ? 'Weak financial health — multiple red flags across margins, leverage, or cash flow' :
    'Poor financial health — significant risks across profitability, leverage, and/or cash generation';

  return {
    phase: 2, title: 'Financial Health Check', score, grade: gradeFromScore(score), headline,
    summary: `Rev CAGR ${pctLabel(revCagr)} · Gross margin ${gm0 != null ? (gm0 * 100).toFixed(0) + '%' : '—'} · Net Debt/EBITDA ${levLabel} · Int. coverage ${icLabel}${sbcHighFlag ? ' · ⚠ SBC high' : ''}`,
    details, flags,
  };
}

// ── Phase 3 — Earnings Quality ────────────────────────────────────────────────
// Fixes: 3 (trough detection), 4 (language)

export function scoreEarningsQuality(
  quarterly: AVEarningsQuarter[],
  annual: AVEarningsAnnual[],
  regime: GrowthRegimeInfo
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;
  const q = quarterly.slice(0, 8);

  // ── EPS Beat Rate — 30pts (Fix 4: language) ──
  const beats = q.filter(e => nn(e.surprisePercentage) != null && nn(e.surprisePercentage)! > 0).length;
  const beatRate = q.length > 0 ? beats / q.length : null;
  const beatPts = beatRate == null ? 10 :
    beatRate >= 0.875 ? 30 : beatRate >= 0.75 ? 24 : beatRate >= 0.625 ? 16 : beatRate >= 0.5 ? 9 : 3;
  total += beatPts;
  // Fix 4: replaced "sandbaggs" language
  details.push({ label: 'EPS Beat Rate', value: beatRate != null ? (beatRate * 100).toFixed(0) + '%' : '—', points: beatPts, maxPoints: 30,
    note: beatRate == null ? 'No data' :
      beatRate >= 0.875 ? 'Conservative guidance culture — management consistently under-promises and exceeds published estimates' :
      beatRate >= 0.75 ? 'Strong beat record — reliable earnings delivery' :
      beatRate >= 0.5 ? 'Inconsistent — roughly half the quarters miss consensus' :
      'Poor execution — management cannot reliably forecast its own business' });
  if (beatRate != null && beatRate >= 0.875) flags.push({ text: `EPS beat rate of ${(beatRate * 100).toFixed(0)}% over last ${q.length}Q — conservative guidance culture; management consistently exceeds estimates`, type: 'good' });
  if (beatRate != null && beatRate < 0.5) flags.push({ text: `Only ${(beatRate * 100).toFixed(0)}% EPS beat rate — execution risk is elevated`, type: 'bad' });

  // ── Average Surprise % — 25pts ──
  const surprises = q.map(e => nn(e.surprisePercentage)).filter((v): v is number => v != null);
  const avgSurprise = surprises.length > 0 ? surprises.reduce((a, b) => a + b, 0) / surprises.length : null;
  const surprisePts = avgSurprise == null ? 8 :
    avgSurprise > 8 ? 25 : avgSurprise > 5 ? 21 : avgSurprise > 3 ? 16 : avgSurprise > 1 ? 10 : avgSurprise > 0 ? 5 : 2;
  total += surprisePts;
  details.push({ label: 'Avg EPS Surprise', value: avgSurprise != null ? (avgSurprise > 0 ? '+' : '') + avgSurprise.toFixed(1) + '%' : '—', points: surprisePts, maxPoints: 25,
    note: avgSurprise == null ? 'No data' :
      avgSurprise > 5 ? 'Consistently beating by wide margins — high earnings visibility and conservative guidance' :
      avgSurprise > 2 ? 'Regular positive surprises — management sets beatable targets' :
      avgSurprise > 0 ? 'Modest positive surprises — barely meeting expectations' :
      'Missing consensus on average — guidance credibility is low' });

  // ── EPS Growth YoY — 25pts (Fix 3: trough detection) ──
  let growthPts = 8; let growthLabel = '—'; let growthNote = 'Insufficient history';
  let troughWarning: string | undefined;

  if (q.length >= 5) {
    const currEPS = nn(q[0].reportedEPS);
    const prevEPS = nn(q[4].reportedEPS);  // Same Q, prior year
    if (currEPS != null && prevEPS != null && prevEPS !== 0) {
      const g = prevEPS > 0 ? (currEPS - prevEPS) / prevEPS : 0;
      growthLabel = pctLabel(g);

      // Fix 3: Trough detection — is the prior Q the lowest in trailing 4 years?
      const allAnnualEPS = annual.slice(0, 5).map(a => nn(a.reportedEPS)).filter((v): v is number => v != null);
      const epsMin = allAnnualEPS.length > 1 ? Math.min(...allAnnualEPS.slice(1)) : null;
      const ltmEPS = nn(annual[0]?.reportedEPS);
      const eps3yrAgo = nn(annual[3]?.reportedEPS);
      const isTroughYear = regime.isTrough;
      // Also detect if the comparison year (prev Q) was part of a trough
      const prevYearAnnual = nn(annual[1]?.reportedEPS);
      const isTroughBase = epsMin != null && prevYearAnnual != null && Math.abs(prevYearAnnual - epsMin) < 0.05 * Math.abs(epsMin || 1);

      // 3yr CAGR from annual data
      let cagr3yr: number | null = null;
      if (ltmEPS != null && eps3yrAgo != null && eps3yrAgo > 0 && ltmEPS > 0)
        cagr3yr = Math.pow(ltmEPS / eps3yrAgo, 1 / 3) - 1;

      // Base scoring (uncapped)
      let rawPts = g > 0.25 ? 25 : g > 0.15 ? 21 : g > 0.08 ? 15 : g > 0.02 ? 9 : g > 0 ? 5 : 1;

      if (isTroughYear || isTroughBase) {
        // Cap score at 20/25 for recovery growth
        rawPts = Math.min(rawPts, 20);
        troughWarning = `Recovery phase — growth measured off a trough year; 3yr CAGR is ${pctLabel(cagr3yr)}`;
        growthNote = `Recovery-phase growth (+${(g * 100).toFixed(0)}% YoY off trough). 3yr EPS CAGR: ${pctLabel(cagr3yr)}. Recovery growth is structurally easier than compounding growth and is discounted in the score.`;
        flags.push({ text: `YoY EPS growth of ${pctLabel(g)} is measured off a cyclical trough — recovery growth; 3yr EPS CAGR is ${pctLabel(cagr3yr)}`, type: 'neutral' });
      } else {
        growthNote = g > 0.25 ? 'Accelerating EPS growth — earnings power compounding strongly' :
          g > 0.10 ? `Solid EPS growth${cagr3yr != null ? `; 3yr CAGR ${pctLabel(cagr3yr)}` : ''}` :
          g > 0 ? `Modest earnings growth${cagr3yr != null ? `; 3yr CAGR ${pctLabel(cagr3yr)}` : ''}` :
          'EPS declining YoY — investigate whether structural or cyclical';
        if (cagr3yr != null) growthNote += cagr3yr < 0 ? ' (3yr CAGR negative — recent growth is bounce, not trend)' : '';
      }

      growthPts = rawPts;
      if (g < 0) flags.push({ text: `EPS declining ${(Math.abs(g) * 100).toFixed(0)}% YoY — earnings deteriorating`, type: 'bad' });
      if (g > 0.20 && !isTroughYear && !isTroughBase) flags.push({ text: `EPS up ${(g * 100).toFixed(0)}% YoY — strong compounding earnings momentum`, type: 'good' });
    }
  }
  total += growthPts;
  details.push({ label: 'EPS Growth YoY', value: growthLabel, points: growthPts, maxPoints: 25, note: growthNote, warning: troughWarning });

  // ── Execution Consistency — 20pts (unchanged) ──
  const revBeatPts = beatRate != null ? Math.round(beatRate * 20) : 8;
  total += revBeatPts;
  details.push({ label: 'Execution Consistency', value: beatRate != null ? `${beats}/${q.length} beats` : '—', points: revBeatPts, maxPoints: 20,
    note: `Measured over last ${q.length} quarters. Consistent execution signals strong management forecasting ability and business visibility.` });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Excellent execution — consistent beats with strong EPS growth; guidance is highly credible' :
    score >= 65 ? 'Good earnings track record — regular beats and positive growth trend' :
    score >= 50 ? 'Mixed execution — some beats but inconsistent guidance or slowing growth' :
    score >= 35 ? 'Weak execution — frequent misses or negative EPS trend; guidance credibility low' :
    'Poor earnings quality — persistent misses and/or declining earnings power';

  return {
    phase: 3, title: 'Earnings Quality', score, grade: gradeFromScore(score), headline,
    summary: `Beat rate ${beatRate != null ? (beatRate * 100).toFixed(0) + '%' : '—'} · Avg surprise ${avgSurprise != null ? (avgSurprise > 0 ? '+' : '') + avgSurprise.toFixed(1) + '%' : '—'} · EPS growth ${growthLabel}${regime.isTrough ? ' (recovery)' : ''}`,
    details, flags,
    regime: regime.regime,
  };
}

// ── Phase 4 — Valuation ───────────────────────────────────────────────────────
// Fixes: 5 (growth-adjusted P/E), 6A (EV/EBITDA GAAP tag), 6B (analyst upside framing)

export function scoreValuation(
  ov: AVOverview, price: number | null, regime: GrowthRegimeInfo
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const isHighGrowth = regime.regime === 'high_growth' || regime.regime === 'inflection';
  const isModGrowth = regime.regime === 'moderate_growth';

  const regimeLabel = isHighGrowth
    ? `Growth-adjusted scoring (${regime.label})`
    : isModGrowth
    ? `Moderate-growth scoring (${regime.label})`
    : `Value/income scoring (${regime.label})`;

  // ── Forward P/E — 20pts (Fix 5: growth-adjusted for high-growth companies) ──
  const fpe = nn(ov.ForwardPE);
  const tpe = nn(ov.TrailingPE);
  const peg = nn(ov.PEGRatio);
  const activePE = fpe ?? tpe;
  const isPEfwd = fpe != null;

  let pePts: number;
  let peNote: string;

  if (isHighGrowth && activePE != null && activePE > 0 && peg != null && peg > 0) {
    // Use P/E ÷ growth (implied CAGR from PEG) as the scoring metric
    const impliedCAGR = regime.impliedEpsCAGR ?? (activePE / peg);
    const pegScore = impliedCAGR > 0 ? activePE / impliedCAGR : null; // normalized PEG

    pePts = pegScore == null ? 8 :
      pegScore < 1.0 ? 20 : pegScore < 1.5 ? 15 : pegScore < 2.0 ? 10 : pegScore < 2.5 ? 6 : 3;

    peNote = `Growth-adjusted: Fwd P/E ${fmt2(activePE)}x ÷ EPS CAGR ~${impliedCAGR.toFixed(0)}% = ${pegScore != null ? fmt2(pegScore) : '—'}x normalized PEG. ` +
      (pegScore != null && pegScore < 1.0 ? 'Attractive on growth-adjusted basis — P/E is at or below the growth rate' :
       pegScore != null && pegScore < 1.5 ? 'Reasonably valued relative to growth' :
       pegScore != null && pegScore < 2.0 ? 'Slight premium to growth — market is pricing in continued execution' :
       'Elevated growth-adjusted multiple — high bar to clear');

    if (pegScore != null && pegScore < 1.2) flags.push({ text: `Fwd P/E of ${fmt2(activePE)}x on ~${impliedCAGR.toFixed(0)}% EPS CAGR = growth-adjusted PEG of ${fmt2(pegScore)} — attractive on growth-adjusted basis`, type: 'good' });
    if (pegScore != null && pegScore > 2.0) flags.push({ text: `Growth-adjusted P/E (normalized PEG: ${fmt2(pegScore)}) is elevated — high execution bar at this multiple`, type: 'bad' });
  } else if (isModGrowth && activePE != null) {
    // Moderate growth: wider fair-value band
    pePts = activePE <= 0 ? 4 : activePE < 15 ? 20 : activePE < 22 ? 16 : activePE < 30 ? 11 : activePE < 40 ? 7 : 4;
    peNote = activePE <= 0 ? 'Negative earnings — P/E not meaningful' :
      activePE < 15 ? 'Attractive for a moderate-growth business' :
      activePE < 22 ? 'Fair value for growth profile' :
      activePE < 30 ? 'Moderate premium — growth must continue to justify' :
      'Expensive even for moderate-growth — limited margin of safety';
    if (activePE > 35) flags.push({ text: `P/E of ${fmt2(activePE)}x is high for a moderate-growth company`, type: 'bad' });
    if (activePE > 0 && activePE < 15) flags.push({ text: `P/E of ${fmt2(activePE)}x is attractive for this growth profile`, type: 'good' });
  } else {
    // Value / mature: original strict scoring
    pePts = activePE == null ? 8 :
      activePE <= 0 ? 4 : activePE < 12 ? 20 : activePE < 18 ? 16 : activePE < 25 ? 11 : activePE < 35 ? 6 : 3;
    peNote = activePE == null ? 'No earnings data' :
      activePE <= 0 ? 'Negative earnings — P/E not meaningful' :
      activePE < 12 ? 'Deeply discounted — value territory' :
      activePE < 18 ? 'Attractively valued — below S&P 500 average' :
      activePE < 25 ? 'Fair value — in line with market average' :
      activePE < 35 ? 'Growth premium — requires strong earnings acceleration' :
      'Expensive — priced for near-perfection, high execution risk';
    if (activePE != null && activePE > 40) flags.push({ text: `P/E of ${fmt2(activePE)}x is very high for a mature-profile company — multiple compression risk`, type: 'bad' });
    if (activePE != null && activePE > 0 && activePE < 12) flags.push({ text: `P/E of ${fmt2(activePE)}x is well below market average — potential value opportunity`, type: 'good' });
  }

  total += pePts;
  details.push({ label: isPEfwd ? 'Forward P/E' : 'Trailing P/E', value: activePE != null ? fmt2(activePE) + 'x' : '—', points: pePts, maxPoints: 20, note: peNote });

  // ── PEG Ratio — 25pts ──
  const pegPts = peg == null ? 10 : peg <= 0 ? 5 : peg < 0.75 ? 25 : peg < 1.0 ? 22 : peg < 1.5 ? 16 : peg < 2.0 ? 9 : 3;
  total += pegPts;
  details.push({ label: 'PEG Ratio', value: peg != null ? fmt2(peg) + 'x' : '—', points: pegPts, maxPoints: 25,
    note: peg == null ? 'Data unavailable' : peg <= 0 ? 'Negative — not meaningful' :
      peg < 0.75 ? "Compelling — paying less than 75c per point of growth (classic undervalue signal)" :
      peg < 1.0 ? "Attractive — Peter Lynch's golden zone, growth not fully priced in" :
      peg < 1.5 ? 'Fair — reasonable growth-adjusted valuation' :
      peg < 2.0 ? 'Slightly stretched' : 'Expensive on growth-adjusted basis' });
  if (peg != null && peg > 0 && peg < 1.0) flags.push({ text: `PEG of ${fmt2(peg)} below 1.0 — classic signal that growth is not fully priced in`, type: 'good' });
  if (peg != null && peg > 2.5) flags.push({ text: `PEG of ${fmt2(peg)} — paying a heavy premium for growth`, type: 'bad' });

  // ── EV/EBITDA — 25pts (Fix 6A: GAAP disclosure) ──
  const evEbitda = nn(ov.EVToEBITDA);
  const evePts = evEbitda == null ? 10 :
    evEbitda <= 0 ? 5 : evEbitda < 8 ? 25 : evEbitda < 12 ? 21 : evEbitda < 18 ? 14 : evEbitda < 25 ? 8 : 3;
  total += evePts;
  // Fix 6A: always surface GAAP disclosure; note non-GAAP would be lower for M&A-heavy companies
  details.push({ label: 'EV / EBITDA', value: evEbitda != null ? fmt2(evEbitda) + 'x' : '—', points: evePts, maxPoints: 25,
    note: evEbitda == null ? 'Data unavailable' :
      evEbitda <= 0 ? 'Negative EBITDA — company not yet operationally profitable' :
      evEbitda < 8 ? 'Deeply cheap on GAAP operational basis — M&A-level attractiveness' :
      evEbitda < 12 ? 'Well-priced on GAAP basis — below S&P 500 median' :
      evEbitda < 18 ? 'Fair GAAP value — in line with market' :
      evEbitda < 25 ? 'Premium GAAP multiple — requires above-average growth' :
      'Expensive on GAAP basis — significant acquisition amortization may be inflating this multiple',
    warning: 'GAAP basis — includes acquisition-related intangible amortization; non-GAAP multiple would be lower for M&A-intensive companies' });

  // ── Price vs 52-week range — 15pts ──
  let rangePts = 7; let rangeNote = 'Unavailable'; let rangeLabel = '—';
  const hi = nn(ov['52WeekHigh']); const lo = nn(ov['52WeekLow']);
  if (price != null && hi != null && lo != null && hi > lo) {
    const pos = (price - lo) / (hi - lo);
    rangeLabel = (pos * 100).toFixed(0) + '% of range';
    rangePts = pos < 0.20 ? 15 : pos < 0.35 ? 13 : pos < 0.55 ? 10 : pos < 0.75 ? 6 : 3;
    rangeNote = pos < 0.20 ? 'Trading near 52-week low — contrarian opportunity; verify no structural reason' :
      pos < 0.40 ? 'In lower half of range — recent weakness may represent entry point' :
      pos < 0.65 ? 'Middle of range — neutral positioning' :
      pos < 0.85 ? 'In upper range — momentum strong but less margin of safety' :
      'Near 52-week high — requires strong fundamental conviction';
    if (pos > 0.90) flags.push({ text: 'Trading within 10% of 52-week high — strong momentum but entry risk elevated', type: 'neutral' });
    if (pos < 0.15) flags.push({ text: 'Near 52-week low — review whether weakness is opportunity or warning sign', type: 'neutral' });
  }
  total += rangePts;
  details.push({ label: 'Price vs 52-Week Range', value: rangeLabel, points: rangePts, maxPoints: 15, note: rangeNote });

  // ── Analyst Target — 15pts (Fix 6B: context-aware framing) ──
  let targetPts = 7; let targetNote = 'No data'; let targetLabel = '—';
  const target = nn(ov.AnalystTargetPrice);
  if (price != null && target != null && price > 0) {
    const upside = (target - price) / price;
    targetLabel = pctLabel(upside);

    if (upside < -0.05 && isHighGrowth) {
      // Fix 6B: high-growth stock trading above consensus → likely analyst lag, not overvaluation
      targetPts = 8;
      targetNote = `Trading ${(Math.abs(upside) * 100).toFixed(0)}% above analyst consensus target of $${target.toFixed(0)}. For high-growth stocks, analyst targets frequently lag price as models are revised upward. Verify via recent upgrade/downgrade history (data not available here).`;
      flags.push({ text: `Stock is trading above analyst consensus target — in a high-growth regime this often reflects analysts revising estimates upward; treat bearish framing with caution`, type: 'neutral' });
    } else if (upside < -0.05) {
      targetPts = 2;
      targetNote = `Trading ${(Math.abs(upside) * 100).toFixed(0)}% above analyst consensus of $${target.toFixed(0)} — market more bullish than analyst community. Check whether targets have been recently revised.`;
      flags.push({ text: `Stock trading above analyst consensus target — limited upside priced by the Street`, type: 'neutral' });
    } else {
      targetPts = upside > 0.25 ? 15 : upside > 0.15 ? 13 : upside > 0.05 ? 10 : 6;
      targetNote = upside > 0.25 ? 'Consensus sees 25%+ upside — analyst community is broadly bullish' :
        upside > 0.10 ? 'Meaningful analyst upside consensus' :
        'Modest upside to consensus target';
      if (upside > 0.30) flags.push({ text: `Analyst consensus sees ${(upside * 100).toFixed(0)}% upside from current price`, type: 'good' });
    }
  }
  total += targetPts;
  details.push({ label: 'Analyst Target Upside', value: targetLabel, points: targetPts, maxPoints: 15, note: targetNote });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Attractively valued — multiple metrics point to undervaluation relative to fundamentals' :
    score >= 65 ? 'Fairly valued with some upside — priced reasonably relative to growth' :
    score >= 50 ? 'Neutral valuation — price roughly reflects current fundamentals' :
    score >= 35 ? 'Stretched valuation — significant upside is already priced in' :
    'Expensive — the stock prices in an optimistic scenario; limited margin of safety';

  return {
    phase: 4, title: 'Valuation Assessment', score, grade: gradeFromScore(score), headline,
    summary: `${isPEfwd ? 'Fwd' : 'Trl'} P/E ${activePE != null ? fmt2(activePE) + 'x' : '—'} · PEG ${peg != null ? fmt2(peg) + 'x' : '—'} · EV/EBITDA ${evEbitda != null ? fmt2(evEbitda) + 'x' : '—'} · ${regimeLabel}`,
    details, flags,
    regime: regime.regime,
    regimeLabel,
  };
}

// ── Phase 5 — Intrinsic Value (Auto-DCF with scenarios) ──────────────────────
// Fix 7: three-scenario table; base case uses forward estimates (implied from PEG); MoS vs base

function runDCF(startFCF: number, growthRate: number, sharesOut: number, wacc: number, termG: number): number {
  let pv = 0; let projFCF = startFCF;
  for (let yr = 1; yr <= 5; yr++) {
    projFCF *= (1 + growthRate);
    pv += projFCF / Math.pow(1 + wacc, yr);
  }
  const terminalFCF = projFCF * (1 + termG);
  const tv = terminalFCF / (wacc - termG);
  pv += tv / Math.pow(1 + wacc, 5);
  return pv / sharesOut;
}

export function scoreDCF(
  cashflow: AVReport[], ov: AVOverview, price: number | null, regime: GrowthRegimeInfo
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const WACC = 0.10;
  const TERMINAL_G = 0.03;

  // Compute historical FCFs
  const fcfs = cashflow.slice(0, 4).map(cf => {
    const ocf = r(cf, 'operatingCashflow');
    const capex = r(cf, 'capitalExpenditures');
    return ocf != null && capex != null ? ocf - Math.abs(capex) : ocf;
  }).filter((v): v is number => v != null);

  let historicalCAGR: number | null = null;
  if (fcfs.length >= 3 && fcfs[0] > 0 && fcfs[2] > 0)
    historicalCAGR = clamp(Math.pow(fcfs[0] / fcfs[2], 1 / 2) - 1, -0.30, 0.35);

  const sharesOut = nn(ov.SharesOutstanding);
  const startFCF = fcfs[0] ?? null;

  const scenarios: DCFScenario[] = [];

  if (startFCF != null && sharesOut != null && sharesOut > 0) {
    // ── Bear: historical FCF CAGR ──
    const bearGrowth = historicalCAGR != null ? clamp(historicalCAGR, 0, 0.25) : 0.05;
    const bearValue = runDCF(startFCF, bearGrowth, sharesOut, WACC, TERMINAL_G);
    scenarios.push({
      label: 'Bear',
      growthRate: bearGrowth,
      intrinsicValue: bearValue,
      marginOfSafety: price != null && bearValue > 0 ? (bearValue - price) / bearValue : null,
      method: `Historical FCF CAGR (${pctLabel(bearGrowth)}) — conservative extrapolation`,
    });

    // ── Base: forward estimate from implied EPS CAGR (via PEG) ──
    // This is the primary / most realistic scenario
    let baseMethod: string;
    const impliedCAGR = regime.impliedEpsCAGR; // e.g. 55.3 (as percentage)

    if (impliedCAGR != null && impliedCAGR > 0) {
      // Cap at 60% for DCF stability; step down after year 3
      const g1to3 = clamp(impliedCAGR / 100, 0, 0.60);
      const g4to5 = clamp((impliedCAGR / 100 + (historicalCAGR ?? 0.10)) / 2, 0, 0.40);
      // Two-phase growth DCF
      let pv = 0; let projFCF = startFCF;
      for (let yr = 1; yr <= 3; yr++) { projFCF *= (1 + g1to3); pv += projFCF / Math.pow(1 + WACC, yr); }
      for (let yr = 4; yr <= 5; yr++) { projFCF *= (1 + g4to5); pv += projFCF / Math.pow(1 + WACC, yr); }
      const tv = (projFCF * (1 + TERMINAL_G)) / (WACC - TERMINAL_G);
      pv += tv / Math.pow(1 + WACC, 5);
      const baseValue = pv / sharesOut;
      baseMethod = `Implied forward EPS CAGR ~${impliedCAGR.toFixed(0)}% (yr 1–3) → ${(g4to5 * 100).toFixed(0)}% (yr 4–5), from P/E ÷ PEG`;
      scenarios.push({
        label: 'Base',
        growthRate: g1to3,
        intrinsicValue: baseValue,
        marginOfSafety: price != null && baseValue > 0 ? (baseValue - price) / baseValue : null,
        method: baseMethod,
      });
    } else {
      // Fallback: use recent quarterly EPS growth as proxy
      const recentG = regime.recentEpsGrowth != null ? clamp(regime.recentEpsGrowth, 0, 0.40) : clamp((historicalCAGR ?? 0.05) * 1.5, 0, 0.40);
      baseMethod = `Recent quarterly EPS growth as FCF proxy (${pctLabel(recentG)}) — forward estimates unavailable`;
      const baseValue = runDCF(startFCF, recentG, sharesOut, WACC, TERMINAL_G);
      scenarios.push({
        label: 'Base',
        growthRate: recentG,
        intrinsicValue: baseValue,
        marginOfSafety: price != null && baseValue > 0 ? (baseValue - price) / baseValue : null,
        method: baseMethod,
      });
      flags.push({ text: 'No forward FCF estimates available via API — base case uses recent quarterly EPS growth as FCF proxy; may understate growth for inflection companies. Use the manual DCF Calculator with analyst estimates for more reliable output.', type: 'neutral' });
    }

    // ── Bull: base growth rate + 25% relative uplift ──
    const baseMoS = scenarios.find(s => s.label === 'Base');
    const bullGrowth = clamp((baseMoS?.growthRate ?? 0.15) * 1.25, 0, 0.80);
    const bullValue = runDCF(startFCF, bullGrowth, sharesOut, WACC, TERMINAL_G);
    scenarios.push({
      label: 'Bull',
      growthRate: bullGrowth,
      intrinsicValue: bullValue,
      marginOfSafety: price != null && bullValue > 0 ? (bullValue - price) / bullValue : null,
      method: `Bull case — base growth +25% (${pctLabel(bullGrowth)})`,
    });
  }

  // MoS is measured against BASE case (Fix 7)
  const baseMoS = scenarios.find(s => s.label === 'Base')?.marginOfSafety ?? null;
  const baseValue = scenarios.find(s => s.label === 'Base')?.intrinsicValue ?? null;

  // Score on base-case MoS
  const mosPts = baseMoS == null ? 12 :
    baseMoS > 0.40 ? 45 : baseMoS > 0.25 ? 38 : baseMoS > 0.10 ? 28 :
    baseMoS > 0 ? 18 : baseMoS > -0.15 ? 12 : baseMoS > -0.30 ? 7 : 3;
  total += mosPts;
  details.push({
    label: 'Margin of Safety (Base)',
    value: baseMoS != null ? pctLabel(baseMoS) : '—',
    points: mosPts, maxPoints: 45,
    note: baseMoS == null ? 'Could not compute — insufficient FCF data' :
      baseMoS > 0.40 ? `Base-case DCF implies ~${(baseMoS * 100).toFixed(0)}% discount to intrinsic value — significant margin of safety` :
      baseMoS > 0.20 ? `~${(baseMoS * 100).toFixed(0)}% discount to base-case intrinsic value — solid margin of safety` :
      baseMoS > 0 ? `Modest ${(baseMoS * 100).toFixed(0)}% discount — limited but positive margin of safety` :
      `Trading at ~${(Math.abs(baseMoS) * 100).toFixed(0)}% premium to base-case DCF — intrinsic value does not support current price at forward assumptions`,
  });

  // FCF CAGR quality
  const cagrPts = historicalCAGR == null ? 10 :
    historicalCAGR > 0.20 ? 25 : historicalCAGR > 0.12 ? 21 : historicalCAGR > 0.06 ? 16 : historicalCAGR > 0 ? 10 : 4;
  total += cagrPts;
  details.push({ label: 'Historical FCF CAGR', value: pctLabel(historicalCAGR), points: cagrPts, maxPoints: 25,
    note: historicalCAGR == null ? 'Insufficient history' :
      historicalCAGR > 0.15 ? 'Strong FCF compounding — high confidence in bear-case projection' :
      historicalCAGR > 0.05 ? 'Moderate FCF growth — reasonable bear-case floor' :
      historicalCAGR > 0 ? 'Slow FCF growth — terminal value drives most of bear-case value' :
      'FCF declining — bear case is conservative; watch for further deterioration' });

  // FCF predictability
  const mean = fcfs.length > 0 ? fcfs.reduce((a, b) => a + b) / fcfs.length : 0;
  const fcfVariance = fcfs.length >= 3 && mean !== 0 ?
    Math.sqrt(fcfs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / fcfs.length) / Math.abs(mean) : null;
  const predPts = fcfVariance == null ? 10 : fcfVariance < 0.15 ? 20 : fcfVariance < 0.30 ? 16 : fcfVariance < 0.50 ? 10 : 5;
  total += predPts;
  details.push({ label: 'FCF Predictability', value: fcfVariance != null ? (fcfVariance * 100).toFixed(0) + '% CV' : '—', points: predPts, maxPoints: 20,
    note: fcfVariance == null ? 'Insufficient data' : fcfVariance < 0.15 ? 'Very consistent FCF — base-case assumptions are reliable' : fcfVariance < 0.30 ? 'Reasonably stable FCF' : 'High FCF volatility — treat output as wide range, not precise estimate' });

  // Growth mismatch warning (Fix 7)
  if (historicalCAGR != null && historicalCAGR < 0.20 && regime.impliedEpsCAGR != null && regime.impliedEpsCAGR > 25) {
    flags.push({
      text: `⚠ DCF inputs may understate growth — historical FCF CAGR ${pctLabel(historicalCAGR)} vs implied forward EPS CAGR ~${regime.impliedEpsCAGR.toFixed(0)}%. The base-case uses forward estimates; consider running the full DCF Calculator with analyst revenue projections.`,
      type: 'neutral'
    });
  }
  if (baseMoS != null && baseMoS > 0.35) flags.push({ text: `Base-case DCF: intrinsic value ~$${baseValue?.toFixed(2)} vs current price — significant upside if forward growth assumptions hold`, type: 'good' });
  if (baseMoS != null && baseMoS < -0.25) flags.push({ text: `Base-case DCF: stock at ~${(Math.abs(baseMoS) * 100).toFixed(0)}% premium to estimated intrinsic value — forward assumptions must be met precisely`, type: 'bad' });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Strong intrinsic value margin of safety — base-case DCF suggests meaningful undervaluation' :
    score >= 65 ? 'Positive margin of safety — base-case price offers reasonable discount to intrinsic value' :
    score >= 50 ? 'Near fair value — limited margin of safety in base-case assumptions' :
    score >= 35 ? 'Trading above base-case DCF — forward growth must materialize to justify price' :
    'Significant premium to base-case DCF — requires growth acceleration beyond current estimates';

  return {
    phase: 5, title: 'Intrinsic Value (Auto-DCF)', score, grade: gradeFromScore(score), headline,
    summary: `Base: ${baseValue != null ? '$' + baseValue.toFixed(2) : '—'} (MoS ${baseMoS != null ? pctLabel(baseMoS) : '—'}) · Bear: ${scenarios.find(s => s.label === 'Bear')?.intrinsicValue != null ? '$' + scenarios.find(s => s.label === 'Bear')!.intrinsicValue!.toFixed(2) : '—'} · Bull: ${scenarios.find(s => s.label === 'Bull')?.intrinsicValue != null ? '$' + scenarios.find(s => s.label === 'Bull')!.intrinsicValue!.toFixed(2) : '—'}`,
    details, flags, dcfScenarios: scenarios,
    regime: regime.regime,
  };
}

// ── Phase 6 — Dividend & Capital Return ──────────────────────────────────────
// Fix 8: net buyback yield, ROIC-based reinvestment quality, debt-adjusted cap

export function scoreDividends(
  divEntries: AVDividendEntry[], cashflow: AVReport[], _income: AVReport[], ov: AVOverview
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const yield_ = nn(ov.DividendYield);
  const divPerShare = nn(ov.DividendPerShare);
  const hasDividend = yield_ != null && yield_ > 0.001;
  const mktCap = nn(ov.MarketCapitalization);
  const cf0 = cashflow[0];

  // ── Shared: compute SBC, buybacks, net leverage ──
  const sbc = cf0 ? Math.abs(r(cf0, 'stockBasedCompensation') ?? 0) : 0;
  const buybacksRaw = cf0 ? Math.abs(r(cf0, 'commonStockRepurchased') ?? r(cf0, 'paymentsForRepurchaseOfCommonStock') ?? 0) : 0;
  const netBuybacks = Math.max(0, buybacksRaw - sbc);
  const netBuybackYield = mktCap != null && mktCap > 0 ? netBuybacks / mktCap : null;

  // Net leverage for debt-adjusted cap
  const debt = cashflow[0] ? (r(cashflow[0] as unknown as AVReport, 'shortLongTermDebtTotal') ?? 0) : 0;
  // Use EBITDA from overview
  const ebitda = nn(ov.EBITDA);
  const cashBal = cf0 ? (r(cf0, 'cashAndCashEquivalentsAtCarryingValue') ?? 0) : 0;
  const netDebt = debt - cashBal;
  const netLeverage = ebitda != null && ebitda > 0 ? netDebt / ebitda : null;
  const highLeverage = netLeverage != null && netLeverage > 2 && buybacksRaw > 0;

  // ── ROIC proxy (Fix 8) ──
  const roic = nn(ov.ReturnOnEquityTTM); // Proxy; actual ROIC would need more data
  const roicPts = roic == null ? 5 : roic > 0.25 ? 10 : roic > 0.15 ? 8 : roic > 0.08 ? 5 : 2;

  if (!hasDividend) {
    // ── Non-dividend path (Fix 8) ──

    // 1. FCF Yield (unchanged sub-score)
    const ocf = cf0 ? r(cf0, 'operatingCashflow') : null;
    const capex = cf0 ? r(cf0, 'capitalExpenditures') : null;
    const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : null;
    const fcfYield = fcf != null && mktCap != null && mktCap > 0 ? fcf / mktCap : null;
    const fcfYieldPts = fcfYield != null ? (fcfYield > 0.05 ? 30 : fcfYield > 0.03 ? 24 : fcfYield > 0.01 ? 16 : 8) : 18;
    total += fcfYieldPts;
    details.push({ label: 'FCF Yield', value: fcfYield != null ? (fcfYield * 100).toFixed(1) + '%' : '—', points: fcfYieldPts, maxPoints: 30,
      note: fcfYield != null && fcfYield > 0.04 ? 'Strong FCF yield — capital is being generated for reinvestment or return' : fcfYield != null && fcfYield > 0.02 ? 'Moderate FCF yield' : 'Low FCF yield — either reinvesting aggressively for growth, or marginal cash generation' });

    // 2. Net Buyback Yield = (gross buybacks − SBC) / market cap (Fix 8)
    let netBBPts: number;
    let netBBNote: string;
    if (netBuybackYield == null) {
      netBBPts = 10; netBBNote = 'Buyback data unavailable';
    } else if (netBuybackYield < 0) {
      netBBPts = 0; netBBNote = 'SBC issuance exceeds buybacks — net dilutive to shareholders';
      flags.push({ text: 'Net dilution: SBC issued exceeds shares repurchased — buybacks are not offsetting equity dilution', type: 'bad' });
    } else if (netBuybackYield === 0) {
      netBBPts = 10; netBBNote = 'No net capital return via buybacks after SBC offset';
    } else {
      netBBPts = netBuybackYield > 0.04 ? 20 : netBuybackYield > 0.02 ? 16 : netBuybackYield > 0.005 ? 11 : 7;
      netBBNote = `Net buyback yield of ${(netBuybackYield * 100).toFixed(1)}% after deducting SBC — shareholder-friendly capital allocation`;
      if (netBuybackYield > 0.03) flags.push({ text: `Net buyback yield of ${(netBuybackYield * 100).toFixed(1)}% (after SBC) — meaningful cash return to shareholders`, type: 'good' });
    }
    total += netBBPts;
    details.push({ label: 'Net Buyback Yield (after SBC)', value: netBuybackYield != null ? (netBuybackYield * 100).toFixed(1) + '%' : '—', points: netBBPts, maxPoints: 20,
      note: netBBNote, warning: buybacksRaw > 0 && sbc > 0 ? `Gross buybacks $${(buybacksRaw / 1e9).toFixed(1)}B minus SBC $${(sbc / 1e9).toFixed(1)}B` : undefined });

    // 3. ROIC reinvestment quality (Fix 8)
    total += roicPts;
    details.push({ label: 'Reinvestment Quality (ROE proxy)', value: roic != null ? (roic * 100).toFixed(1) + '%' : '—', points: roicPts, maxPoints: 10,
      note: roic == null ? 'Data unavailable' : roic > 0.25 ? 'High ROE — reinvested FCF is generating strong returns' : roic > 0.15 ? 'Solid ROE — reinvestment creating value above cost of capital' : roic > 0.08 ? 'Moderate reinvestment quality' : 'Low ROE — reinvested capital generating poor returns; question management\'s allocation priorities' });

    // 4. Debt-adjusted cap (Fix 8)
    let capReturnPts = 30;
    let capReturnNote = 'Non-dividend payer — no payout ratio risk; scored on capital return quality';
    if (highLeverage) {
      capReturnPts = Math.min(10, capReturnPts);
      capReturnNote = `⚠ Net leverage ${netLeverage != null ? fmt2(netLeverage) + 'x' : 'elevated'} while executing buybacks — capital allocation risk: share repurchases while carrying significant debt. Score capped.`;
      flags.push({ text: `High leverage (${netLeverage != null ? fmt2(netLeverage) + 'x' : '?'} Net Debt/EBITDA) while conducting buybacks — prioritising debt reduction would be more conservative`, type: 'bad' });
    }
    total += capReturnPts;
    details.push({ label: 'Capital Return Structure', value: highLeverage ? 'Leveraged buyback' : 'No dividend', points: capReturnPts, maxPoints: 30, note: capReturnNote });

    flags.push({ text: 'No dividend paid — capital returned via reinvestment or buybacks. Net buyback yield (after SBC) is the relevant return metric.', type: 'neutral' });

  } else {
    // ── Dividend path (unchanged, with net buyback added) ──

    // Yield quality — 15pts
    const yieldPts = yield_ == null ? 7 :
      yield_ > 0.06 ? 5 : yield_ > 0.04 ? 11 : yield_ > 0.02 ? 15 : yield_ > 0.01 ? 12 : 8;
    total += yieldPts;
    details.push({ label: 'Dividend Yield', value: yield_ != null ? (yield_ * 100).toFixed(1) + '%' : '—', points: yieldPts, maxPoints: 15,
      note: yield_ == null ? 'No data' : yield_ > 0.06 ? 'Yield above 6% — elevated; market may be pricing in cut risk' : yield_ > 0.04 ? 'High yield — typically sustainable for utilities, REITs, and strong large-caps' : yield_ > 0.02 ? 'Healthy yield' : 'Low but growing — focus on growth' });
    if (yield_ != null && yield_ > 0.065) flags.push({ text: `High yield of ${(yield_ * 100).toFixed(1)}% — verify FCF payout ratio; market may be pricing in a cut`, type: 'bad' });

    // FCF Payout Ratio — 35pts
    let fcfPayPts = 15; let fcfPayNote = 'Data unavailable'; let fcfPayLabel = '—';
    if (cf0) {
      const ocf = r(cf0, 'operatingCashflow');
      const capex = r(cf0, 'capitalExpenditures');
      const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : null;
      const divPaid = Math.abs(r(cf0, 'dividendPayout') ?? r(cf0, 'dividendPayoutCommonStock') ?? 0);
      if (fcf != null && fcf > 0 && divPaid > 0) {
        const ratio = divPaid / fcf;
        fcfPayLabel = (ratio * 100).toFixed(0) + '%';
        fcfPayPts = ratio < 0.35 ? 35 : ratio < 0.50 ? 30 : ratio < 0.65 ? 22 : ratio < 0.80 ? 12 : ratio <= 1.0 ? 5 : 0;
        fcfPayNote = ratio < 0.40 ? 'Excellent — dividend consumes less than 40% of FCF' :
          ratio < 0.60 ? 'Safe — comfortably covered by free cash flow' :
          ratio < 0.80 ? 'Moderate — covered but limited buffer' :
          ratio <= 1.0 ? 'Stretched — nearly all FCF consumed by dividend' :
          'Unsustainable — paying more in dividends than FCF generated';
        if (ratio > 0.90) flags.push({ text: `FCF payout ratio of ${(ratio * 100).toFixed(0)}% — dividend at risk if FCF declines`, type: 'bad' });
        if (ratio < 0.45) flags.push({ text: `FCF payout ratio of ${(ratio * 100).toFixed(0)}% — dividend has strong FCF backing`, type: 'good' });
      }
    }
    total += fcfPayPts;
    details.push({ label: 'FCF Payout Ratio', value: fcfPayLabel, points: fcfPayPts, maxPoints: 35, note: fcfPayNote });

    // Dividend growth — 25pts
    const recentDivs = divEntries.slice(0, 8).map(d => nn(d.amount)).filter((v): v is number => v != null);
    const oldDivs = divEntries.slice(-8).map(d => nn(d.amount)).filter((v): v is number => v != null);
    let divGrowthPts = 10; let divGrowthNote = 'Insufficient history'; let divGrowthLabel = '—';
    if (recentDivs.length >= 4 && oldDivs.length >= 4) {
      const annualRecent = recentDivs.slice(0, 4).reduce((a, b) => a + b, 0);
      const annualOld = oldDivs.slice(0, 4).reduce((a, b) => a + b, 0);
      if (annualOld > 0) {
        const g = (annualRecent - annualOld) / annualOld;
        divGrowthLabel = pctLabel(g);
        divGrowthPts = g > 0.10 ? 25 : g > 0.06 ? 20 : g > 0.02 ? 14 : g > 0 ? 8 : g === 0 ? 5 : 0;
        divGrowthNote = g > 0.10 ? 'Dividend growing >10%/yr — yield-on-cost doubles in <7 years' :
          g > 0.05 ? 'Solid dividend growth' : g > 0 ? 'Modest growth' :
          g === 0 ? 'Dividend frozen' : 'Dividend cut — serious red flag for income investors';
        if (g < 0) flags.push({ text: 'Dividend was cut — history shows cuts often precede further cuts', type: 'bad' });
        if (g > 0.08) flags.push({ text: `Dividend growing ~${(g * 100).toFixed(0)}%/yr — compounding income stream`, type: 'good' });
      }
    }
    total += divGrowthPts;
    details.push({ label: 'Dividend Growth', value: divGrowthLabel, points: divGrowthPts, maxPoints: 25, note: divGrowthNote });

    // Earnings payout — 25pts
    const eps = nn(ov.EPS);
    let earnPayPts = 12; let earnPayNote = 'Data unavailable'; let earnPayLabel = '—';
    if (eps != null && eps > 0 && divPerShare != null) {
      const earnPay = divPerShare / eps;
      earnPayLabel = (earnPay * 100).toFixed(0) + '%';
      earnPayPts = earnPay < 0.30 ? 25 : earnPay < 0.50 ? 22 : earnPay < 0.65 ? 16 : earnPay < 0.80 ? 9 : 3;
      earnPayNote = earnPay < 0.40 ? 'Low payout ratio — large buffer and room to grow dividend' :
        earnPay < 0.60 ? 'Moderate payout — balanced income and reinvestment' :
        earnPay < 0.80 ? 'High payout — sensitive to earnings dips' : 'Very high — one bad year could force a cut';
    }
    total += earnPayPts;
    details.push({ label: 'Earnings Payout Ratio', value: earnPayLabel, points: earnPayPts, maxPoints: 25, note: earnPayNote });
  }

  const score = clamp(Math.round(total), 0, 100);
  const isNoDivScore = !hasDividend;
  const headline = isNoDivScore
    ? score >= 70 ? 'Strong capital return quality — net buybacks positive after SBC, high ROIC reinvestment'
    : score >= 50 ? 'Adequate capital return — FCF generation is solid; evaluate net buyback yield vs SBC dilution'
    : 'Weak capital return — SBC may be offsetting or exceeding buybacks; low ROIC on reinvested capital'
    : score >= 80 ? 'Dividend is safe and growing — well-covered by FCF with strong payout growth'
    : score >= 65 ? 'Dividend appears safe — covered by FCF with reasonable growth'
    : score >= 50 ? 'Dividend covered but with limited cushion — monitor payout ratio'
    : score >= 35 ? 'Dividend under pressure — high payout ratio or stagnant growth'
    : 'Dividend at risk — payout unsustainable at current FCF levels or already cut';

  return {
    phase: 6, title: 'Dividend & Capital Return', score, grade: gradeFromScore(score), headline,
    summary: hasDividend
      ? `Yield ${yield_ != null ? (yield_ * 100).toFixed(1) + '%' : '—'} · Div growth ${details.find(d => d.label === 'Dividend Growth')?.value ?? '—'} · FCF payout ${details.find(d => d.label === 'FCF Payout Ratio')?.value ?? '—'}`
      : `FCF yield ${details.find(d => d.label === 'FCF Yield')?.value ?? '—'} · Net buyback yield ${netBuybackYield != null ? (netBuybackYield * 100).toFixed(1) + '%' : '—'}${highLeverage ? ' · ⚠ leveraged buybacks' : ''}`,
    details, flags,
  };
}

// ── Phase 7 — News Sentiment ──────────────────────────────────────────────────
// Fix 9: 50-article minimum, rolling trend, source breakdown, weighted scoring

export function scoreSentiment(
  newsItems: AVNewsItem[], ticker: string, ov: AVOverview
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const sym = ticker.toUpperCase();
  const now = new Date();

  // Filter to ticker-relevant items
  const relevant = newsItems.filter(n => n.ticker_sentiment?.some(t => t.ticker === sym));
  const all = relevant.length >= 10 ? relevant : newsItems;

  const getScore = (item: AVNewsItem): number => {
    const ts = item.ticker_sentiment?.find(t => t.ticker === sym);
    return ts ? parseFloat(ts.ticker_sentiment_score) : item.overall_sentiment_score;
  };
  const getLabel = (item: AVNewsItem): string => {
    const ts = item.ticker_sentiment?.find(t => t.ticker === sym);
    return ts ? ts.ticker_sentiment_label : item.overall_sentiment_label;
  };

  // Rolling buckets (Fix 9)
  const d7 = daysBefore(now, 7);
  const d30 = daysBefore(now, 30);
  const d90 = daysBefore(now, 90);

  const bucket = (items: AVNewsItem[], from: Date, to: Date = now) =>
    items.filter(n => { const d = parseAVDate(n.time_published); return d != null && d >= from && d <= to; });

  const items7   = bucket(all, d7);
  const items30  = bucket(all, d30, d7);    // 8–30 days ago
  const items90  = bucket(all, d90, d30);   // 31–90 days ago
  const allRecent = bucket(all, d90);        // last 90 days

  const avgScore = (arr: AVNewsItem[]) => {
    const s = arr.map(getScore).filter(v => !isNaN(v));
    return s.length > 0 ? s.reduce((a, b) => a + b) / s.length : null;
  };

  const sent7   = avgScore(items7);
  const sent30  = avgScore(items30);
  const sent90  = avgScore(items90);
  const sentAll = avgScore(allRecent);

  // Fix 9: minimum 50-article threshold
  const MIN_ARTICLES = 50;
  const totalCount = allRecent.length;
  const insufficientData = totalCount < MIN_ARTICLES;

  // ── Overall sentiment score — 50pts ──
  const primarySent = sent7 ?? sent30 ?? sentAll;
  const sentPts = primarySent == null ? 20 :
    primarySent > 0.25 ? 50 : primarySent > 0.15 ? 43 : primarySent > 0.05 ? 35 :
    primarySent > -0.05 ? 25 : primarySent > -0.15 ? 15 : 7;

  total += insufficientData ? Math.round(sentPts * 0.7) : sentPts; // discount if insufficient data

  const sentWarning = insufficientData ? `Insufficient article volume — ${totalCount} articles (min 50 for high-confidence scoring); score discounted` : undefined;
  details.push({
    label: 'News Sentiment Score',
    value: primarySent != null ? primarySent.toFixed(3) + ' / 1.0' : '—',
    points: insufficientData ? Math.round(sentPts * 0.7) : sentPts,
    maxPoints: 50,
    note: primarySent == null ? 'No news data available' :
      primarySent > 0.20 ? 'Strongly positive news flow — recent coverage is broadly constructive' :
      primarySent > 0.05 ? 'Mildly positive sentiment — news leans favourable' :
      primarySent > -0.05 ? 'Neutral sentiment — no strong narrative' :
      primarySent > -0.15 ? 'Mildly negative — recent coverage is cautious' :
      'Negative news flow — significant bearish narrative',
    warning: sentWarning,
  });

  // ── Rolling trend (Fix 9) ──
  let trendPts = 15; let trendNote = 'Insufficient history for trend'; let trendLabel = '—';
  if (sent7 != null && sent90 != null) {
    const trend = sent7 - sent90;
    trendLabel = trend > 0.05 ? 'Improving ↑' : trend < -0.05 ? 'Deteriorating ↓' : 'Stable →';
    trendPts = trend > 0.10 ? 25 : trend > 0.03 ? 20 : trend > -0.03 ? 15 : trend > -0.10 ? 9 : 4;
    trendNote = `7-day avg: ${sent7.toFixed(3)} · 8–30d avg: ${sent30 != null ? sent30.toFixed(3) : '—'} · 31–90d avg: ${sent90.toFixed(3)}. ` +
      (trend > 0.05 ? 'Sentiment improving — coverage more positive in recent days than prior period' :
       trend < -0.05 ? 'Sentiment deteriorating — coverage turning more negative recently' :
       'Sentiment stable — no clear directional shift in tone');
    if (trend > 0.08) flags.push({ text: `Sentiment trend: improving over last 30 days (+${(trend * 100).toFixed(1)} pts) — narrative turning more positive`, type: 'good' });
    if (trend < -0.08) flags.push({ text: `Sentiment trend: deteriorating (${(trend * 100).toFixed(1)} pts) — narrative turning more negative recently`, type: 'bad' });
  } else if (sentAll != null) {
    trendPts = 12; trendNote = `Overall avg sentiment ${sentAll.toFixed(3)} — trend unavailable (need 90+ days of data)`;
  }
  total += trendPts;
  details.push({ label: 'Sentiment Trend (90d)', value: trendLabel, points: trendPts, maxPoints: 25, note: trendNote });

  // ── Bullish article rate — 25pts (Fix 9: trend arrow) ──
  const labelsRecent = allRecent.map(getLabel);
  const labelsOld    = items90.map(getLabel);
  const countBull = (arr: string[]) => arr.filter(l => l?.toLowerCase().includes('bullish')).length;
  const countBear = (arr: string[]) => arr.filter(l => l?.toLowerCase().includes('bearish')).length;

  const bullish = countBull(labelsRecent);
  const bearish = countBear(labelsRecent);
  const neutral = labelsRecent.length - bullish - bearish;
  const bullRate = labelsRecent.length > 0 ? bullish / labelsRecent.length : null;

  // Trend: 30-day bull rate vs 90-day bull rate
  const bullRate90 = labelsOld.length > 0 ? countBull(labelsOld) / labelsOld.length : null;
  const bullTrend = bullRate != null && bullRate90 != null ? bullRate - bullRate90 : null;
  const trendArrow = bullTrend == null ? '' : bullTrend > 0.05 ? ' ↑' : bullTrend < -0.05 ? ' ↓' : ' →';

  const distPts = bullRate == null ? 10 : bullRate > 0.6 ? 25 : bullRate > 0.45 ? 21 : bullRate > 0.3 ? 16 : bullRate > 0.15 ? 9 : 4;
  total += distPts;
  details.push({
    label: 'Bullish Article Rate',
    value: labelsRecent.length > 0 ? `${bullish}B/${neutral}N/${bearish}Br (${labelsRecent.length})${trendArrow}` : '—',
    points: distPts, maxPoints: 25,
    note: bullRate == null ? 'No labelled data' :
      `${(bullRate * 100).toFixed(0)}% bullish${bullTrend != null ? `; vs 90d prior ${(bullRate90! * 100).toFixed(0)}% — ${bullTrend > 0.05 ? 'improving' : bullTrend < -0.05 ? 'deteriorating' : 'stable'}` : ''}. ` +
      (bullRate > 0.5 ? 'Majority positive.' : bullRate > 0.3 ? 'Mixed but tilting positive.' : 'Bearish or neutral tone dominates.')
  });

  // ── Analyst target context — keep as-is ──
  const target = nn(ov.AnalystTargetPrice);
  const hi = nn(ov['52WeekHigh']); const lo = nn(ov['52WeekLow']);
  let contextPts = 12; let contextNote = 'Context data unavailable'; let contextLabel = '—';
  if (target != null && hi != null && lo != null) {
    const targetInRange = target >= lo && target <= hi * 1.3;
    contextLabel = targetInRange ? 'Target in normal range' : 'Target is outlier';
    contextPts = targetInRange ? 20 : 10;
    contextNote = `Analyst consensus $${target.toFixed(2)} vs 52-wk range $${lo.toFixed(0)}–$${hi.toFixed(0)}. ${targetInRange ? 'Target aligns with recent price action.' : 'Target appears aggressive relative to recent trading range.'}`;
  }
  total += contextPts;
  details.push({ label: 'Analyst Target Context', value: contextLabel, points: contextPts, maxPoints: 25, note: contextNote });

  if (primarySent != null && primarySent > 0.20) flags.push({ text: 'Recent news sentiment is strongly positive — analyst and media tone is constructive', type: 'good' });
  if (primarySent != null && primarySent < -0.10) flags.push({ text: 'Negative news sentiment — recent media coverage is cautious or bearish', type: 'bad' });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Strong positive sentiment — news flow, trend, and coverage are broadly constructive' :
    score >= 65 ? 'Favourable sentiment — tilting positive with no major narrative headwinds' :
    score >= 50 ? 'Mixed sentiment — no strong directional narrative; market in a wait-and-see mode' :
    score >= 35 ? 'Cautious sentiment — news flow is negative or bearish tone is dominant' :
    'Negative sentiment — significant bearish narrative; sentiment is a headwind';

  return {
    phase: 7, title: 'Sentiment & News', score, grade: gradeFromScore(score), headline,
    summary: `Sentiment ${primarySent != null ? primarySent.toFixed(3) : '—'} · Trend ${trendLabel} · ${bullish}B/${neutral}N/${bearish}Br (${allRecent.length} articles)`,
    details, flags,
  };
}

// ── Composite score ───────────────────────────────────────────────────────────

export function computeComposite(phases: PhaseScore[]): { score: number; grade: Grade; headline: string } {
  const weights: Record<number, number> = { 2: 0.25, 3: 0.20, 4: 0.20, 5: 0.15, 6: 0.10, 7: 0.10 };
  let weighted = 0, totalW = 0;
  for (const p of phases) { const w = weights[p.phase] ?? 0; weighted += p.score * w; totalW += w; }
  const score = totalW > 0 ? clamp(Math.round(weighted / totalW), 0, 100) : 50;
  const grade = gradeFromScore(score);
  const headline =
    score >= 80 ? 'High-conviction opportunity — strong fundamentals, attractive valuation, and positive catalysts align' :
    score >= 70 ? 'Solid investment case — most pillars are positive with manageable risks' :
    score >= 60 ? 'Moderate conviction — good in some areas but notable concerns worth monitoring' :
    score >= 45 ? 'Mixed picture — some strengths but enough risks to warrant caution' :
    score >= 30 ? 'Weak overall — significant challenges across multiple dimensions' :
    'Strong avoid — multiple red flags across fundamentals, valuation, and/or sentiment';
  return { score, grade, headline };
}
