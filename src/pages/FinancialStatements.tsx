import { useState, useCallback } from 'react';
import { getCached, saveCache, clearCache } from '../lib/jsonbinCache';

const PAGE = 'financial-statements';

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'annual' | 'quarterly';
type Tab = 'income' | 'balance' | 'cashflow' | 'ratios' | 'quality';

interface AVReport {
  fiscalDateEnding: string;
  reportedCurrency: string;
  [key: string]: string;
}

interface FinData {
  incomeAnnual: AVReport[];
  incomeQuarterly: AVReport[];
  balanceAnnual: AVReport[];
  balanceQuarterly: AVReport[];
  cashflowAnnual: AVReport[];
  cashflowQuarterly: AVReport[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(r: AVReport, key: string): number | undefined {
  const v = r[key];
  if (!v || v === 'None') return undefined;
  const parsed = parseFloat(v);
  return isNaN(parsed) ? undefined : parsed;
}

function fmt(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return '—';
  const abs = Math.abs(val);
  if (abs >= 1e12) return (val < 0 ? '-' : '') + '$' + (abs / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9)  return (val < 0 ? '-' : '') + '$' + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6)  return (val < 0 ? '-' : '') + '$' + (abs / 1e6).toFixed(0) + 'M';
  if (abs >= 1e3)  return (val < 0 ? '-' : '') + '$' + (abs / 1e3).toFixed(0) + 'K';
  return (val < 0 ? '-' : '') + '$' + Math.abs(val).toFixed(2);
}

function pctChange(curr: number | undefined, prev: number | undefined): number | undefined {
  if (curr == null || prev == null || prev === 0) return undefined;
  return (curr - prev) / Math.abs(prev);
}

// ── Flag detection ────────────────────────────────────────────────────────────

type Severity = 'warn' | 'good' | 'info';
interface Flag { label: string; detail: string; severity: Severity }

// prevIdx: 1 for annual (prior year), 4 for quarterly (same quarter prior year)
function incomeFlags(stmts: AVReport[], prevIdx = 1): Flag[] {
  if (stmts.length <= prevIdx) return [];
  const curr = stmts[0], prev = stmts[prevIdx];
  const flags: Flag[] = [];

  const revChg = pctChange(n(curr, 'totalRevenue'), n(prev, 'totalRevenue'));
  if (revChg != null) {
    if (revChg < -0.05) flags.push({ label: 'Revenue declining', detail: `${(revChg * 100).toFixed(1)}% YoY`, severity: 'warn' });
    else if (revChg > 0.20) flags.push({ label: 'Strong revenue growth', detail: `+${(revChg * 100).toFixed(1)}% YoY`, severity: 'good' });
  }

  const gmCurr = n(curr, 'grossProfit') != null && n(curr, 'totalRevenue') != null
    ? n(curr, 'grossProfit')! / n(curr, 'totalRevenue')! : undefined;
  const gmPrev = n(prev, 'grossProfit') != null && n(prev, 'totalRevenue') != null
    ? n(prev, 'grossProfit')! / n(prev, 'totalRevenue')! : undefined;
  if (gmCurr != null && gmPrev != null) {
    const delta = gmCurr - gmPrev;
    if (delta < -0.02) flags.push({ label: 'Gross margin compression', detail: `${(delta * 100).toFixed(1)}pp — product is getting more expensive to make`, severity: 'warn' });
    else if (delta > 0.02) flags.push({ label: 'Gross margin expansion', detail: `+${(delta * 100).toFixed(1)}pp — pricing power or cost efficiency improving`, severity: 'good' });
  }

  const rdChg = pctChange(n(curr, 'researchAndDevelopment'), n(prev, 'researchAndDevelopment'));
  if (rdChg != null && revChg != null && rdChg > revChg + 0.10)
    flags.push({ label: 'R&D growing faster than revenue', detail: `R&D +${(rdChg * 100).toFixed(0)}% vs revenue +${(revChg * 100).toFixed(0)}%`, severity: 'info' });

  const sgaChg = pctChange(n(curr, 'sellingGeneralAndAdministrative'), n(prev, 'sellingGeneralAndAdministrative'));
  if (sgaChg != null && revChg != null && sgaChg > revChg + 0.10)
    flags.push({ label: 'SG&A growing faster than revenue', detail: 'Operating leverage deteriorating — costs scaling faster than sales', severity: 'warn' });

  const niChg = pctChange(n(curr, 'netIncome'), n(prev, 'netIncome'));
  if (niChg != null && niChg < -0.15)
    flags.push({ label: 'Net income declining sharply', detail: `${(niChg * 100).toFixed(1)}% YoY`, severity: 'warn' });

  const taxCurr = n(curr, 'incomeTaxExpense');
  const ebtCurr = n(curr, 'incomeBeforeTax');
  if (taxCurr != null && ebtCurr != null && ebtCurr > 0) {
    const rate = taxCurr / ebtCurr;
    if (rate < 0.05) flags.push({ label: 'Very low effective tax rate', detail: `${(rate * 100).toFixed(1)}% — may not be sustainable`, severity: 'info' });
    if (rate > 0.40) flags.push({ label: 'High effective tax rate', detail: `${(rate * 100).toFixed(1)}% — watch for one-time items`, severity: 'info' });
  }

  return flags;
}

function balanceFlags(stmts: AVReport[], prevIdx = 1): Flag[] {
  if (stmts.length <= prevIdx) return [];
  const curr = stmts[0], prev = stmts[prevIdx];
  const flags: Flag[] = [];

  const cashChg = pctChange(n(curr, 'cashAndCashEquivalentsAtCarryingValue'), n(prev, 'cashAndCashEquivalentsAtCarryingValue'));
  if (cashChg != null && cashChg < -0.25)
    flags.push({ label: 'Cash declining significantly', detail: `${(cashChg * 100).toFixed(1)}% YoY — check cash flow statement`, severity: 'warn' });

  const ltdChg = pctChange(n(curr, 'longTermDebt'), n(prev, 'longTermDebt'));
  if (ltdChg != null && ltdChg > 0.20)
    flags.push({ label: 'Long-term debt growing', detail: `+${(ltdChg * 100).toFixed(1)}% YoY — may increase interest burden`, severity: 'warn' });

  const equity = n(curr, 'totalShareholderEquity');
  if (equity != null && equity < 0)
    flags.push({ label: 'Negative stockholders equity', detail: 'More liabilities than assets — typical for buyback-heavy companies (SBUX, MCD) but can signal distress', severity: 'warn' });

  const sharesCurr = n(curr, 'commonStockSharesOutstanding');
  const sharesPrev = n(prev, 'commonStockSharesOutstanding');
  const dilution = pctChange(sharesCurr, sharesPrev);
  if (dilution != null && dilution > 0.03)
    flags.push({ label: 'Share dilution', detail: `+${(dilution * 100).toFixed(1)}% shares outstanding`, severity: 'warn' });
  if (dilution != null && dilution < -0.03)
    flags.push({ label: 'Share buybacks active', detail: `${(dilution * 100).toFixed(1)}% shares reduced — returning capital`, severity: 'good' });

  const ta = n(curr, 'totalAssets');
  const tl = n(curr, 'totalLiabilities');
  if (ta != null && tl != null && ta > 0 && tl / ta > 0.85)
    flags.push({ label: 'High leverage ratio', detail: `${((tl / ta) * 100).toFixed(0)}% of assets funded by liabilities`, severity: 'warn' });

  const ca = n(curr, 'totalCurrentAssets');
  const cl = n(curr, 'totalCurrentLiabilities');
  if (ca != null && cl != null && cl > 0 && ca / cl < 1.0)
    flags.push({ label: 'Current ratio < 1', detail: `${(ca / cl).toFixed(2)}x — short-term liabilities exceed short-term assets`, severity: 'warn' });

  return flags;
}

function cashflowFlags(cfStmts: AVReport[], incStmts: AVReport[], prevIdx = 1): Flag[] {
  if (cfStmts.length <= prevIdx) return [];
  const curr = cfStmts[0], prev = cfStmts[prevIdx];
  const flags: Flag[] = [];

  const ocf = n(curr, 'operatingCashflow');
  const ni = incStmts[0] ? n(incStmts[0], 'netIncome') : undefined;
  if (ocf != null && ni != null && ni > 0 && ocf < ni * 0.5)
    flags.push({ label: 'Operating CF lags net income', detail: 'Earnings quality concern — profit not converting to cash', severity: 'warn' });

  const capex = n(curr, 'capitalExpenditures');
  if (ocf != null && capex != null) {
    const fcf = ocf - Math.abs(capex);
    const prevOcf = n(prev, 'operatingCashflow');
    const prevCapex = n(prev, 'capitalExpenditures');
    if (fcf < 0) flags.push({ label: 'Negative free cash flow', detail: `FCF: ${fmt(fcf)}`, severity: 'warn' });
    if (prevOcf != null && prevCapex != null) {
      const prevFcf = prevOcf - Math.abs(prevCapex);
      const fcfChg = pctChange(fcf, prevFcf);
      if (fcfChg != null && fcfChg > 0.25 && prevFcf > 0)
        flags.push({ label: 'FCF growing strongly', detail: `+${(fcfChg * 100).toFixed(1)}% YoY`, severity: 'good' });
      if (fcfChg != null && fcfChg < -0.30 && fcf > 0)
        flags.push({ label: 'FCF declining significantly', detail: `${(fcfChg * 100).toFixed(1)}% YoY`, severity: 'warn' });
    }
  }

  const buybacks = n(curr, 'paymentsForRepurchaseOfCommonStock');
  if (buybacks != null && buybacks > 1e8)
    flags.push({ label: 'Significant share repurchases', detail: `${fmt(buybacks)} returned to shareholders`, severity: 'good' });

  return flags;
}

// ── Alpha Vantage fetch ───────────────────────────────────────────────────────

const AV_BASE = 'https://www.alphavantage.co/query';

async function avFetch(fn: string, symbol: string, apiKey: string): Promise<Record<string, AVReport[]>> {
  const url = `${AV_BASE}?function=${fn}&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json['Note']) throw new Error('Alpha Vantage rate limit reached — free tier allows 25 calls/day. Wait or upgrade your API key.');
  if (json['Information']) throw new Error('Alpha Vantage: ' + json['Information']);
  if (json['Error Message']) throw new Error('Ticker not found: ' + json['Error Message']);
  return json;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchFinancials(ticker: string, apiKey: string): Promise<FinData> {
  const sym = ticker.toUpperCase();
  const incData = await avFetch('INCOME_STATEMENT', sym, apiKey);
  await sleep(1100);
  const balData = await avFetch('BALANCE_SHEET', sym, apiKey);
  await sleep(1100);
  const cfData  = await avFetch('CASH_FLOW', sym, apiKey);

  return {
    incomeAnnual:    (incData.annualReports    ?? []) as AVReport[],
    incomeQuarterly: (incData.quarterlyReports ?? []) as AVReport[],
    balanceAnnual:    (balData.annualReports    ?? []) as AVReport[],
    balanceQuarterly: (balData.quarterlyReports ?? []) as AVReport[],
    cashflowAnnual:    (cfData.annualReports    ?? []) as AVReport[],
    cashflowQuarterly: (cfData.quarterlyReports ?? []) as AVReport[],
  };
}

// ── Shared UI components ──────────────────────────────────────────────────────

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function FlagBadge({ flag }: { flag: Flag }) {
  const C: Record<Severity, { bg: string; border: string; text: string; dot: string }> = {
    warn:  { bg: '#ef444412', border: '#ef444440', text: '#fca5a5', dot: '#ef4444' },
    good:  { bg: '#10b98112', border: '#10b98140', text: '#6ee7b7', dot: '#10b981' },
    info:  { bg: '#f59e0b12', border: '#f59e0b40', text: '#fcd34d', dot: '#f59e0b' },
  };
  const c = C[flag.severity];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, marginTop: 5, flexShrink: 0 }} />
      <div>
        <div style={{ color: c.text, fontWeight: 600, fontSize: 13 }}>{flag.label}</div>
        <div style={{ color: 'var(--text)', fontSize: 12, marginTop: 2 }}>{flag.detail}</div>
      </div>
    </div>
  );
}

function LearnRow({ name, formula, short, long, gotcha }: { name: string; formula?: string; short: string; long: string; gotcha: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', textAlign: 'left' }}>
        <div>
          <span style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: 14 }}>{name}</span>
          {formula && <span style={{ color: '#6366f1', fontSize: 12, marginLeft: 10, fontFamily: 'monospace' }}>{formula}</span>}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 14, display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: '#10b98110', border: '1px solid #10b98130', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>SHORT-TERM IMPACT</div>
              <div style={{ color: 'var(--text)', fontSize: 13 }}>{short}</div>
            </div>
            <div style={{ background: '#6366f110', border: '1px solid #6366f130', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#818cf8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>LONG-TERM / VALUATION</div>
              <div style={{ color: 'var(--text)', fontSize: 13 }}>{long}</div>
            </div>
          </div>
          <div style={{ background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>⚠ GOTCHA</div>
            <div style={{ color: 'var(--text)', fontSize: 13 }}>{gotcha}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live data table ───────────────────────────────────────────────────────────

type RowDef = { label: string; key: string; divisor?: number; suffix?: string };

// For quarterly data, YoY = compare index 0 to index 4 (same quarter prior year).
// For annual data, YoY = compare index 0 to index 1 (prior year).
function LiveTable({ stmts, rows, period }: { stmts: AVReport[]; rows: RowDef[]; period: Period }) {
  if (!stmts.length) return null;
  const prevIdx = period === 'quarterly' ? 4 : 1;
  const periods = stmts.slice(0, 4);
  const yoyBase = stmts[prevIdx]; // the period we compare against for YoY

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border)', minWidth: 200 }}>
              Line Item
              {yoyBase && (
                <span style={{ fontSize: 10, fontWeight: 400, color: '#3b82f6', marginLeft: 8 }}>
                  YoY vs {yoyBase.fiscalDateEnding?.slice(0, 7)}
                </span>
              )}
            </th>
            {periods.map((s, i) => (
              <th key={i} style={{ textAlign: 'right', padding: '8px 8px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border)', minWidth: 110 }}>
                {s.fiscalDateEnding?.slice(0, 7) ?? '—'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key, divisor, suffix }) => {
            const vals = periods.map(s => n(s, key));
            const curr = vals[0];
            const yoyPrev = yoyBase ? n(yoyBase, key) : undefined;
            const chg = pctChange(curr, yoyPrev);
            const chgColor = chg == null ? '' : chg < -0.05 ? '#ef4444' : chg > 0.05 ? '#10b981' : 'var(--text-muted)';
            const display = (v: number | undefined) => {
              if (v == null) return '—';
              if (divisor) return (v / divisor).toFixed(0) + (suffix ?? '');
              return fmt(v);
            };
            return (
              <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '9px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {label}
                  {chg != null && (
                    <span style={{ fontSize: 11, color: chgColor, fontWeight: 600 }}>
                      {chg > 0 ? '+' : ''}{(chg * 100).toFixed(1)}% YoY
                    </span>
                  )}
                </td>
                {vals.map((v, i) => (
                  <td key={i} style={{ textAlign: 'right', padding: '9px 8px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>
                    {display(v)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Educational content ───────────────────────────────────────────────────────

const INCOME_LEARN = [
  { name: 'Revenue (Net Sales)', short: 'Beats/misses move the stock on earnings day. Accelerating growth is rewarded with multiple expansion.', long: 'The top-line growth rate anchors DCF models. A company growing 20%+ sustainably trades at a premium. Revenue quality (recurring vs. one-time) matters more than the raw number.', gotcha: 'Channel stuffing inflates revenue temporarily. Watch deferred revenue on the balance sheet — if it declines, a company may be pulling future sales forward.' },
  { name: 'Cost of Revenue (COGS)', formula: 'Direct costs of goods/services sold', short: 'Rising COGS squeezes margins immediately. Input cost inflation (energy, materials, labor) shows up here first.', long: 'COGS as % of revenue determines gross margin ceiling. Software companies with near-zero COGS have massive pricing power.', gotcha: 'Companies can capitalize costs to move them off the P&L temporarily. Aggressive capitalization makes COGS look lower than reality.' },
  { name: 'Gross Profit', formula: 'Revenue − COGS', short: 'Declining gross margin is the earliest warning sign of competitive pressure or input cost inflation.', long: 'Gross margin is the primary driver of terminal value in DCF. A 5pp expansion can add 20–30% to fair value. Expanding margins as revenue grows = operating leverage.', gotcha: 'Gross margin varies enormously by industry (software ~75%, grocery ~25%). Always compare to sector peers, never in isolation.' },
  { name: 'R&D Expense', short: 'Cuts to R&D juice short-term EPS but signal deteriorating competitive moat.', long: 'R&D as % of revenue is a reinvestment rate proxy for tech companies. Rising R&D that stays ahead of competition builds durable moat.', gotcha: 'Under US GAAP, R&D is expensed immediately. Under IFRS, development costs can be capitalized — this makes GAAP tech companies look less profitable than IFRS peers.' },
  { name: 'SG&A (Selling, General & Administrative)', short: 'The primary lever for short-term margin improvement. Easy to cut, but cutting sales spend can starve the revenue pipeline.', long: 'SG&A scaling slower than revenue (operating leverage) is one of the strongest signals of a maturing, profitable business. Watch the SG&A/revenue ratio trend over 3–5 years.', gotcha: 'Stock-based compensation is often buried in SG&A (and R&D). Exclude it to see "cash" operating margins.' },
  { name: 'Operating Income (EBIT)', formula: 'Gross Profit − OpEx', short: 'EBIT margin expansion drives near-term earnings upgrades. Companies guiding for margin expansion tend to outperform.', long: 'EBIT is capital-structure-neutral — the cleanest profitability metric for comparing companies with different debt levels. The numerator in EV/EBIT valuation.', gotcha: 'EBIT includes D&A (non-cash). Heavily depreciated assets can make EBIT look worse than cash economics. Use EBITDA for capex-heavy businesses.' },
  { name: 'Interest Expense', short: 'Rising rates directly increase interest expense on floating-rate debt. Can compress EPS significantly without any operational change.', long: 'Interest expense relative to EBIT = interest coverage ratio. Below 3x is a warning; below 1.5x is distress territory.', gotcha: 'Interest expense is tax-deductible (interest tax shield). Levered companies have lower effective tax rates — don\'t penalize without accounting for the shield.' },
  { name: 'Net Income', formula: 'EBT − Taxes', short: 'The headline EPS figure. Volatile due to tax items, one-time charges, non-operating gains.', long: 'Net income feeds retained earnings on the balance sheet. But net income ≠ cash flow. Always reconcile to FCF.', gotcha: 'Net income is the most easily manipulated metric. Accounting choices (depreciation method, revenue recognition, reserve levels) all flow through here.' },
  { name: 'EBITDA', formula: 'EBIT + D&A', short: 'Widely used as a cash-flow proxy. Backed out of leverage multiples (Net Debt/EBITDA) in credit analysis.', long: '"Earnings before the good stuff" — strips out non-cash and financing items. Standard denominator in LBO and M&A valuation.', gotcha: 'EBITDA ignores capex — a terrible metric for capital-intensive businesses. A factory needs constant reinvestment that EBITDA pretends doesn\'t exist.' },
];

const INCOME_ROWS: RowDef[] = [
  { label: 'Total Revenue',                  key: 'totalRevenue' },
  { label: 'Cost of Revenue',                key: 'costOfRevenue' },
  { label: 'Gross Profit',                   key: 'grossProfit' },
  { label: 'R&D Expense',                    key: 'researchAndDevelopment' },
  { label: 'SG&A Expense',                   key: 'sellingGeneralAndAdministrative' },
  { label: 'Operating Expenses',             key: 'operatingExpenses' },
  { label: 'Operating Income (EBIT)',        key: 'operatingIncome' },
  { label: 'EBITDA',                         key: 'ebitda' },
  { label: 'Interest Expense',               key: 'interestExpense' },
  { label: 'Income Before Tax',              key: 'incomeBeforeTax' },
  { label: 'Income Tax',                     key: 'incomeTaxExpense' },
  { label: 'Net Income',                     key: 'netIncome' },
];

const BALANCE_LEARN = [
  { name: 'Cash & Short-term Investments', short: 'Cash runway determines whether a company can survive downturns. Net cash provides M&A optionality.', long: 'In DCF, net debt/cash is subtracted/added to equity value. Cash-rich companies can invest counter-cyclically.', gotcha: '"Cash" often includes money-market funds and T-bills. Some cash is trapped overseas (foreign subsidiaries) and incurs repatriation taxes.' },
  { name: 'Accounts Receivable', formula: 'Money owed by customers', short: 'Rapidly growing AR relative to revenue can signal customers delaying payment or aggressive revenue recognition.', long: 'Days Sales Outstanding (DSO = AR ÷ daily revenue) measures collection efficiency. Rising DSO over several quarters signals credit risk.', gotcha: 'AR is reported net of allowances for doubtful accounts. A company can inflate AR by understating the allowance.' },
  { name: 'Inventory', short: 'Inventory build-ups tie up cash and risk obsolescence. Surges relative to revenue often precede margin-crushing clearance sales.', long: 'Days Inventory Outstanding shows how long products sit before selling. Rising DIO for tech/apparel is a leading indicator of revenue misses.', gotcha: 'LIFO vs FIFO accounting changes the inventory value and COGS. US companies can use LIFO (which understates inventory in inflation) while IFRS disallows it.' },
  { name: 'Property, Plant & Equipment (PP&E)', formula: 'Net of accumulated depreciation', short: 'Large PP&E additions signal capacity expansion. High PP&E relative to revenue indicates capital intensity, compressing FCF margins.', long: 'Asset-light businesses (software, marketplaces) trade at premium multiples because they don\'t need PP&E to grow.', gotcha: 'PP&E is depreciated on management\'s chosen schedule. Extending asset lives reduces depreciation expense and boosts EPS artificially.' },
  { name: 'Goodwill & Intangibles', formula: 'Premium paid in acquisitions', short: 'Goodwill impairments are large non-cash write-downs that can wipe out book value overnight.', long: 'High goodwill/total assets means growth came via acquisition. Serial acquirers are valued on "through-cycle" earnings.', gotcha: 'Goodwill is only written down, never up. A company can carry overpriced acquisitions for years before impairment — which often comes during downturns.' },
  { name: 'Long-term Debt', short: 'Rising long-term debt increases interest expense and EPS dilution risk if debt converts to equity.', long: 'Net debt (debt − cash) is the enterprise value adjustment. High net debt compresses equity value in a DCF.', gotcha: 'Off-balance-sheet debt (operating leases pre-IFRS 16, take-or-pay contracts, pension obligations) can be larger than reported debt. Always read footnotes.' },
  { name: 'Shareholders\' Equity', formula: 'Assets − Liabilities', short: 'Book value per share is the floor in liquidation scenarios. P/B ratio measures what the market pays per dollar of net assets.', long: 'ROE (net income ÷ equity) measures how efficiently a company compounds value. Buffett ideal: high ROE + low reinvestment.', gotcha: 'Negative equity sounds alarming but is common at excellent companies (McDonald\'s, Starbucks) due to aggressive buybacks. Context matters.' },
];

const BALANCE_ROWS: RowDef[] = [
  { label: 'Cash & Equivalents',     key: 'cashAndCashEquivalentsAtCarryingValue' },
  { label: 'Short-term Investments', key: 'shortTermInvestments' },
  { label: 'Accounts Receivable',    key: 'currentNetReceivables' },
  { label: 'Inventory',              key: 'inventory' },
  { label: 'Total Current Assets',   key: 'totalCurrentAssets' },
  { label: 'PP&E (net)',             key: 'propertyPlantEquipmentNet' },
  { label: 'Goodwill',               key: 'goodwill' },
  { label: 'Intangible Assets',      key: 'intangibleAssets' },
  { label: 'Total Assets',           key: 'totalAssets' },
  { label: 'Accounts Payable',       key: 'currentAccountsPayable' },
  { label: 'Short-term Debt',        key: 'shortTermDebt' },
  { label: 'Total Current Liab.',    key: 'totalCurrentLiabilities' },
  { label: 'Long-term Debt',         key: 'longTermDebt' },
  { label: 'Total Liabilities',      key: 'totalLiabilities' },
  { label: 'Shareholders\' Equity',  key: 'totalShareholderEquity' },
  { label: 'Shares Outstanding (M)', key: 'commonStockSharesOutstanding', divisor: 1e6, suffix: 'M' },
];

const CASHFLOW_LEARN = [
  { name: 'Operating Cash Flow (OCF)', formula: 'Net income + non-cash + working capital Δ', short: 'OCF is the lifeblood of the business — cash actually generated from operations. Divergence from net income is the #1 earnings quality signal.', long: 'OCF funds capex, dividends, and buybacks. FCF yield (FCF / market cap) is arguably the cleanest valuation metric for mature businesses.', gotcha: 'OCF can be flattered by managing working capital (stretching payables, cutting inventory). Sustainable OCF improvement must come from earnings.' },
  { name: 'Capital Expenditures (CapEx)', formula: 'Cash spent on PP&E', short: 'CapEx is a cash outflow. Rising CapEx signals growth investment but consumes FCF today.', long: 'Growth CapEx (new capacity) vs maintenance CapEx (sustaining assets) is a critical distinction. Buffett\'s "owner earnings" = OCF − maintenance CapEx.', gotcha: 'Companies don\'t separately disclose maintenance vs growth CapEx. Analysts estimate by comparing CapEx to D&A. CapEx consistently < D&A means the asset base is shrinking.' },
  { name: 'Free Cash Flow (FCF)', formula: 'OCF − CapEx', short: 'The purest measure of cash available to return to shareholders. FCF surprises drive stock re-ratings.', long: 'FCF yield (FCF / EV) is the inverse of EV/FCF. Comparing FCF yield to bond yields frames the equity risk premium concretely.', gotcha: 'FCF can be inflated by underspending on maintenance capex. FCF that comes at the cost of the asset base isn\'t sustainable.' },
  { name: 'Share Repurchases', formula: 'Cash outflow in financing', short: 'Buybacks boost EPS and are tax-efficient vs dividends. Markets generally react positively.', long: 'Buybacks at below-intrinsic-value are value-creative; buybacks at peak valuations destroy value. Track actual shares outstanding to verify follow-through.', gotcha: 'Companies often announce buyback authorizations they never fully execute. Announced ≠ completed.' },
  { name: 'Dividends', short: 'Dividends signal confidence in sustained cash flow. Cuts are extremely negative market events.', long: 'Dividend yield contributes meaningfully to total return. Payout ratio (dividends / net income) above 80% leaves little reinvestment capacity.', gotcha: 'Special dividends funded by debt are not sustainable. Evaluate dividends against FCF, not just net income.' },
  { name: 'Debt Issuance / Repayment', short: 'Net debt issuance increases financial leverage and interest costs.', long: 'Capital structure decisions affect WACC and DCF terminal value. Companies reducing net debt while growing FCF create significant equity value.', gotcha: 'Refinancing (repaying old debt, issuing new) can look like both inflow and outflow. Net the two to see if leverage is increasing or decreasing.' },
];

const CASHFLOW_ROWS: RowDef[] = [
  { label: 'Net Income',                key: 'netIncome' },
  { label: 'Depreciation & Amort.',     key: 'depreciationDepletionAndAmortization' },
  { label: 'Δ Receivables',             key: 'changeInReceivables' },
  { label: 'Δ Inventory',               key: 'changeInInventory' },
  { label: 'Operating Cash Flow',       key: 'operatingCashflow' },
  { label: 'Capital Expenditures',      key: 'capitalExpenditures' },
  { label: 'Investing Cash Flow',       key: 'cashflowFromInvestment' },
  { label: 'Dividends Paid',            key: 'dividendPayout' },
  { label: 'Share Repurchases',         key: 'paymentsForRepurchaseOfCommonStock' },
  { label: 'Financing Cash Flow',       key: 'cashflowFromFinancing' },
  { label: 'Net Change in Cash',        key: 'changeInCashAndCashEquivalents' },
];

// ── Ratios educational content ────────────────────────────────────────────────

interface RatioDef { name: string; formula: string; category: string; pro: string; red: string; benchmark: string }

const RATIOS: RatioDef[] = [
  { name: 'Gross Margin', formula: 'Gross Profit ÷ Revenue', category: 'Profitability', pro: 'The first stop in every fundamental analysis. Pros track the 3–5 year trend, not just the level. Expansion = pricing power or cost efficiency.', red: 'Consistent compression (>2pp/yr) signals commoditization. Below-peer gross margins need a structural reason to improve.', benchmark: 'SaaS: 70–80% | Consumer: 30–50% | Retail: 20–35% | Auto: 10–20%' },
  { name: 'Operating Margin', formula: 'EBIT ÷ Revenue', category: 'Profitability', pro: 'Capital-structure-neutral. "Operating leverage" — the rate at which margin expands vs revenue growth — is a key quality signal.', red: 'Structurally low (<5%) operating margins leave no buffer for cost inflation or revenue misses.', benchmark: 'Software: 20–35% | Industrial: 10–15% | Retail: 3–8% | Airlines: 5–12%' },
  { name: 'Net Profit Margin', formula: 'Net Income ÷ Revenue', category: 'Profitability', pro: 'The "bottom line" margin. Pros use it as a sanity check but prefer EBIT margin for cross-company comparisons due to tax and leverage differences.', red: 'Net margins below 3% leave no margin of safety. Highly cyclical businesses can go negative, creating binary risk for equity holders.', benchmark: 'Technology: 15–25% | Banking: 15–25% | Consumer staples: 5–12%' },
  { name: 'Return on Equity (ROE)', formula: 'Net Income ÷ Shareholders\' Equity', category: 'Profitability', pro: 'Buffett\'s preferred long-term metric. High, sustained ROE (>15%) with low leverage indicates genuine competitive advantage.', red: 'High ROE driven by leverage (low equity denominator) ≠ high-quality ROE. Use DuPont decomposition to separate the two.', benchmark: 'Excellent: >20% | Good: 12–20% | Average: 8–12% | Poor: <8%' },
  { name: 'Return on Assets (ROA)', formula: 'Net Income ÷ Total Assets', category: 'Profitability', pro: 'Measures how efficiently a company uses its asset base to generate profit. Less distorted by leverage than ROE.', red: 'ROA declining while ROE holds steady usually means leverage is increasing to mask asset inefficiency.', benchmark: 'Banks: 0.5–2% | Tech: 8–15% | Retail: 4–8%' },
  { name: 'Current Ratio', formula: 'Current Assets ÷ Current Liabilities', category: 'Liquidity', pro: 'Basic liquidity test. Pros use it to screen for near-term distress risk, especially in cyclical or capital-intensive businesses.', red: 'Below 1.0 means current obligations exceed liquid assets — potential liquidity crunch.', benchmark: 'Healthy: 1.5–3.0x | Minimum: >1.0x | Context-dependent for retailers' },
  { name: 'Quick Ratio', formula: '(Current Assets − Inventory) ÷ Current Liabilities', category: 'Liquidity', pro: 'More conservative than current ratio — excludes inventory which may not be quickly convertible. Better for manufacturing and retail.', red: 'Below 0.8 for non-subscription businesses is a yellow flag.', benchmark: 'Conservative: >1.0x | Acceptable: 0.7–1.0x' },
  { name: 'Debt-to-Equity (D/E)', formula: 'Total Debt ÷ Shareholders\' Equity', category: 'Leverage', pro: 'Capital structure signal. Pros compare D/E to the industry average and track it over time. High D/E amplifies ROE in good times and blows up equity in downturns.', red: 'D/E >3x in cyclical businesses is dangerous. D/E >5x is LBO territory.', benchmark: 'Low risk: <1x | Moderate: 1–3x | High: 3–5x | Distress risk: >5x' },
  { name: 'Net Debt / EBITDA', formula: '(Debt − Cash) ÷ EBITDA', category: 'Leverage', pro: 'Standard leverage metric in credit analysis and M&A. Investment-grade companies typically maintain ≤3x.', red: 'Above 5x for non-utility businesses signals limited financial flexibility. Covenant triggers often set at 5–6x.', benchmark: 'Investment grade: <3x | Speculative: 3–5x | Distressed: >6x' },
  { name: 'Interest Coverage', formula: 'EBIT ÷ Interest Expense', category: 'Leverage', pro: 'How many times over the company can pay its interest bill. Bond analysts use this alongside D/E for credit quality.', red: 'Below 3x is a yellow flag. Below 1.5x means EBIT barely covers interest. Below 1.0x = equity is worthless if this persists.', benchmark: 'Strong: >8x | Good: 4–8x | Marginal: 2–4x | Distress: <2x' },
  { name: 'Asset Turnover', formula: 'Revenue ÷ Total Assets', category: 'Efficiency', pro: 'Measures how efficiently assets generate sales. Combined with margin, it drives ROA (DuPont analysis). High turns + low margins = volume businesses (Walmart).', red: 'Declining asset turnover while growing assets = capital allocation failure. M&A is the most common cause.', benchmark: 'Retail/FMCG: 1.5–3x | Industrial: 0.5–1x | Software: 0.8–1.5x' },
  { name: 'Days Sales Outstanding (DSO)', formula: '(AR ÷ Revenue) × 365', category: 'Efficiency', pro: 'Rising DSO is an early warning on revenue quality (collections problem) or channel stuffing. Falling DSO = faster cash conversion.', red: 'DSO increasing 10+ days YoY without explanation is a serious yellow flag.', benchmark: 'Excellent: <30 days | Good: 30–45 days | Warning: >60 days' },
  { name: 'P/E Ratio', formula: 'Stock Price ÷ EPS', category: 'Valuation', pro: 'Most widely quoted metric. Pros use forward P/E vs consensus estimates and compare to the 5-year historical range.', red: 'P/E is meaningless for money-losing companies and misleading for cyclicals at peak earnings.', benchmark: 'Growth tech: 25–50x | S&P 500 avg: 18–22x | Value: <15x | Utilities: 12–18x' },
  { name: 'EV/EBITDA', formula: 'Enterprise Value ÷ EBITDA', category: 'Valuation', pro: 'Capital-structure-neutral valuation — used heavily in M&A, LBOs, and cross-sector comparisons.', red: 'EBITDA is not cash flow. High capex businesses look cheap on EV/EBITDA but aren\'t. Always compare to EV/FCF.', benchmark: 'Software: 20–40x | Industrials: 8–14x | Telecom: 6–10x | Energy: 4–8x' },
  { name: 'Price-to-Free-Cash-Flow', formula: 'Market Cap ÷ FCF', category: 'Valuation', pro: 'The metric most resistant to accounting manipulation. If you only look at one valuation metric, this is it.', red: 'P/FCF can be distorted by acquisition-heavy capex cycles (looks expensive) or unsustainable WC draws (looks cheap).', benchmark: 'Cheap: <15x | Fair: 15–25x | Growth premium: 25–40x | Expensive: >40x' },
];

function RatioCard({ ratio }: { ratio: RatioDef }) {
  const [open, setOpen] = useState(false);
  const catColors: Record<string, string> = { Profitability: '#10b981', Liquidity: '#3b82f6', Leverage: '#ef4444', Efficiency: '#f59e0b', Valuation: '#8b5cf6' };
  const color = catColors[ratio.category] ?? '#6366f1';
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 16, textAlign: 'left', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span style={{ background: color + '20', color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.05em', display: 'inline-block', marginBottom: 6 }}>{ratio.category.toUpperCase()}</span>
          <div style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: 15 }}>{ratio.name}</div>
          <div style={{ color: '#6366f1', fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>{ratio.formula}</div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', marginTop: 4, flexShrink: 0 }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', display: 'grid', gap: 8 }}>
          <div style={{ background: '#10b98110', border: '1px solid #10b98130', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>HOW PROS USE IT</div>
            <div style={{ color: 'var(--text)', fontSize: 13 }}>{ratio.pro}</div>
          </div>
          <div style={{ background: '#ef444410', border: '1px solid #ef444430', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>RED FLAGS</div>
            <div style={{ color: 'var(--text)', fontSize: 13 }}>{ratio.red}</div>
          </div>
          <div style={{ background: '#6366f110', border: '1px solid #6366f130', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#818cf8', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>INDUSTRY BENCHMARKS</div>
            <div style={{ color: 'var(--text)', fontSize: 13 }}>{ratio.benchmark}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Computed ratios from live data ────────────────────────────────────────────

function computeRatios(inc: AVReport[], bal: AVReport[], cf: AVReport[]): { label: string; value: string }[] {
  if (!inc.length || !bal.length || !cf.length) return [];
  const i = inc[0], b = bal[0], c = cf[0];
  const rows: { label: string; value: string }[] = [];

  const rev = n(i, 'totalRevenue'), gp = n(i, 'grossProfit'), ebit = n(i, 'operatingIncome');
  const ni = n(i, 'netIncome'), eq = n(b, 'totalShareholderEquity');
  const ca = n(b, 'totalCurrentAssets'), cl = n(b, 'totalCurrentLiabilities');
  const inv = n(b, 'inventory'), ar = n(b, 'currentNetReceivables');
  const ltd = n(b, 'longTermDebt'), cash = n(b, 'cashAndCashEquivalentsAtCarryingValue');
  const intExp = n(i, 'interestExpense'), ta = n(b, 'totalAssets');
  const ocf = n(c, 'operatingCashflow'), capex = n(c, 'capitalExpenditures');
  const cogs = n(i, 'costOfRevenue'), ebitda = n(i, 'ebitda');

  if (rev && gp)   rows.push({ label: 'Gross Margin',     value: ((gp / rev) * 100).toFixed(1) + '%' });
  if (rev && ebit) rows.push({ label: 'Operating Margin', value: ((ebit / rev) * 100).toFixed(1) + '%' });
  if (rev && ni)   rows.push({ label: 'Net Margin',       value: ((ni / rev) * 100).toFixed(1) + '%' });
  if (ni && eq && eq > 0) rows.push({ label: 'ROE', value: ((ni / eq) * 100).toFixed(1) + '%' });
  if (ni && ta)    rows.push({ label: 'ROA',              value: ((ni / ta) * 100).toFixed(1) + '%' });
  if (ca && cl)    rows.push({ label: 'Current Ratio',    value: (ca / cl).toFixed(2) + 'x' });
  if (ca && cl && inv) rows.push({ label: 'Quick Ratio',  value: ((ca - inv) / cl).toFixed(2) + 'x' });
  if (ltd && eq && eq > 0) rows.push({ label: 'Debt / Equity', value: (ltd / eq).toFixed(2) + 'x' });
  if (ebit && intExp && intExp > 0) rows.push({ label: 'Interest Coverage', value: (ebit / intExp).toFixed(1) + 'x' });
  if (rev && ta)   rows.push({ label: 'Asset Turnover',   value: (rev / ta).toFixed(2) + 'x' });
  if (ar && rev)   rows.push({ label: 'DSO (days)',       value: Math.round((ar / rev) * 365).toString() });
  if (cogs && inv && inv > 0) rows.push({ label: 'Inventory Turns', value: (cogs / inv).toFixed(1) + 'x' });
  if (ocf != null && capex != null) {
    const fcf = ocf - Math.abs(capex);
    rows.push({ label: 'Free Cash Flow',  value: fmt(fcf) });
    if (rev) rows.push({ label: 'FCF Margin', value: ((fcf / rev) * 100).toFixed(1) + '%' });
  }
  if (ebitda && ltd != null && cash != null) {
    const netDebt = ltd - (cash ?? 0);
    if (ebitda > 0) rows.push({ label: 'Net Debt/EBITDA', value: (netDebt / ebitda).toFixed(2) + 'x' });
  }

  return rows;
}

// ── Quality Scores: Piotroski F-Score & Altman Z-Score ───────────────────────

interface PiotroskiCheck { label: string; bucket: string; detail: string; pass: boolean | null }

function computePiotroski(inc: AVReport[], bal: AVReport[], cf: AVReport[]): { checks: PiotroskiCheck[]; score: number } {
  const checks: PiotroskiCheck[] = [];
  const push = (label: string, bucket: string, detail: string, pass: boolean | null) => checks.push({ label, bucket, detail, pass });

  if (!inc.length || !bal.length || !cf.length) return { checks, score: 0 };

  const b0 = bal[0], b1 = bal[1];
  const i0 = inc[0], i1 = inc[1];
  const c0 = cf[0];

  const ta0 = n(b0, 'totalAssets'), ta1 = b1 ? n(b1, 'totalAssets') : undefined;
  const ni0 = n(i0, 'netIncome'), ni1 = i1 ? n(i1, 'netIncome') : undefined;
  const ocf0 = n(c0, 'operatingCashflow');
  const gp0 = n(i0, 'grossProfit'), rev0 = n(i0, 'totalRevenue');
  const gp1 = i1 ? n(i1, 'grossProfit') : undefined, rev1 = i1 ? n(i1, 'totalRevenue') : undefined;
  const ca0 = n(b0, 'totalCurrentAssets'), cl0 = n(b0, 'totalCurrentLiabilities');
  const ca1 = b1 ? n(b1, 'totalCurrentAssets') : undefined, cl1 = b1 ? n(b1, 'totalCurrentLiabilities') : undefined;
  const ltd0 = n(b0, 'longTermDebt'), ltd1 = b1 ? n(b1, 'longTermDebt') : undefined;
  const shares0 = n(b0, 'commonStockSharesOutstanding'), shares1 = b1 ? n(b1, 'commonStockSharesOutstanding') : undefined;

  const roa0 = ta0 && ta0 > 0 && ni0 != null ? ni0 / ta0 : null;
  const roa1 = ta1 && ta1 > 0 && ni1 != null ? ni1 / ta1 : null;

  // Profitability
  push('Positive ROA', 'Profitability', roa0 != null ? `ROA = ${(roa0 * 100).toFixed(2)}%` : 'Data unavailable', roa0 != null ? roa0 > 0 : null);
  push('Positive Operating Cash Flow', 'Profitability', ocf0 != null ? `OCF = ${fmt(ocf0)}` : 'Data unavailable', ocf0 != null ? ocf0 > 0 : null);
  push('Improving ROA (vs prior year)', 'Profitability', roa0 != null && roa1 != null ? `${(roa1 * 100).toFixed(2)}% → ${(roa0 * 100).toFixed(2)}%` : 'Need 2 years', roa0 != null && roa1 != null ? roa0 > roa1 : null);
  push('Cash-Based Earnings (OCF/TA > ROA)', 'Profitability', 'Operating CF exceeds accrual earnings — signals high earnings quality', ocf0 != null && ta0 && ta0 > 0 && roa0 != null ? (ocf0 / ta0) > roa0 : null);

  // Leverage / Liquidity
  const lev0 = ta0 && ta0 > 0 && ltd0 != null ? ltd0 / ta0 : null;
  const lev1 = ta1 && ta1 > 0 && ltd1 != null ? ltd1 / ta1 : null;
  push('Decreasing Leverage (LTD/Assets)', 'Leverage & Liquidity', lev0 != null && lev1 != null ? `${(lev1 * 100).toFixed(1)}% → ${(lev0 * 100).toFixed(1)}%` : 'Need 2 years', lev0 != null && lev1 != null ? lev0 < lev1 : null);

  const cr0 = ca0 && cl0 && cl0 > 0 ? ca0 / cl0 : null;
  const cr1 = ca1 && cl1 && cl1 > 0 ? ca1 / cl1 : null;
  push('Improving Current Ratio', 'Leverage & Liquidity', cr0 != null && cr1 != null ? `${cr1.toFixed(2)}x → ${cr0.toFixed(2)}x` : 'Need 2 years', cr0 != null && cr1 != null ? cr0 > cr1 : null);

  push('No Share Dilution', 'Leverage & Liquidity', shares0 != null && shares1 != null ? `${(shares1 / 1e6).toFixed(1)}M → ${(shares0 / 1e6).toFixed(1)}M shares` : 'Data unavailable', shares0 != null && shares1 != null ? shares0 <= shares1 * 1.02 : null);

  // Operating Efficiency
  const gm0 = gp0 != null && rev0 && rev0 > 0 ? gp0 / rev0 : null;
  const gm1 = gp1 != null && rev1 && rev1 > 0 ? gp1 / rev1 : null;
  push('Improving Gross Margin', 'Operating Efficiency', gm0 != null && gm1 != null ? `${(gm1 * 100).toFixed(1)}% → ${(gm0 * 100).toFixed(1)}%` : 'Need 2 years', gm0 != null && gm1 != null ? gm0 > gm1 : null);

  const at0 = rev0 != null && ta0 && ta0 > 0 ? rev0 / ta0 : null;
  const at1 = rev1 != null && ta1 && ta1 > 0 ? rev1 / ta1 : null;
  push('Improving Asset Turnover', 'Operating Efficiency', at0 != null && at1 != null ? `${at1.toFixed(2)}x → ${at0.toFixed(2)}x` : 'Need 2 years', at0 != null && at1 != null ? at0 > at1 : null);

  const score = checks.filter(c => c.pass === true).length;
  return { checks, score };
}

function computeAltmanZ(inc: AVReport[], bal: AVReport[]): { z: number | null; components: { label: string; coeff: number; value: number; contribution: number }[] } {
  if (!inc.length || !bal.length) return { z: null, components: [] };
  const i = inc[0], b = bal[0];

  const ta = n(b, 'totalAssets');
  if (!ta || ta === 0) return { z: null, components: [] };

  const ca = n(b, 'totalCurrentAssets'), cl = n(b, 'totalCurrentLiabilities');
  const re = n(b, 'retainedEarnings');
  const ebit = n(i, 'operatingIncome');
  const eq = n(b, 'totalShareholderEquity');
  const tl = n(b, 'totalLiabilities');
  const rev = n(i, 'totalRevenue');

  const x1 = ca != null && cl != null ? (ca - cl) / ta : null;
  const x2 = re != null ? re / ta : null;
  const x3 = ebit != null ? ebit / ta : null;
  const x4 = eq != null && tl != null && tl > 0 ? eq / tl : null;
  const x5 = rev != null ? rev / ta : null;

  if (x1 == null || x2 == null || x3 == null || x4 == null || x5 == null) return { z: null, components: [] };

  const components = [
    { label: 'X1 — Working Capital / Total Assets', coeff: 0.717, value: x1, contribution: 0.717 * x1 },
    { label: 'X2 — Retained Earnings / Total Assets', coeff: 0.847, value: x2, contribution: 0.847 * x2 },
    { label: 'X3 — EBIT / Total Assets', coeff: 3.107, value: x3, contribution: 3.107 * x3 },
    { label: 'X4 — Book Equity / Total Liabilities', coeff: 0.420, value: x4, contribution: 0.420 * x4 },
    { label: 'X5 — Revenue / Total Assets', coeff: 0.998, value: x5, contribution: 0.998 * x5 },
  ];

  const z = components.reduce((s, c) => s + c.contribution, 0);
  return { z, components };
}

// ── Main page ─────────────────────────────────────────────────────────────────

const LS_KEY = 'av_api_key';

export function FinancialStatements() {
  const [tab, setTab] = useState<Tab>('income');
  const [period, setPeriod] = useState<Period>('annual');
  const [ticker, setTicker] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_KEY) ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(LS_KEY));
  const [data, setData] = useState<FinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  const saveKey = (k: string) => {
    setApiKey(k);
    if (k) { localStorage.setItem(LS_KEY, k); setShowKeyInput(false); }
    else localStorage.removeItem(LS_KEY);
  };

  const search = useCallback(async (sym: string, key: string, forceRefresh = false) => {
    if (!sym.trim() || !key.trim()) return;
    const symUp = sym.trim().toUpperCase();
    setLoading(true); setError('');
    try {
      if (!forceRefresh) {
        const cached = await getCached<FinData>(PAGE, symUp);
        if (cached) { setData(cached); setTicker(symUp); setFromCache(true); return; }
      }
      const d = await fetchFinancials(sym.trim(), key.trim());
      await saveCache(PAGE, symUp, d);
      setData(d); setTicker(symUp); setFromCache(false);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (ticker) { clearCache(PAGE, ticker); search(ticker, apiKey, true); }
  }, [ticker, apiKey, search]);

  const incStmts = data ? (period === 'annual' ? (data.incomeAnnual    ?? []) : (data.incomeQuarterly    ?? [])) : [];
  const balStmts = data ? (period === 'annual' ? (data.balanceAnnual   ?? []) : (data.balanceQuarterly   ?? [])) : [];
  const cfStmts  = data ? (period === 'annual' ? (data.cashflowAnnual  ?? []) : (data.cashflowQuarterly  ?? [])) : [];

  // Annual: compare index 0 vs 1 (prior year). Quarterly: compare index 0 vs 4 (same quarter prior year).
  const prevIdx = period === 'quarterly' ? 4 : 1;

  const iFlags = incomeFlags(incStmts, prevIdx);
  const bFlags = balanceFlags(balStmts, prevIdx);
  const cFlags = cashflowFlags(cfStmts, incStmts, prevIdx);
  const ratioRows = computeRatios(incStmts, balStmts, cfStmts);

  // Quality scores always use annual data
  const piotroski = data ? computePiotroski(data.incomeAnnual, data.balanceAnnual, data.cashflowAnnual) : null;
  const altman = data ? computeAltmanZ(data.incomeAnnual, data.balanceAnnual) : null;

  const TABS = [
    { id: 'income'   as Tab, label: 'Income Statement', color: '#10b981' },
    { id: 'balance'  as Tab, label: 'Balance Sheet',    color: '#3b82f6' },
    { id: 'cashflow' as Tab, label: 'Cash Flow',        color: '#8b5cf6' },
    { id: 'ratios'   as Tab, label: 'Ratios & Analysis',color: '#f59e0b' },
    { id: 'quality'  as Tab, label: 'Quality Scores',   color: '#ec4899' },
  ];
  const activeColor = TABS.find(t => t.id === tab)?.color ?? '#6366f1';

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
    padding: '10px 14px', color: 'var(--text-h)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };
  const btnStyle = (primary = true): React.CSSProperties => ({
    background: primary ? '#6366f1' : 'none', color: primary ? '#fff' : 'var(--text-muted)',
    border: primary ? 'none' : '1px solid var(--border)', borderRadius: 8, padding: '10px 20px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const,
  });

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px', color: 'var(--text-h)', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700 }}>
          Financial Statement Analysis
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Learn what every line means, how professionals use ratios, and analyze a real company's latest filings via Alpha Vantage.
        </p>
      </div>

      {/* API key setup */}
      {showKeyInput ? (
        <Card style={{ marginBottom: 24, border: '1px solid #6366f140' }}>
          <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: 8 }}>Alpha Vantage API Key Required</div>
          <p style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 12px' }}>
            Get a free key at <strong style={{ color: 'var(--text-h)' }}>alphavantage.co/support/#api-key</strong> (no credit card, 25 calls/day free). Your key is saved locally in your browser.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Paste your Alpha Vantage API key…"
              onKeyDown={e => e.key === 'Enter' && saveKey((e.target as HTMLInputElement).value.trim())}
              defaultValue={apiKey}
              id="av-key-input"
            />
            <button style={btnStyle()} onClick={() => saveKey((document.getElementById('av-key-input') as HTMLInputElement).value.trim())}>Save Key</button>
          </div>
        </Card>
      ) : (
        /* Search bar */
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && search(inputVal, apiKey)}
                placeholder="Enter ticker symbol (e.g. AAPL, MSFT, NVDA)"
                style={inputStyle}
              />
            </div>
            <button onClick={() => search(inputVal, apiKey)} disabled={loading} style={{ ...btnStyle(), opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Loading…' : 'Analyze'}
            </button>
            {data && (
              <div style={{ display: 'flex', gap: 6 }}>
                {(['annual', 'quarterly'] as Period[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? '#6366f120' : 'none', border: `1px solid ${period === p ? '#6366f1' : 'var(--border)'}`, borderRadius: 6, padding: '8px 14px', color: period === p ? '#818cf8' : 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontWeight: period === p ? 600 : 400, textTransform: 'capitalize' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowKeyInput(true)} style={{ ...btnStyle(false), fontSize: 12, padding: '8px 12px' }}>⚙ API Key</button>
          </div>
          {error && <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {error}</div>}
          {ticker && !error && <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>Showing <span style={{ color: '#818cf8', fontWeight: 700 }}>{ticker}</span> · {period} · most recent 4 periods{fromCache && <button onClick={refresh} disabled={loading} style={{ background: '#6366f115', color: '#818cf8', border: '1px solid #6366f130', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>cached · refresh</button>}</div>}
        </Card>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 14, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? t.color : 'var(--text-muted)', borderBottom: `2px solid ${tab === t.id ? t.color : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Income Statement ── */}
      {tab === 'income' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <SectionHeader title="Income Statement (P&L)" color={activeColor} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 16px' }}>Shows revenue, costs, and profit over a period. The most-watched report on earnings day. Click any line item to understand its valuation implications.</p>
            <Card>{INCOME_LEARN.map(r => <LearnRow key={r.name} {...r} />)}</Card>
          </div>
          {data && (
            <div>
              <SectionHeader title={`${ticker} — Income Statement (${period})`} color={activeColor} />
              {iFlags.length > 0 && (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>AUTO-DETECTED FINDINGS</div>
                  {iFlags.map((f, i) => <FlagBadge key={i} flag={f} />)}
                </div>
              )}
              <Card><LiveTable stmts={incStmts} rows={INCOME_ROWS} period={period} /></Card>
            </div>
          )}
        </div>
      )}

      {/* ── Balance Sheet ── */}
      {tab === 'balance' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <SectionHeader title="Balance Sheet" color={activeColor} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 16px' }}>A snapshot of what a company owns (assets), owes (liabilities), and the residual claim for shareholders (equity) at a point in time.</p>
            <Card>{BALANCE_LEARN.map(r => <LearnRow key={r.name} {...r} />)}</Card>
          </div>
          {data && (
            <div>
              <SectionHeader title={`${ticker} — Balance Sheet (${period})`} color={activeColor} />
              {bFlags.length > 0 && (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>AUTO-DETECTED FINDINGS</div>
                  {bFlags.map((f, i) => <FlagBadge key={i} flag={f} />)}
                </div>
              )}
              <Card><LiveTable stmts={balStmts} rows={BALANCE_ROWS} period={period} /></Card>
            </div>
          )}
        </div>
      )}

      {/* ── Cash Flow ── */}
      {tab === 'cashflow' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <div>
            <SectionHeader title="Cash Flow Statement" color={activeColor} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 16px' }}>Shows actual cash in and out. Divided into operating, investing, and financing. The hardest statement to manipulate — the closest proxy for economic reality.</p>
            <Card>{CASHFLOW_LEARN.map(r => <LearnRow key={r.name} {...r} />)}</Card>
          </div>
          {data && (
            <div>
              <SectionHeader title={`${ticker} — Cash Flow Statement (${period})`} color={activeColor} />
              {cFlags.length > 0 && (
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em' }}>AUTO-DETECTED FINDINGS</div>
                  {cFlags.map((f, i) => <FlagBadge key={i} flag={f} />)}
                </div>
              )}
              <Card><LiveTable stmts={cfStmts} rows={CASHFLOW_ROWS} period={period} /></Card>
            </div>
          )}
        </div>
      )}

      {/* ── Quality Scores ── */}
      {tab === 'quality' && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Intro */}
          <Card style={{ background: '#ec489910', border: '1px solid #ec489940' }}>
            <div style={{ color: '#f9a8d4', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>About These Scores</div>
            <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-h)' }}>Piotroski F-Score</strong> uses 9 binary signals across profitability, leverage, and efficiency. Score ≥7 = fundamentally strong. Score ≤2 = deteriorating. Developed by Prof. Joseph Piotroski (2000).<br />
              <strong style={{ color: 'var(--text-h)' }}>Altman Z-Score</strong> predicts bankruptcy risk using 5 balance-sheet ratios. Scores use the <em>private-company model</em> (book equity in X4 rather than market cap). Z′ &gt;2.9 = Safe, 1.23–2.9 = Grey Zone, &lt;1.23 = Distress. Both scores are computed from the financial statements already loaded — no extra API calls.
            </div>
          </Card>

          {!data && (
            <Card>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Enter a ticker and click Analyze to compute quality scores.</div>
            </Card>
          )}

          {data && piotroski && (
            <div>
              <SectionHeader title={`${ticker} — Piotroski F-Score`} color="#ec4899" />
              {/* Score badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: piotroski.score >= 7 ? '#10b98120' : piotroski.score >= 5 ? '#f59e0b20' : '#ef444420',
                  border: `3px solid ${piotroski.score >= 7 ? '#10b981' : piotroski.score >= 5 ? '#f59e0b' : '#ef4444'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: piotroski.score >= 7 ? '#10b981' : piotroski.score >= 5 ? '#f59e0b' : '#ef4444', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{piotroski.score}</div>
                    <div style={{ color: '#475569', fontSize: 11 }}>/ 9</div>
                  </div>
                </div>
                <div>
                  <div style={{ color: piotroski.score >= 7 ? '#10b981' : piotroski.score >= 5 ? '#f59e0b' : '#ef4444', fontSize: 20, fontWeight: 700 }}>
                    {piotroski.score >= 7 ? 'Strong' : piotroski.score >= 5 ? 'Moderate' : 'Weak'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                    {piotroski.score >= 7 && 'Improving fundamentals across profitability, leverage, and efficiency — favorable for selling puts and running the Wheel.'}
                    {piotroski.score >= 5 && piotroski.score < 7 && 'Mixed signals — some positive trends but not consistently improving across all dimensions.'}
                    {piotroski.score < 5 && 'Deteriorating fundamentals — high risk for premium sellers. Avoid or use for directional bearish strategies.'}
                  </div>
                </div>
              </div>

              {/* Checks by bucket */}
              {(['Profitability', 'Leverage & Liquidity', 'Operating Efficiency'] as const).map(bucket => {
                const bucketChecks = piotroski.checks.filter(c => c.bucket === bucket);
                const bucketColors: Record<string, string> = { Profitability: '#10b981', 'Leverage & Liquidity': '#3b82f6', 'Operating Efficiency': '#f59e0b' };
                return (
                  <div key={bucket} style={{ marginBottom: 16 }}>
                    <div style={{ color: bucketColors[bucket], fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>{bucket.toUpperCase()}</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {bucketChecks.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: c.pass === true ? '#10b98108' : c.pass === false ? '#ef444408' : '#ffffff05', border: `1px solid ${c.pass === true ? '#10b98130' : c.pass === false ? '#ef444430' : 'var(--border)'}`, borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.pass === true ? '#10b981' : c.pass === false ? '#ef4444' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#fff' }}>
                            {c.pass === true ? '✓' : c.pass === false ? '✗' : '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: 13 }}>{c.label}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{c.detail}</div>
                          </div>
                          <div style={{ color: c.pass === true ? '#10b981' : c.pass === false ? '#ef4444' : '#475569', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {c.pass === true ? '+1' : c.pass === false ? '0' : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data && altman && (
            <div>
              <SectionHeader title={`${ticker} — Altman Z′-Score`} color="#ec4899" />
              {altman.z == null ? (
                <Card><div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Insufficient balance sheet data to compute Z-Score (need: working capital, retained earnings, EBIT, equity, total liabilities, revenue).</div></Card>
              ) : (
                <>
                  {/* Score gauge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                    <div style={{
                      minWidth: 120, padding: '16px 24px', borderRadius: 12, textAlign: 'center',
                      background: altman.z > 2.9 ? '#10b98120' : altman.z > 1.23 ? '#f59e0b20' : '#ef444420',
                      border: `2px solid ${altman.z > 2.9 ? '#10b981' : altman.z > 1.23 ? '#f59e0b' : '#ef4444'}`,
                    }}>
                      <div style={{ color: altman.z > 2.9 ? '#10b981' : altman.z > 1.23 ? '#f59e0b' : '#ef4444', fontSize: 36, fontWeight: 800 }}>{altman.z.toFixed(2)}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Z′-Score</div>
                    </div>
                    <div>
                      <div style={{ color: altman.z > 2.9 ? '#10b981' : altman.z > 1.23 ? '#f59e0b' : '#ef4444', fontSize: 20, fontWeight: 700 }}>
                        {altman.z > 2.9 ? 'Safe Zone' : altman.z > 1.23 ? 'Grey Zone' : 'Distress Zone'}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, maxWidth: 400 }}>
                        {altman.z > 2.9 && 'Low bankruptcy risk. Balance sheet fundamentals are sound. Suitable for premium-selling strategies.'}
                        {altman.z > 1.23 && altman.z <= 2.9 && 'Moderate risk. Scores in this zone warrant monitoring. Check debt trends and upcoming refinancings.'}
                        {altman.z <= 1.23 && 'Elevated bankruptcy risk. Avoid selling uncovered puts or holding stock through major downturns.'}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                        {[['> 2.9', 'Safe', '#10b981'], ['1.23–2.9', 'Grey Zone', '#f59e0b'], ['< 1.23', 'Distress', '#ef4444']].map(([range, label, color]) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}: {range}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Components */}
                  <Card>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>SCORE COMPONENTS (Z′ = 0.717X1 + 0.847X2 + 3.107X3 + 0.420X4 + 0.998X5)</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {altman.components.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12, minWidth: 300 }}>{c.label}</div>
                          <div style={{ color: 'var(--text-h)', fontSize: 13, fontFamily: 'monospace', minWidth: 70 }}>{c.value.toFixed(3)}</div>
                          <div style={{ color: c.contribution > 0 ? '#10b981' : '#ef4444', fontSize: 13, fontFamily: 'monospace', minWidth: 70 }}>
                            {c.contribution > 0 ? '+' : ''}{(c.contribution).toFixed(3)}
                          </div>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.abs(c.contribution) / Math.abs(altman.z ?? 1) * 100)}%`, height: '100%', background: c.contribution > 0 ? '#10b981' : '#ef4444', borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Total Z′-Score</span>
                      <span style={{ color: altman.z > 2.9 ? '#10b981' : altman.z > 1.23 ? '#f59e0b' : '#ef4444', fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{altman.z.toFixed(3)}</span>
                    </div>
                    <div style={{ marginTop: 10, color: '#475569', fontSize: 11 }}>Uses the Altman Z′ private-company model with book value of equity in X4. The public-company model (market cap / total liabilities) typically yields higher scores for well-valued stocks.</div>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Ratios ── */}
      {tab === 'ratios' && (
        <div style={{ display: 'grid', gap: 24 }}>
          {data && ratioRows.length > 0 && (
            <div>
              <SectionHeader title={`${ticker} — Computed Ratios (latest ${period})`} color={activeColor} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {ratioRows.map(r => (
                  <div key={r.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>{r.label.toUpperCase()}</div>
                    <div style={{ color: 'var(--text-h)', fontSize: 20, fontWeight: 700 }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <SectionHeader title="Key Ratios — Professional Guide" color={activeColor} />
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 16px' }}>How institutional analysts and fund managers use financial ratios. Click any ratio for the full breakdown.</p>
            {['Profitability', 'Liquidity', 'Leverage', 'Efficiency', 'Valuation'].map(cat => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ color: 'var(--text-h)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10, textTransform: 'uppercase' }}>{cat}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {RATIOS.filter(r => r.category === cat).map(r => <RatioCard key={r.name} ratio={r} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
