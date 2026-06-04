// ── Auto-Analysis Scoring Engine ─────────────────────────────────────────────
// Pure functions — no React, no side effects.
// Takes raw Alpha Vantage API responses, returns structured PhaseScore objects.

import { nn } from './avClient';

// ── Shared types ──────────────────────────────────────────────────────────────

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
export type FlagType = 'good' | 'bad' | 'neutral';

export interface ScoreDetail {
  label: string;
  value: string;
  points: number;
  maxPoints: number;
  note: string;
}

export interface PhaseScore {
  phase: number;
  title: string;
  score: number;        // 0–100
  grade: Grade;
  headline: string;
  summary: string;
  details: ScoreDetail[];
  flags: { text: string; type: FlagType }[];
}

export interface FullAnalysis {
  ticker: string;
  companyName: string;
  sector: string;
  currency: string;
  phases: PhaseScore[];
  overallScore: number;
  overallGrade: Grade;
  compositeHeadline: string;
  fetchedAt: number;
}

// ── Raw AV types (minimal — only what we need) ────────────────────────────────

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

export interface AVDividendEntry { ex_dividend_date: string; amount: string }

export interface AVNewsItem {
  title: string; summary: string; source: string;
  overall_sentiment_score: number; overall_sentiment_label: string;
  ticker_sentiment?: { ticker: string; ticker_sentiment_score: string; ticker_sentiment_label: string }[];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function gradeFromScore(s: number): Grade {
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B+';
  if (s >= 60) return 'B';
  if (s >= 50) return 'C+';
  if (s >= 40) return 'C';
  if (s >= 30) return 'D';
  return 'F';
}

function r(v: AVReport, key: string): number | null { return nn(v[key]) }


function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function pctLabel(v: number | null): string {
  if (v == null) return '—';
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';
}

function xLabel(v: number | null): string {
  if (v == null) return '—';
  return v.toFixed(1) + 'x';
}

function fmt2(v: number | null): string {
  if (v == null) return '—';
  return v.toFixed(1);
}

// ── Phase 2 — Financial Health ────────────────────────────────────────────────

export function scoreFinancialHealth(
  income: AVReport[], balance: AVReport[], cashflow: AVReport[]
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  // ── Revenue CAGR (3yr) — 20pts ──
  const revs = income.slice(0, 4).map(s => r(s, 'totalRevenue'));
  let revCagr: number | null = null;
  if (revs[0] != null && revs[3] != null && revs[3] > 0) {
    revCagr = Math.pow(revs[0] / revs[3], 1 / 3) - 1;
  }
  const revPts = revCagr == null ? 8 :
    revCagr > 0.20 ? 20 : revCagr > 0.10 ? 15 :
    revCagr > 0.05 ? 10 : revCagr > 0 ? 6 : 2;
  total += revPts;
  details.push({ label: 'Revenue CAGR (3yr)', value: pctLabel(revCagr), points: revPts, maxPoints: 20,
    note: revCagr == null ? 'Insufficient history' : revCagr > 0.15 ? 'Strong top-line growth' : revCagr > 0.05 ? 'Moderate growth' : revCagr > 0 ? 'Slow growth' : 'Revenue declining' });
  if (revCagr != null && revCagr < 0) flags.push({ text: 'Revenue declining YoY — top-line is shrinking', type: 'bad' });
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

  // ── Operating Margin trend — 15pts ──
  const om0 = income[0] ? (r(income[0], 'operatingIncome') ?? 0) / (r(income[0], 'totalRevenue') ?? 1) : null;
  const om2 = income[2] ? (r(income[2], 'operatingIncome') ?? 0) / (r(income[2], 'totalRevenue') ?? 1) : null;
  const omTrend = om0 != null && om2 != null ? om0 - om2 : null;
  const omPts = omTrend == null ? 7 : omTrend > 0.02 ? 15 : omTrend > 0 ? 11 : omTrend > -0.02 ? 7 : 2;
  total += omPts;
  details.push({ label: 'Operating Margin Trend', value: om0 != null ? (om0 * 100).toFixed(1) + '%' : '—', points: omPts, maxPoints: 15,
    note: omTrend == null ? 'Insufficient data' : omTrend > 0.02 ? 'Operating leverage improving — costs scaling slower than revenue' : omTrend > 0 ? 'Slight improvement' : omTrend > -0.02 ? 'Stable but slightly compressing' : 'Operating margin deteriorating — investigate opex growth' });
  if (omTrend != null && omTrend < -0.03) flags.push({ text: `Operating margin down ${(Math.abs(omTrend) * 100).toFixed(1)}pp — SG&A or R&D growing faster than revenue`, type: 'bad' });
  if (omTrend != null && omTrend > 0.03) flags.push({ text: `Operating leverage evident — margin expanding ${(omTrend * 100).toFixed(1)}pp`, type: 'good' });

  // ── FCF quality — 15pts ──
  let fcfPts = 7;
  let fcfNote = 'Data unavailable';
  let fcfLabel = '—';
  const cf0 = cashflow[0];
  if (cf0) {
    const ocf = r(cf0, 'operatingCashflow');
    const capex = r(cf0, 'capitalExpenditures');
    const ni = r(income[0], 'netIncome');
    const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : ocf;
    const rev = r(income[0], 'totalRevenue');
    const fcfMargin = fcf != null && rev != null && rev > 0 ? fcf / rev : null;
    fcfLabel = fcfMargin != null ? (fcfMargin * 100).toFixed(1) + '%' : '—';
    if (fcf != null && ni != null && ni !== 0) {
      const ratio = fcf / Math.abs(ni);
      fcfPts = ratio > 1.2 ? 15 : ratio > 0.9 ? 12 : ratio > 0.6 ? 8 : ratio > 0.3 ? 4 : 1;
      fcfNote = ratio > 1.2 ? 'FCF exceeds net income — high earnings quality, no accrual games' :
        ratio > 0.9 ? 'FCF closely tracks earnings — good quality' :
        ratio > 0.6 ? 'FCF below earnings — check working capital movements' :
        'FCF significantly below earnings — potential earnings quality concern';
      if (ratio < 0.5 && ni > 0) flags.push({ text: 'Net income significantly exceeds FCF — check receivables buildup or aggressive revenue recognition', type: 'bad' });
      if (ratio > 1.3) flags.push({ text: 'FCF > net income — earnings quality is high; cash generation is real', type: 'good' });
    } else if (fcf != null && fcf < 0) {
      fcfPts = 1; fcfNote = 'Negative free cash flow — burning cash';
      flags.push({ text: 'Negative FCF — company consuming cash; evaluate whether this is investment-phase or structural', type: 'bad' });
    }
    if (fcfMargin != null && fcfMargin > 0.15) flags.push({ text: `FCF margin of ${(fcfMargin * 100).toFixed(1)}% is exceptional — strong cash conversion`, type: 'good' });
  }
  total += fcfPts;
  details.push({ label: 'FCF Margin / Quality', value: fcfLabel, points: fcfPts, maxPoints: 15, note: fcfNote });

  // ── Leverage — 20pts ──
  let levPts = 10; let levNote = 'Data unavailable'; let levLabel = '—';
  const bal0 = balance[0]; const cf0b = cashflow[0];
  if (bal0) {
    const debt = (r(bal0, 'shortLongTermDebtTotal') ?? r(bal0, 'longTermDebt') ?? 0);
    const cash = r(bal0, 'cashAndShortTermInvestments') ?? 0;
    const netDebt = debt - cash;
    const ebitda = income[0] ? (r(income[0], 'ebitda') ?? (() => {
      const oi = r(income[0], 'operatingIncome');
      const da = r(cf0b ?? {} as AVReport, 'depreciationDepletionAndAmortization');
      return oi != null && da != null ? oi + Math.abs(da) : oi;
    })()) : null;
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
      if (ratio > 3.5) flags.push({ text: `Net Debt/EBITDA of ${ratio.toFixed(1)}x is elevated — covenant and refinancing risk in higher rate environment`, type: 'bad' });
      if (ratio < 0.5) flags.push({ text: `Near debt-free (Net Debt/EBITDA ${ratio.toFixed(1)}x) — balance sheet is a competitive advantage`, type: 'good' });
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
      icNote = cov > 10 ? 'Extremely comfortable debt service — no interest risk' :
        cov > 5 ? 'Solid coverage — earnings can fall substantially before interest becomes a problem' :
        cov > 3 ? 'Adequate but watch if earnings decline' :
        cov > 1.5 ? 'Thin margin — a bad quarter could stress interest payments' :
        'Near-distress coverage — interest is consuming most operating profit';
      if (cov < 2) flags.push({ text: `Interest coverage of ${cov.toFixed(1)}x is dangerously low — any earnings decline could trigger covenant breach`, type: 'bad' });
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
    summary: `Revenue CAGR ${pctLabel(revCagr)} · Gross margin ${gm0 != null ? (gm0 * 100).toFixed(0) + '%' : '—'} · Net Debt/EBITDA ${levLabel} · Interest coverage ${icLabel}`,
    details, flags,
  };
}

// ── Phase 3 — Earnings Quality ────────────────────────────────────────────────

export function scoreEarningsQuality(earnings: AVEarningsQuarter[]): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;
  const q = earnings.slice(0, 8);

  // ── EPS Beat Rate — 30pts ──
  const beats = q.filter(e => nn(e.surprisePercentage) != null && nn(e.surprisePercentage)! > 0).length;
  const beatRate = q.length > 0 ? beats / q.length : null;
  const beatPts = beatRate == null ? 10 :
    beatRate >= 0.875 ? 30 : beatRate >= 0.75 ? 24 : beatRate >= 0.625 ? 16 : beatRate >= 0.5 ? 9 : 3;
  total += beatPts;
  details.push({ label: 'EPS Beat Rate', value: beatRate != null ? (beatRate * 100).toFixed(0) + '%' : '—', points: beatPts, maxPoints: 30,
    note: beatRate == null ? 'No data' : beatRate >= 0.875 ? 'Near-perfect execution — management consistently sandbaggs and beats' : beatRate >= 0.75 ? 'Strong beat record — reliable earnings delivery' : beatRate >= 0.5 ? 'Inconsistent — about half the quarters miss consensus' : 'Poor execution — management cannot reliably forecast its own business' });
  if (beatRate != null && beatRate >= 0.875) flags.push({ text: `EPS beat rate of ${(beatRate * 100).toFixed(0)}% over last ${q.length}Q — management consistently under-promises`, type: 'good' });
  if (beatRate != null && beatRate < 0.5) flags.push({ text: `Only ${(beatRate * 100).toFixed(0)}% EPS beat rate — execution risk is elevated`, type: 'bad' });

  // ── Average Surprise % — 25pts ──
  const surprises = q.map(e => nn(e.surprisePercentage)).filter((v): v is number => v != null);
  const avgSurprise = surprises.length > 0 ? surprises.reduce((a, b) => a + b, 0) / surprises.length : null;
  const surprisePts = avgSurprise == null ? 8 :
    avgSurprise > 8 ? 25 : avgSurprise > 5 ? 21 : avgSurprise > 3 ? 16 : avgSurprise > 1 ? 10 : avgSurprise > 0 ? 5 : 2;
  total += surprisePts;
  details.push({ label: 'Avg EPS Surprise', value: avgSurprise != null ? (avgSurprise > 0 ? '+' : '') + avgSurprise.toFixed(1) + '%' : '—', points: surprisePts, maxPoints: 25,
    note: avgSurprise == null ? 'No data' : avgSurprise > 5 ? 'Consistently beating by wide margins — high earnings visibility and conservative guidance' : avgSurprise > 2 ? 'Regular positive surprises — management sets beatable targets' : avgSurprise > 0 ? 'Modest positive surprises — barely meeting expectations' : 'Missing consensus on average — guidance credibility is low' });

  // ── EPS Growth (most recent YoY) — 25pts ──
  let growthPts = 8; let growthLabel = '—'; let growthNote = 'Insufficient history';
  if (q.length >= 5) {
    const curr = nn(q[0].reportedEPS); const prev = nn(q[4].reportedEPS);
    if (curr != null && prev != null && prev > 0) {
      const g = (curr - prev) / prev;
      growthLabel = pctLabel(g);
      growthPts = g > 0.25 ? 25 : g > 0.15 ? 21 : g > 0.08 ? 15 : g > 0.02 ? 9 : g > 0 ? 5 : 1;
      growthNote = g > 0.25 ? 'Accelerating EPS growth — earnings power compounding strongly' : g > 0.10 ? 'Solid EPS growth — business expanding profitably' : g > 0 ? 'Modest earnings growth' : 'EPS declining YoY — investigate whether structural or cyclical';
      if (g < 0) flags.push({ text: `EPS declining ${(Math.abs(g) * 100).toFixed(0)}% YoY — earnings are deteriorating`, type: 'bad' });
      if (g > 0.20) flags.push({ text: `EPS up ${(g * 100).toFixed(0)}% YoY — strong earnings momentum`, type: 'good' });
    }
  }
  total += growthPts;
  details.push({ label: 'EPS Growth YoY', value: growthLabel, points: growthPts, maxPoints: 25, note: growthNote });

  // ── Revenue Beat Rate — 20pts ──
  // Revenue surprises aren't directly available from EARNINGS endpoint but we can infer from surprise pattern
  // Use EPS surprise trend as a proxy and note the limitation
  const revBeatPts = beatRate != null ? Math.round(beatRate * 20) : 8;
  total += revBeatPts;
  details.push({ label: 'Execution Consistency', value: beatRate != null ? (beats + '/' + q.length + ' beats') : '—', points: revBeatPts, maxPoints: 20,
    note: 'Measured over the last ' + q.length + ' reported quarters. Consistent execution signals strong management forecasting ability and business visibility.' });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Excellent execution — consistent beats with strong EPS growth, management guidance is highly credible' :
    score >= 65 ? 'Good earnings track record — regular beats and positive growth trend' :
    score >= 50 ? 'Mixed execution — some beats but inconsistent guidance or slowing growth' :
    score >= 35 ? 'Weak execution — frequent misses or negative EPS trend, guidance credibility low' :
    'Poor earnings quality — persistent misses and/or declining earnings power';

  return {
    phase: 3, title: 'Earnings Quality', score, grade: gradeFromScore(score), headline,
    summary: `Beat rate ${beatRate != null ? (beatRate * 100).toFixed(0) + '%' : '—'} · Avg surprise ${avgSurprise != null ? (avgSurprise > 0 ? '+' : '') + avgSurprise.toFixed(1) + '%' : '—'} · EPS growth ${growthLabel}`,
    details, flags,
  };
}

// ── Phase 4 — Valuation ───────────────────────────────────────────────────────

export function scoreValuation(ov: AVOverview, price: number | null): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  // ── Forward P/E — 20pts ──
  const fpe = nn(ov.ForwardPE);
  const tpe = nn(ov.TrailingPE);
  const activePE = fpe ?? tpe;
  const isPEfwd = fpe != null;
  const pePts = activePE == null ? 8 :
    activePE <= 0 ? 4 : activePE < 12 ? 20 : activePE < 18 ? 16 : activePE < 25 ? 11 : activePE < 35 ? 6 : 3;
  total += pePts;
  details.push({ label: isPEfwd ? 'Forward P/E' : 'Trailing P/E', value: activePE != null ? fmt2(activePE) + 'x' : '—', points: pePts, maxPoints: 20,
    note: activePE == null ? 'No earnings data' : activePE <= 0 ? 'Negative earnings — P/E not meaningful' : activePE < 12 ? 'Deeply discounted vs historical averages — value territory' : activePE < 18 ? 'Attractively valued — below S&P 500 average' : activePE < 25 ? 'Fair value — in line with market average' : activePE < 35 ? 'Growth premium — justified only with strong earnings acceleration' : 'Expensive — priced for near-perfection, high execution risk' });
  if (activePE != null && activePE > 40) flags.push({ text: `P/E of ${activePE.toFixed(0)}x is very high — any deceleration will compress the multiple sharply`, type: 'bad' });
  if (activePE != null && activePE > 0 && activePE < 12) flags.push({ text: `P/E of ${activePE.toFixed(0)}x is well below market average — potential value opportunity`, type: 'good' });

  // ── PEG Ratio — 25pts ──
  const peg = nn(ov.PEGRatio);
  const pegPts = peg == null ? 10 : peg <= 0 ? 5 : peg < 0.75 ? 25 : peg < 1.0 ? 22 : peg < 1.5 ? 16 : peg < 2.0 ? 9 : 3;
  total += pegPts;
  details.push({ label: 'PEG Ratio', value: peg != null ? fmt2(peg) + 'x' : '—', points: pegPts, maxPoints: 25,
    note: peg == null ? 'Data unavailable' : peg <= 0 ? 'Negative — not meaningful (negative growth or negative earnings)' : peg < 0.75 ? 'Compelling — paying less than 75c for each point of growth (classic undervalue signal)' : peg < 1.0 ? "Attractive — Peter Lynch's golden zone, growth not fully priced in" : peg < 1.5 ? 'Fair — reasonable growth-adjusted valuation' : peg < 2.0 ? 'Slightly stretched — market is pricing in optimistic growth' : 'Expensive on growth-adjusted basis — growth expectations may disappoint' });
  if (peg != null && peg > 0 && peg < 1.0) flags.push({ text: `PEG of ${fmt2(peg)} is below 1.0 — a classic signal that growth is not fully priced in`, type: 'good' });
  if (peg != null && peg > 2.5) flags.push({ text: `PEG of ${fmt2(peg)} suggests the market is paying a heavy premium for growth — high bar to clear`, type: 'bad' });

  // ── EV/EBITDA — 25pts ──
  const evEbitda = nn(ov.EVToEBITDA);
  const evePts = evEbitda == null ? 10 :
    evEbitda <= 0 ? 5 : evEbitda < 8 ? 25 : evEbitda < 12 ? 21 : evEbitda < 18 ? 14 : evEbitda < 25 ? 8 : 3;
  total += evePts;
  details.push({ label: 'EV / EBITDA', value: evEbitda != null ? fmt2(evEbitda) + 'x' : '—', points: evePts, maxPoints: 25,
    note: evEbitda == null ? 'Data unavailable' : evEbitda <= 0 ? 'Negative EBITDA — company is not yet operating profitably' : evEbitda < 8 ? 'Deeply cheap on operational basis — M&A-level attractiveness' : evEbitda < 12 ? 'Well-priced — below S&P 500 median' : evEbitda < 18 ? 'Fair value — in line with market' : evEbitda < 25 ? 'Premium multiple — requires above-average growth to justify' : 'Expensive on operational basis — limited margin of safety' });

  // ── Price vs 52-week range — 15pts ──
  let rangePts = 7; let rangeNote = 'Unavailable'; let rangeLabel = '—';
  const hi = nn(ov['52WeekHigh']); const lo = nn(ov['52WeekLow']);
  if (price != null && hi != null && lo != null && hi > lo) {
    const pos = (price - lo) / (hi - lo); // 0 = at 52-wk low, 1 = at 52-wk high
    rangeLabel = (pos * 100).toFixed(0) + '% of range';
    rangePts = pos < 0.20 ? 15 : pos < 0.35 ? 13 : pos < 0.55 ? 10 : pos < 0.75 ? 6 : 3;
    rangeNote = pos < 0.20 ? 'Trading near 52-week low — contrarian opportunity, but verify no structural reason' : pos < 0.40 ? 'In lower half of range — recent weakness may represent entry point' : pos < 0.65 ? 'Middle of range — neutral positioning' : pos < 0.85 ? 'In upper range — momentum is strong but less margin of safety' : 'Near 52-week high — limited technical margin of safety; requires strong fundamental conviction';
    if (pos > 0.90) flags.push({ text: 'Trading within 10% of 52-week high — momentum is strong but entry risk is elevated', type: 'neutral' });
    if (pos < 0.15) flags.push({ text: 'Near 52-week low — review whether the weakness is an opportunity or warning', type: 'neutral' });
  }
  total += rangePts;
  details.push({ label: 'Price vs 52-Week Range', value: rangeLabel, points: rangePts, maxPoints: 15, note: rangeNote });

  // ── Analyst target upside — 15pts (bonus context) ──
  let targetPts = 7; let targetNote = 'No data'; let targetLabel = '—';
  const target = nn(ov.AnalystTargetPrice);
  if (price != null && target != null && price > 0) {
    const upside = (target - price) / price;
    targetLabel = pctLabel(upside);
    targetPts = upside > 0.25 ? 15 : upside > 0.15 ? 13 : upside > 0.05 ? 10 : upside > -0.05 ? 6 : 2;
    targetNote = upside > 0.25 ? 'Consensus sees 25%+ upside — analyst community is broadly bullish' : upside > 0.10 ? 'Meaningful analyst upside consensus' : upside > 0 ? 'Modest upside to consensus target' : 'Trading above or near analyst consensus target — limited upside priced by the street';
    if (upside > 0.30) flags.push({ text: `Analyst consensus sees ${(upside * 100).toFixed(0)}% upside from current price`, type: 'good' });
    if (upside < -0.05) flags.push({ text: `Stock trading above analyst consensus target — market more bullish than analysts`, type: 'neutral' });
  }
  total += targetPts;
  details.push({ label: 'Analyst Target Upside', value: targetLabel, points: targetPts, maxPoints: 15, note: targetNote });

  // Cap at 100 (max raw = 100)
  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Attractively valued — multiple metrics point to undervaluation relative to fundamentals' :
    score >= 65 ? 'Fairly valued with some upside — not a screaming bargain but priced reasonably' :
    score >= 50 ? 'Neutral valuation — price roughly reflects current fundamentals' :
    score >= 35 ? 'Stretched valuation — significant upside is already priced in' :
    'Expensive — the stock prices in an optimistic scenario; limited margin of safety';

  return {
    phase: 4, title: 'Valuation Assessment', score, grade: gradeFromScore(score), headline,
    summary: `${isPEfwd ? 'Fwd' : 'Trl'} P/E ${activePE != null ? fmt2(activePE) + 'x' : '—'} · PEG ${peg != null ? fmt2(peg) + 'x' : '—'} · EV/EBITDA ${evEbitda != null ? fmt2(evEbitda) + 'x' : '—'} · Analyst upside ${targetLabel}`,
    details, flags,
  };
}

// ── Phase 5 — Intrinsic Value (Auto-DCF) ─────────────────────────────────────

export function scoreDCF(
  cashflow: AVReport[], _income: AVReport[], ov: AVOverview, price: number | null
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const WACC = 0.10;
  const TERMINAL_G = 0.03;

  // Compute FCF for last 3 years
  const fcfs = cashflow.slice(0, 4).map(cf => {
    const ocf = r(cf, 'operatingCashflow');
    const capex = r(cf, 'capitalExpenditures');
    return ocf != null && capex != null ? ocf - Math.abs(capex) : ocf;
  }).filter((v): v is number => v != null);

  const avgFCF = fcfs.length > 0 ? fcfs.reduce((a, b) => a + b, 0) / fcfs.length : null;

  // FCF CAGR (most recent vs 3yr ago)
  let fcfCagr: number | null = null;
  if (fcfs.length >= 3 && fcfs[0] > 0 && fcfs[2] > 0) {
    fcfCagr = Math.pow(fcfs[0] / fcfs[Math.min(2, fcfs.length - 1)], 1 / Math.min(2, fcfs.length - 1)) - 1;
    fcfCagr = clamp(fcfCagr, -0.30, 0.40); // cap to reasonable range
  }

  const mktCap = nn(ov.MarketCapitalization);
  const sharesOut = nn(ov.SharesOutstanding);

  let intrinsicPerShare: number | null = null;
  let marginOfSafety: number | null = null;

  if (avgFCF != null && sharesOut != null && sharesOut > 0 && mktCap != null) {
    // Project 5 years using FCF CAGR (floor at 0%, ceil at 20%)
    const g = fcfCagr != null ? clamp(fcfCagr, 0, 0.20) : 0.05;
    let totalPV = 0;
    let projFCF = fcfs[0] ?? avgFCF;
    for (let yr = 1; yr <= 5; yr++) {
      projFCF *= (1 + g);
      totalPV += projFCF / Math.pow(1 + WACC, yr);
    }
    // Terminal value
    const terminalFCF = projFCF * (1 + TERMINAL_G);
    const terminalValue = terminalFCF / (WACC - TERMINAL_G);
    totalPV += terminalValue / Math.pow(1 + WACC, 5);
    intrinsicPerShare = totalPV / sharesOut;
    if (price != null && price > 0 && intrinsicPerShare > 0) {
      marginOfSafety = (intrinsicPerShare - price) / intrinsicPerShare;
    }
  }

  // Score based on margin of safety
  const mosPts = marginOfSafety == null ? 12 :
    marginOfSafety > 0.40 ? 45 : marginOfSafety > 0.25 ? 38 : marginOfSafety > 0.10 ? 28 :
    marginOfSafety > 0 ? 18 : marginOfSafety > -0.15 ? 12 : marginOfSafety > -0.30 ? 7 : 3;
  total += mosPts;
  details.push({
    label: 'Margin of Safety',
    value: marginOfSafety != null ? pctLabel(marginOfSafety) : '—',
    points: mosPts, maxPoints: 45,
    note: marginOfSafety == null ? 'Could not compute — insufficient FCF data' :
      marginOfSafety > 0.40 ? `Auto-DCF implies ~${(marginOfSafety * 100).toFixed(0)}% discount to intrinsic value — significant margin of safety (base case WACC 10%, terminal 3%)` :
      marginOfSafety > 0.20 ? `~${(marginOfSafety * 100).toFixed(0)}% discount to auto-DCF intrinsic value — solid margin of safety` :
      marginOfSafety > 0 ? `Modest ${(marginOfSafety * 100).toFixed(0)}% discount — limited but positive margin of safety` :
      `Trading at ~${(Math.abs(marginOfSafety) * 100).toFixed(0)}% premium to auto-DCF estimate — intrinsic value may not support current price at base-case assumptions`,
  });

  // FCF CAGR quality
  const cagrPts = fcfCagr == null ? 10 :
    fcfCagr > 0.20 ? 25 : fcfCagr > 0.12 ? 21 : fcfCagr > 0.06 ? 16 : fcfCagr > 0 ? 10 : 4;
  total += cagrPts;
  details.push({ label: 'FCF Growth Rate (3yr)', value: pctLabel(fcfCagr), points: cagrPts, maxPoints: 25,
    note: fcfCagr == null ? 'Insufficient history' : fcfCagr > 0.15 ? 'Strong FCF compounding — high confidence in growth projection' : fcfCagr > 0.05 ? 'Moderate FCF growth — reasonable base for projection' : fcfCagr > 0 ? 'Slow FCF growth — terminal value does most of the work in this DCF' : 'FCF declining — DCF estimate is unreliable; business may be deteriorating' });

  // FCF predictability
  const fcfVariance = fcfs.length >= 3 ?
    Math.sqrt(fcfs.reduce((a, b) => a + Math.pow(b - (fcfs.reduce((x, y) => x + y) / fcfs.length), 2), 0) / fcfs.length) / Math.abs(fcfs.reduce((x, y) => x + y) / fcfs.length)
    : null;
  const predPts = fcfVariance == null ? 10 : fcfVariance < 0.15 ? 20 : fcfVariance < 0.30 ? 16 : fcfVariance < 0.50 ? 10 : 5;
  total += predPts;
  details.push({ label: 'FCF Predictability', value: fcfVariance != null ? (fcfVariance * 100).toFixed(0) + '% CV' : '—', points: predPts, maxPoints: 20,
    note: fcfVariance == null ? 'Insufficient data' : fcfVariance < 0.15 ? 'Very consistent FCF — DCF assumptions are reliable' : fcfVariance < 0.30 ? 'Reasonably stable FCF — projection has manageable uncertainty' : 'High FCF volatility — treat DCF output as wide range rather than precise estimate' });

  if (marginOfSafety != null && marginOfSafety > 0.35) flags.push({ text: `Auto-DCF estimates intrinsic value ~$${intrinsicPerShare?.toFixed(2)} vs current price — significant upside if assumptions hold`, type: 'good' });
  if (marginOfSafety != null && marginOfSafety < -0.25) flags.push({ text: `At current FCF trajectory, auto-DCF suggests the stock is ~${(Math.abs(marginOfSafety) * 100).toFixed(0)}% above intrinsic value at 10% WACC`, type: 'bad' });
  if (fcfCagr != null && fcfCagr < 0) flags.push({ text: 'Declining FCF makes forward projections unreliable — DCF score should be weighted lightly', type: 'neutral' });
  flags.push({ text: 'Auto-DCF uses 5-yr FCF CAGR projected forward, WACC 10%, terminal growth 3%. Use the full DCF Calculator for scenario analysis.', type: 'neutral' });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Strong intrinsic value margin of safety — DCF suggests meaningful undervaluation' :
    score >= 65 ? 'Positive margin of safety — current price offers reasonable discount to estimated intrinsic value' :
    score >= 50 ? 'Near fair value — limited margin of safety in base case assumptions' :
    score >= 35 ? 'Trading above DCF estimate — intrinsic value does not support current price at base-case assumptions' :
    'Significant premium to DCF — requires high FCF growth acceleration to justify current price';

  return {
    phase: 5, title: 'Intrinsic Value (Auto-DCF)', score, grade: gradeFromScore(score), headline,
    summary: `Auto-DCF intrinsic value: ${intrinsicPerShare != null ? '$' + intrinsicPerShare.toFixed(2) : '—'} · Margin of safety: ${marginOfSafety != null ? pctLabel(marginOfSafety) : '—'} · FCF CAGR: ${pctLabel(fcfCagr)}`,
    details, flags,
  };
}

// ── Phase 6 — Dividend Safety ─────────────────────────────────────────────────

export function scoreDividends(
  divEntries: AVDividendEntry[], cashflow: AVReport[], income: AVReport[], ov: AVOverview
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const yield_ = nn(ov.DividendYield);
  const divPerShare = nn(ov.DividendPerShare);
  const hasDividend = yield_ != null && yield_ > 0.001;

  if (!hasDividend) {
    // No dividend — score on FCF reinvestment quality
    const cf0 = cashflow[0];
    const ocf = cf0 ? r(cf0, 'operatingCashflow') : null;
    const capex = cf0 ? r(cf0, 'capitalExpenditures') : null;
    const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : null;
    const mktCap = nn(ov.MarketCapitalization);
    const fcfYield = fcf != null && mktCap != null && mktCap > 0 ? fcf / mktCap : null;

    const buybackPts = fcfYield != null ? (fcfYield > 0.05 ? 60 : fcfYield > 0.03 ? 45 : fcfYield > 0.01 ? 35 : 25) : 40;
    total += buybackPts;
    details.push({ label: 'FCF Yield (No Dividend)', value: fcfYield != null ? (fcfYield * 100).toFixed(1) + '%' : '—', points: buybackPts, maxPoints: 60,
      note: 'No dividend paid. Scored on FCF yield — company reinvests or returns capital via buybacks. ' + (fcfYield != null && fcfYield > 0.04 ? 'FCF yield is strong; capital allocation is shareholder-friendly.' : fcfYield != null && fcfYield > 0.02 ? 'Moderate FCF yield.' : 'Low FCF yield — either growth-investing or marginal business.') });
    total += 40; // Full credit for structure points (no div risk)
    details.push({ label: 'Capital Return Structure', value: 'No dividend', points: 40, maxPoints: 40,
      note: 'Non-dividend payers avoid payout ratio risk. Growth-stage and asset-light businesses often create more value by reinvesting FCF than paying dividends.' });
    flags.push({ text: 'No dividend paid — capital returned via reinvestment or buybacks. Dividend safety is not a relevant risk factor.', type: 'neutral' });
  } else {
    // Has dividend
    // ── Yield quality — 15pts ──
    const yieldPts = yield_ == null ? 7 :
      yield_ > 0.06 ? 5 : yield_ > 0.04 ? 11 : yield_ > 0.02 ? 15 : yield_ > 0.01 ? 12 : 8;
    total += yieldPts;
    details.push({ label: 'Dividend Yield', value: yield_ != null ? (yield_ * 100).toFixed(1) + '%' : '—', points: yieldPts, maxPoints: 15,
      note: yield_ == null ? 'No data' : yield_ > 0.06 ? 'Yield above 6% — elevated yield often signals the market is pricing in a cut risk' : yield_ > 0.04 ? 'High yield — typically sustainable for utilities, REITs, and strong large-caps' : yield_ > 0.02 ? 'Healthy yield — not too high to signal distress, not too low to be meaningless' : 'Low but growing yield — reinvestment-phase company; focus on growth, not income' });
    if (yield_ != null && yield_ > 0.065) flags.push({ text: `High yield of ${(yield_ * 100).toFixed(1)}% — verify FCF payout ratio; market may be pricing in a cut`, type: 'bad' });

    // ── FCF Payout Ratio — 35pts ──
    const cf0 = cashflow[0];
    let fcfPayPts = 15; let fcfPayNote = 'Data unavailable'; let fcfPayLabel = '—';
    if (cf0 && income[0]) {
      const ocf = r(cf0, 'operatingCashflow');
      const capex = r(cf0, 'capitalExpenditures');
      const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : null;
      const divPaid = Math.abs(r(cf0, 'dividendPayout') ?? r(cf0, 'dividendPayoutCommonStock') ?? 0);
      if (fcf != null && fcf > 0 && divPaid > 0) {
        const ratio = divPaid / fcf;
        fcfPayLabel = (ratio * 100).toFixed(0) + '%';
        fcfPayPts = ratio < 0.35 ? 35 : ratio < 0.50 ? 30 : ratio < 0.65 ? 22 : ratio < 0.80 ? 12 : ratio <= 1.0 ? 5 : 0;
        fcfPayNote = ratio < 0.40 ? 'Excellent — dividend consumes less than 40% of FCF; plenty of cushion' :
          ratio < 0.60 ? 'Safe — dividend is comfortably covered by free cash flow' :
          ratio < 0.80 ? 'Moderate — dividend is covered but leaves limited buffer for debt reduction or investment' :
          ratio <= 1.0 ? 'Stretched — dividend nearly consumes all FCF; any dip risks a cut' :
          'Unsustainable — paying more in dividends than free cash flow generated; likely funded by debt';
        if (ratio > 0.90) flags.push({ text: `FCF payout ratio of ${(ratio * 100).toFixed(0)}% — dividend is at risk if FCF declines`, type: 'bad' });
        if (ratio < 0.45) flags.push({ text: `FCF payout ratio of ${(ratio * 100).toFixed(0)}% is very safe — dividend has strong FCF backing`, type: 'good' });
      }
    }
    total += fcfPayPts;
    details.push({ label: 'FCF Payout Ratio', value: fcfPayLabel, points: fcfPayPts, maxPoints: 35, note: fcfPayNote });

    // ── Dividend growth — 25pts ──
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
        divGrowthNote = g > 0.10 ? 'Dividend growing at >10%/yr — yield-on-cost doubles in under 7 years' :
          g > 0.05 ? 'Solid dividend growth — income stream compounding above inflation' :
          g > 0 ? 'Modest growth — dividend is growing but not keeping pace with strong earnings growth' :
          g === 0 ? 'Dividend frozen — management not growing the payout' :
          'Dividend cut — a serious red flag for income investors';
        if (g < 0) flags.push({ text: 'Dividend was cut — history shows dividend cuts often precede further cuts', type: 'bad' });
        if (g > 0.08) flags.push({ text: `Dividend growing at ~${(g * 100).toFixed(0)}%/yr — compounding income stream`, type: 'good' });
      }
    }
    total += divGrowthPts;
    details.push({ label: 'Dividend Growth', value: divGrowthLabel, points: divGrowthPts, maxPoints: 25, note: divGrowthNote });

    // ── Earnings payout ratio — 25pts ──
    const eps = nn(ov.EPS);
    let earnPayPts = 12; let earnPayNote = 'Data unavailable'; let earnPayLabel = '—';
    if (eps != null && eps > 0 && divPerShare != null) {
      const earnPay = divPerShare / eps;
      earnPayLabel = (earnPay * 100).toFixed(0) + '%';
      earnPayPts = earnPay < 0.30 ? 25 : earnPay < 0.50 ? 22 : earnPay < 0.65 ? 16 : earnPay < 0.80 ? 9 : 3;
      earnPayNote = earnPay < 0.40 ? 'Low payout ratio — large buffer and room to grow dividend significantly' :
        earnPay < 0.60 ? 'Moderate payout — balanced between income and reinvestment' :
        earnPay < 0.80 ? 'High payout — less room to grow; more sensitive to earnings dips' :
        'Very high payout — one bad year could force a cut';
    }
    total += earnPayPts;
    details.push({ label: 'Earnings Payout Ratio', value: earnPayLabel, points: earnPayPts, maxPoints: 25, note: earnPayNote });
  }

  const score = clamp(Math.round(total), 0, 100);
  const isNoDivScore = !hasDividend;
  const headline = isNoDivScore
    ? 'No dividend — scored on capital allocation quality. FCF reinvestment or buybacks replace dividend return.'
    : score >= 80 ? 'Dividend is safe and growing — well-covered by FCF with strong payout growth history'
    : score >= 65 ? 'Dividend appears safe — covered by FCF with reasonable growth'
    : score >= 50 ? 'Dividend is covered but with limited cushion — monitor payout ratio trajectory'
    : score >= 35 ? 'Dividend under pressure — high payout ratio or stagnant growth is a warning sign'
    : 'Dividend at risk — payout is unsustainable at current FCF levels or has already been cut';

  return {
    phase: 6, title: 'Dividend & Capital Return', score, grade: gradeFromScore(score), headline,
    summary: hasDividend ? `Yield ${yield_ != null ? (yield_ * 100).toFixed(1) + '%' : '—'} · Growth ${details.find(d => d.label === 'Dividend Growth')?.value ?? '—'} · FCF payout ${details.find(d => d.label === 'FCF Payout Ratio')?.value ?? '—'}` : 'Non-dividend payer — capital returned via reinvestment / buybacks',
    details, flags,
  };
}

// ── Phase 7 — News Sentiment ──────────────────────────────────────────────────

export function scoreSentiment(
  newsItems: AVNewsItem[], ticker: string, ov: AVOverview
): PhaseScore {
  const details: ScoreDetail[] = [];
  const flags: { text: string; type: FlagType }[] = [];
  let total = 0;

  const sym = ticker.toUpperCase();

  // Filter items that mention this ticker (or use all if none specifically tagged)
  const relevant = newsItems.filter(n =>
    n.ticker_sentiment?.some(t => t.ticker === sym)
  );
  const items = relevant.length >= 5 ? relevant : newsItems.slice(0, 20);

  // ── Overall sentiment score — 50pts ──
  const sentScores = items.map(n => {
    const ts = n.ticker_sentiment?.find(t => t.ticker === sym);
    return ts ? parseFloat(ts.ticker_sentiment_score) : n.overall_sentiment_score;
  }).filter(v => !isNaN(v));

  const avgSent = sentScores.length > 0 ? sentScores.reduce((a, b) => a + b) / sentScores.length : null;
  // AV sentiment: -1 to +1, typically -0.35 to +0.35 for most stocks
  const sentPts = avgSent == null ? 20 :
    avgSent > 0.25 ? 50 : avgSent > 0.15 ? 43 : avgSent > 0.05 ? 35 :
    avgSent > -0.05 ? 25 : avgSent > -0.15 ? 15 : 7;
  total += sentPts;
  details.push({ label: 'News Sentiment Score', value: avgSent != null ? avgSent.toFixed(3) + ' / 1.0' : '—', points: sentPts, maxPoints: 50,
    note: avgSent == null ? 'No news data available' :
      avgSent > 0.20 ? 'Strongly positive news flow — recent coverage is broadly constructive' :
      avgSent > 0.05 ? 'Mildly positive sentiment — news leans favourable' :
      avgSent > -0.05 ? 'Neutral sentiment — no strong narrative either direction' :
      avgSent > -0.15 ? 'Mildly negative — recent news is more cautious or critical' :
      'Negative news flow — significant bearish narrative in recent coverage' });
  if (avgSent != null && avgSent > 0.20) flags.push({ text: 'Recent news sentiment is strongly positive — analyst and media tone is constructive', type: 'good' });
  if (avgSent != null && avgSent < -0.10) flags.push({ text: 'Negative news sentiment — recent media coverage is cautious or bearish', type: 'bad' });

  // ── Sentiment distribution — 25pts ──
  const labels = items.map(n => {
    const ts = n.ticker_sentiment?.find(t => t.ticker === sym);
    return ts ? ts.ticker_sentiment_label : n.overall_sentiment_label;
  });
  const bullish = labels.filter(l => l?.toLowerCase().includes('bullish')).length;
  const bearish = labels.filter(l => l?.toLowerCase().includes('bearish')).length;
  const neutral = labels.length - bullish - bearish;
  const bullRate = labels.length > 0 ? bullish / labels.length : null;

  const distPts = bullRate == null ? 10 :
    bullRate > 0.6 ? 25 : bullRate > 0.45 ? 21 : bullRate > 0.3 ? 16 : bullRate > 0.15 ? 9 : 4;
  total += distPts;
  details.push({ label: 'Bullish Article Rate', value: labels.length > 0 ? `${bullish}B / ${neutral}N / ${bearish}Br of ${labels.length}` : '—', points: distPts, maxPoints: 25,
    note: bullRate == null ? 'No labelled data' : `${(bullRate * 100).toFixed(0)}% of recent articles tagged bullish. ${bullRate > 0.5 ? 'Majority positive — sentiment tailwind.' : bullRate > 0.3 ? 'Mixed but tilting positive.' : 'Bearish or neutral tone dominates recent coverage.'}` });

  // ── Analyst target vs price context — 25pts ──
  const target = nn(ov.AnalystTargetPrice);
  const hi = nn(ov['52WeekHigh']); const lo = nn(ov['52WeekLow']);
  let contextPts = 12; let contextNote = 'Context data unavailable'; let contextLabel = '—';
  if (target != null && hi != null && lo != null) {
    // Target vs 52-week range
    const targetInRange = target >= lo && target <= hi * 1.3;
    contextLabel = targetInRange ? 'Analyst target in normal range' : 'Analyst target is outlier';
    contextPts = targetInRange ? 20 : 10;
    contextNote = `Analyst consensus target of $${target.toFixed(2)} vs 52-week range $${lo.toFixed(0)}–$${hi.toFixed(0)}. ${targetInRange ? 'Target aligns with reasonable price action.' : 'Target appears aggressive relative to recent trading range.'}`;
  }
  total += contextPts;
  details.push({ label: 'Analyst Target Context', value: contextLabel, points: contextPts, maxPoints: 25, note: contextNote });

  const score = clamp(Math.round(total), 0, 100);
  const headline =
    score >= 80 ? 'Strong positive sentiment — news flow, analyst tone, and coverage are broadly constructive' :
    score >= 65 ? 'Favourable sentiment — tilting positive with no major narrative headwinds' :
    score >= 50 ? 'Mixed sentiment — no strong directional narrative; market is in a wait-and-see mode' :
    score >= 35 ? 'Cautious sentiment — news flow is negative or bearish tone is dominant' :
    'Negative sentiment — significant bearish narrative could create a headwind for the stock';

  return {
    phase: 7, title: 'Sentiment & News', score, grade: gradeFromScore(score), headline,
    summary: `Avg sentiment: ${avgSent != null ? avgSent.toFixed(3) : '—'} · ${bullish}B/${neutral}N/${bearish}Br of ${items.length} articles`,
    details, flags,
  };
}

// ── Composite score ───────────────────────────────────────────────────────────

export function computeComposite(phases: PhaseScore[]): { score: number; grade: Grade; headline: string } {
  // Weights: Financial Health 25%, Earnings 20%, Valuation 20%, DCF 15%, Dividends 10%, Sentiment 10%
  const weights: Record<number, number> = { 2: 0.25, 3: 0.20, 4: 0.20, 5: 0.15, 6: 0.10, 7: 0.10 };
  let weighted = 0, totalW = 0;
  for (const p of phases) {
    const w = weights[p.phase] ?? 0;
    weighted += p.score * w;
    totalW += w;
  }
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
