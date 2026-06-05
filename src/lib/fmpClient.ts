// ── FMP (Financial Modeling Prep) Client + AV-compatible Adapters ─────────────
// Converts FMP free-tier JSON into the same AVReport, AVOverview, etc. types
// used by autoAnalysis.ts so the scoring engine never needs to know which
// provider supplied the data.
//
// FMP free tier: 250 calls/day, no per-minute throttle.
// Gaps vs AV: no NLP sentiment scores, no analyst target, no forward P/E.
// Gains vs AV: 10× daily quota, pre-computed FCF, ROIC in key-metrics.

import type {
  AVOverview, AVReport, AVEarningsQuarter, AVEarningsAnnual,
  AVDividendEntry, AVNewsItem,
} from './autoAnalysis';

export const FMP_BASE = 'https://financialmodelingprep.com/api/v3';
export const LS_FMP_KEY = 'fmp_api_key';

// ── Rate-limit detection ──────────────────────────────────────────────────────

export function isFMPRateLimit(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  const msg = (d['Error Message'] ?? d['message'] ?? '').toString().toLowerCase();
  return msg.includes('limit') || msg.includes('exceeded') || msg.includes('apikey');
}

export class FMPRateLimitError extends Error {
  constructor() { super('FMP rate limit reached — free tier allows 250 calls/day'); }
}

export async function fmpFetch(endpoint: string, params: Record<string, string>, apiKey: string): Promise<unknown> {
  const url = new URL(`${FMP_BASE}/${endpoint}`);
  url.searchParams.set('apikey', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (res.status === 429) throw new FMPRateLimitError();
  if (!res.ok) throw new Error(`FMP HTTP ${res.status} for ${endpoint}`);
  const data = await res.json();
  if (isFMPRateLimit(data)) throw new FMPRateLimitError();
  if (data?.['Error Message']) throw new Error('FMP: ' + data['Error Message']);
  return data;
}

// ── Raw FMP shapes (minimal — only fields we use) ─────────────────────────────

interface FMPProfile {
  symbol: string; companyName: string; currency: string;
  exchangeShortName: string; sector: string; industry: string;
  mktCap: number; beta: number; lastDiv: number;
  volAvg: number; changes: number; price: number;
  // eps, pe are in profile on free tier
  eps: number; pe: number;
}

interface FMPQuote {
  symbol: string; price: number;
  yearHigh: number; yearLow: number;
  marketCap: number; sharesOutstanding: number;
  pe: number; eps: number;
}

interface FMPKeyMetrics {
  date: string; symbol: string; period: string;
  revenuePerShare: number; netIncomePerShare: number;
  peRatio: number; pbRatio: number; priceToSalesRatio: number;
  pegRatio: number; evToSales: number; enterpriseValueOverEBITDA: number;
  returnOnEquity: number; returnOnAssets: number; roic: number;
  freeCashFlowYield: number; debtToEquity: number;
  dividendYield: number; earningsYield: number;
  netDebtToEBITDA: number;
}

interface FMPRatios {
  date: string; symbol: string;
  priceEarningsRatio: number; priceEarningsToGrowthRatio: number;
  priceToBookRatio: number; priceToSalesRatio: number;
  dividendYield: number; payoutRatio: number;
  netProfitMargin: number; operatingProfitMargin: number; grossProfitMargin: number;
  returnOnEquity: number; returnOnAssets: number;
  interestCoverage: number; debtRatio: number;
  operatingCashFlowPerShare: number;
}

interface FMPIncomeItem {
  date: string; symbol: string; period: string;
  revenue: number; grossProfit: number;
  operatingIncome: number; netIncome: number;
  ebitda: number; eps: number; epsdiluted: number;
  interestExpense: number;
  researchAndDevelopmentExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  depreciationAndAmortization: number;
}

interface FMPBalanceItem {
  date: string; symbol: string; period: string;
  cashAndCashEquivalents: number; shortTermInvestments: number;
  totalCurrentAssets: number; totalNonCurrentAssets: number;
  totalAssets: number; totalCurrentLiabilities: number;
  totalDebt: number; longTermDebt: number; shortTermDebt: number;
  totalLiabilities: number; totalStockholdersEquity: number;
  netReceivables: number; inventory: number;
}

interface FMPCashFlowItem {
  date: string; symbol: string; period: string;
  operatingCashFlow: number; capitalExpenditure: number;
  freeCashFlow: number; stockBasedCompensation: number;
  depreciationAndAmortization: number;
  commonStockRepurchased: number; dividendsPaid: number;
  purchasesOfInvestments: number;
}

interface FMPEarningsSurprise {
  date: string; symbol: string;
  actualEarningResult: number; estimatedEarning: number;
}

interface FMPDividendHistory {
  historical: { date: string; dividend: number; adjDividend: number }[];
}

interface FMPNewsItem {
  title: string; text: string; site: string;
  publishedDate: string; url: string; symbol: string;
}

// ── str() helper — converts number|undefined to string for AVReport ──────────

function str(v: number | null | undefined): string {
  if (v == null || isNaN(v as number)) return '';
  return String(v);
}

// ── Adapters ──────────────────────────────────────────────────────────────────

/** Convert FMP profile + quote + keyMetrics + ratios → AVOverview */
export function adaptFMPOverview(
  profile: FMPProfile,
  quote: FMPQuote | null,
  keyMetrics: FMPKeyMetrics | null,
  ratios: FMPRatios | null,
): AVOverview {
  const q = quote;
  const km = keyMetrics;
  const ra = ratios;

  // Prefer quote for market data (more real-time), fall back to profile
  const mktCap  = q?.marketCap ?? profile.mktCap;
  const sharesOut = q?.sharesOutstanding;
  const yearHigh  = q?.yearHigh;
  const yearLow   = q?.yearLow;

  // P/E: keyMetrics TTM > ratios TTM > profile pe > quote pe
  const pe = km?.peRatio ?? ra?.priceEarningsRatio ?? profile.pe ?? q?.pe;
  // PEG: ratios then keyMetrics
  const peg = ra?.priceEarningsToGrowthRatio ?? km?.pegRatio;
  // EV/EBITDA: keyMetrics field name is enterpriseValueOverEBITDA
  const evEbitda = km?.enterpriseValueOverEBITDA;
  const evRev    = km?.evToSales;
  const ptb      = ra?.priceToBookRatio ?? km?.pbRatio;
  const pts      = ra?.priceToSalesRatio ?? km?.priceToSalesRatio;
  const divYield = ra?.dividendYield ?? km?.dividendYield;
  const roe      = ra?.returnOnEquity ?? km?.returnOnEquity;
  const roa      = ra?.returnOnAssets ?? km?.returnOnAssets;
  const opMargin = ra?.operatingProfitMargin;
  const netMargin = ra?.netProfitMargin;

  return {
    Name:                        profile.companyName ?? '',
    Symbol:                      profile.symbol ?? '',
    Exchange:                    profile.exchangeShortName ?? '',
    Sector:                      profile.sector ?? '',
    Industry:                    profile.industry ?? '',
    MarketCapitalization:        str(mktCap),
    SharesOutstanding:           str(sharesOut),
    TrailingPE:                  str(pe),
    ForwardPE:                   '',          // not available on FMP free tier
    PEGRatio:                    str(peg),
    PriceToBookRatio:            str(ptb),
    PriceToSalesRatioTTM:        str(pts),
    EVToRevenue:                 str(evRev),
    EVToEBITDA:                  str(evEbitda),
    EPS:                         str(q?.eps ?? profile.eps),
    DividendYield:               str(divYield),
    DividendPerShare:            str(profile.lastDiv),
    ProfitMargin:                str(netMargin),
    OperatingMarginTTM:          str(opMargin),
    ReturnOnAssetsTTM:           str(roa),
    ReturnOnEquityTTM:           str(roe),
    RevenueTTM:                  '',          // not in profile; scoring engine uses income statements directly
    QuarterlyEarningsGrowthYOY:  '',
    QuarterlyRevenueGrowthYOY:   '',
    AnalystTargetPrice:          '',          // not on FMP free tier
    Beta:                        str(profile.beta),
    '52WeekHigh':                str(yearHigh),
    '52WeekLow':                 str(yearLow),
    EBITDA:                      '',
    Currency:                    profile.currency ?? 'USD',
  };
}

/** Convert FMP income-statement array → AVReport[] (using AV field name keys) */
export function adaptFMPIncome(items: FMPIncomeItem[]): AVReport[] {
  return items.filter(i => i.period === 'FY' || !i.period).map(item => ({
    fiscalDateEnding:                          item.date,
    totalRevenue:                              str(item.revenue),
    grossProfit:                               str(item.grossProfit),
    operatingIncome:                           str(item.operatingIncome),
    netIncome:                                 str(item.netIncome),
    ebitda:                                    str(item.ebitda),
    interestExpense:                           str(item.interestExpense),
    researchAndDevelopment:                    str(item.researchAndDevelopmentExpenses),
    sellingGeneralAndAdministrative:           str(item.sellingGeneralAndAdministrativeExpenses),
    depreciationDepletionAndAmortization:      str(item.depreciationAndAmortization),
    // FMP doesn't surface SBC on income statement — it appears in CF
    stockBasedCompensation:                    '',
  }));
}

/** Convert FMP balance-sheet-statement array → AVReport[] */
export function adaptFMPBalance(items: FMPBalanceItem[]): AVReport[] {
  return items.filter(i => i.period === 'FY' || !i.period).map(item => ({
    fiscalDateEnding:              item.date,
    totalAssets:                   str(item.totalAssets),
    totalLiabilities:              str(item.totalLiabilities),
    totalShareholderEquity:        str(item.totalStockholdersEquity),
    cashAndShortTermInvestments:   str((item.cashAndCashEquivalents ?? 0) + (item.shortTermInvestments ?? 0)),
    shortLongTermDebtTotal:        str(item.totalDebt),
    longTermDebt:                  str(item.longTermDebt),
    shortTermDebt:                 str(item.shortTermDebt),
    netReceivables:                str(item.netReceivables),
    inventory:                     str(item.inventory),
  }));
}

/** Convert FMP cash-flow-statement array → AVReport[] */
export function adaptFMPCashFlow(items: FMPCashFlowItem[]): AVReport[] {
  return items.filter(i => i.period === 'FY' || !i.period).map(item => ({
    fiscalDateEnding:                         item.date,
    operatingCashflow:                        str(item.operatingCashFlow),
    // FMP uses negative for capex (outflow) — AV too; take abs for safety
    capitalExpenditures:                      str(item.capitalExpenditure != null ? -Math.abs(item.capitalExpenditure) : undefined),
    freeCashFlow:                             str(item.freeCashFlow),
    stockBasedCompensation:                   str(item.stockBasedCompensation),
    depreciationDepletionAndAmortization:     str(item.depreciationAndAmortization),
    commonStockRepurchased:                   str(item.commonStockRepurchased),
    dividendPayout:                           str(item.dividendsPaid != null ? -Math.abs(item.dividendsPaid) : undefined),
    dividendPayoutCommonStock:                str(item.dividendsPaid != null ? -Math.abs(item.dividendsPaid) : undefined),
    cashAndCashEquivalentsAtCarryingValue:    '',
  }));
}

/** Convert FMP earnings-surprises → AVEarningsQuarter[] */
export function adaptFMPEarnings(items: FMPEarningsSurprise[]): AVEarningsQuarter[] {
  return items.map(item => {
    const actual = item.actualEarningResult ?? 0;
    const est    = item.estimatedEarning    ?? 0;
    const surp   = actual - est;
    const surpPct = est !== 0 ? (surp / Math.abs(est)) * 100 : 0;
    return {
      fiscalDateEnding:    item.date,
      reportedDate:        item.date,
      reportedEPS:         str(actual),
      estimatedEPS:        str(est),
      surprise:            str(surp),
      surprisePercentage:  str(surpPct),
    };
  });
}

/** Extract annual EPS from FMP income statement for trough detection */
export function adaptFMPAnnualEPS(incomeItems: FMPIncomeItem[]): AVEarningsAnnual[] {
  return incomeItems
    .filter(i => i.period === 'FY' || !i.period)
    .map(item => ({
      fiscalDateEnding: item.date,
      reportedEPS:      str(item.epsdiluted ?? item.eps),
    }));
}

/** Convert FMP dividend history → AVDividendEntry[] */
export function adaptFMPDividends(history: FMPDividendHistory): AVDividendEntry[] {
  return (history.historical ?? []).map(d => ({
    ex_dividend_date: d.date,
    amount:           str(d.dividend),
  }));
}

/**
 * Convert FMP news → AVNewsItem[]
 * FMP news has no NLP sentiment scores — all scores are NaN so the scoring
 * engine's !isNaN() filter excludes them, resulting in neutral sentiment scoring.
 * This is intentional and transparent: Phase 7 degrades gracefully.
 */
export function adaptFMPNews(items: FMPNewsItem[], symbol: string): AVNewsItem[] {
  return items.map(item => ({
    title:                   item.title,
    summary:                 item.text?.slice(0, 300) ?? '',
    source:                  item.site,
    time_published:          fmpDateToAV(item.publishedDate),
    overall_sentiment_score: NaN,      // no NLP on FMP free tier
    overall_sentiment_label: 'Neutral',
    ticker_sentiment: [{
      ticker:                      symbol.toUpperCase(),
      ticker_sentiment_score:      'NaN',
      ticker_sentiment_label:      'Neutral',
    }],
  }));
}

/** Convert FMP publishedDate "2024-01-15 08:30:00" → AV format "20240115T083000" */
function fmpDateToAV(d: string): string {
  if (!d) return '';
  // "2024-01-15 08:30:00" → "20240115T083000"
  const clean = d.replace(/[-:]/g, '').replace(' ', 'T');
  return clean.slice(0, 15);
}

// ── High-level fetch helper ───────────────────────────────────────────────────
// Returns all data in AV-compatible format. Callers don't need to know FMP shapes.

export interface FMPFetchedData {
  overview:   AVOverview;
  price:      number | null;
  income:     AVReport[];
  balance:    AVReport[];
  cashflow:   AVReport[];
  quarterly:  AVEarningsQuarter[];
  annual:     AVEarningsAnnual[];
  dividends:  AVDividendEntry[];
  news:       AVNewsItem[];
}

export async function fetchAllFMP(symbol: string, apiKey: string): Promise<FMPFetchedData> {
  const sym = symbol.toUpperCase();

  // Fetch all in parallel where safe (FMP has no strict call-rate limit on free tier)
  const [
    profileRaw,
    quoteRaw,
    incomeRaw,
    balanceRaw,
    cashflowRaw,
    earningsRaw,
    keyMetricsRaw,
    ratiosRaw,
    dividendsRaw,
    newsRaw,
  ] = await Promise.all([
    fmpFetch(`profile/${sym}`,                          {},                    apiKey),
    fmpFetch(`quote/${sym}`,                            {},                    apiKey),
    fmpFetch(`income-statement/${sym}`,                 { limit: '5' },        apiKey),
    fmpFetch(`balance-sheet-statement/${sym}`,          { limit: '5' },        apiKey),
    fmpFetch(`cash-flow-statement/${sym}`,              { limit: '5' },        apiKey),
    fmpFetch(`earnings-surprises/${sym}`,               {},                    apiKey),
    fmpFetch(`key-metrics/${sym}`,                      { limit: '2' },        apiKey),
    fmpFetch(`ratios/${sym}`,                           { limit: '2' },        apiKey),
    fmpFetch(`historical-price-full/stock_dividend/${sym}`, {},                apiKey).catch(() => ({ historical: [] })),
    fmpFetch(`stock_news`,                              { tickers: sym, limit: '50' }, apiKey).catch(() => []),
  ]);

  const profile  = (profileRaw  as FMPProfile[])?.[0];
  const quote    = (quoteRaw    as FMPQuote[])?.[0]    ?? null;
  const income   = (incomeRaw   as FMPIncomeItem[])    ?? [];
  const balance  = (balanceRaw  as FMPBalanceItem[])   ?? [];
  const cashflow = (cashflowRaw as FMPCashFlowItem[])  ?? [];
  const earnings = (earningsRaw as FMPEarningsSurprise[]) ?? [];
  const keyMetrics = ((keyMetricsRaw as FMPKeyMetrics[]) ?? [])[0] ?? null;
  const ratios     = ((ratiosRaw     as FMPRatios[])     ?? [])[0] ?? null;
  const dividends  = dividendsRaw as FMPDividendHistory;
  const news       = (newsRaw        as FMPNewsItem[])   ?? [];

  if (!profile) throw new Error('FMP: ticker not found or API key invalid');

  return {
    overview:  adaptFMPOverview(profile, quote, keyMetrics, ratios),
    price:     quote?.price ?? profile.price ?? null,
    income:    adaptFMPIncome(income),
    balance:   adaptFMPBalance(balance),
    cashflow:  adaptFMPCashFlow(cashflow),
    quarterly: adaptFMPEarnings(earnings),
    annual:    adaptFMPAnnualEPS(income),
    dividends: adaptFMPDividends(dividends),
    news:      adaptFMPNews(news, sym),
  };
}
