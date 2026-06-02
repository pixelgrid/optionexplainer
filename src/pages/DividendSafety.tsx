import { useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { avFetch, LS_AV_KEY, nn, fmtMoney, sleep } from '../lib/avClient';

interface DividendEntry {
  ex_dividend_date: string;
  amount: string;
}

interface CashFlowReport {
  fiscalDateEnding: string;
  operatingCashflow: string;
  capitalExpenditures: string;
  dividendPayout: string;
}

interface IncomeReport {
  fiscalDateEnding: string;
  netIncome: string;
  eps: string;
}

interface DividendData {
  symbol: string;
  dividends: DividendEntry[];
  cashflow: CashFlowReport[];
  income: IncomeReport[];
}

async function fetchDividendData(ticker: string, apiKey: string): Promise<DividendData> {
  const sym = ticker.toUpperCase();
  const divData = await avFetch('DIVIDENDS', sym, apiKey);
  await sleep(1100);
  const cfData = await avFetch('CASH_FLOW', sym, apiKey);
  await sleep(1100);
  const incData = await avFetch('INCOME_STATEMENT', sym, apiKey);

  return {
    symbol: sym,
    dividends: ((divData.data ?? []) as DividendEntry[]).slice(0, 40),
    cashflow: ((cfData.annualReports ?? []) as CashFlowReport[]).slice(0, 6),
    income: ((incData.annualReports ?? []) as IncomeReport[]).slice(0, 6),
  };
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>{title}</h2>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 8,
  padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: '#1e2130' },
  xAxis: { stroke: '#2a2d3e', tick: { fill: '#64748b', fontSize: 11 } },
  yAxis: { stroke: '#2a2d3e', tick: { fill: '#64748b', fontSize: 11 } },
  tooltip: { contentStyle: { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 } },
};

function computeSafety(payoutRatio: number | null, fcfCoverage: number | null, yearsOfPayments: number): 'Safe' | 'Watch' | 'At Risk' {
  if (payoutRatio != null && (payoutRatio > 1.0 || payoutRatio < 0)) return 'At Risk';
  if (fcfCoverage != null && fcfCoverage < 0) return 'At Risk';
  if ((payoutRatio != null && payoutRatio > 0.75) || (fcfCoverage != null && fcfCoverage < 1.2) || yearsOfPayments < 3) return 'Watch';
  return 'Safe';
}

export function DividendSafety() {
  const [inputVal, setInputVal] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_AV_KEY) ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(LS_AV_KEY));
  const [data, setData] = useState<DividendData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticker, setTicker] = useState('');

  const saveKey = (k: string) => {
    setApiKey(k);
    if (k) { localStorage.setItem(LS_AV_KEY, k); setShowKeyInput(false); }
    else localStorage.removeItem(LS_AV_KEY);
  };

  const search = useCallback(async (sym: string, key: string) => {
    if (!sym.trim() || !key.trim()) return;
    setLoading(true); setError('');
    try {
      const d = await fetchDividendData(sym.trim(), key.trim());
      setData(d);
      setTicker(sym.trim().toUpperCase());
    } catch (e) {
      setError((e as Error).message ?? 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Derived metrics
  const divs = data?.dividends ?? [];
  const paysDividends = divs.length > 0 && divs.some(d => nn(d.amount) != null && nn(d.amount)! > 0);

  // Annual dividend per share (sum last 12 months)
  const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
  const last12m = divs.filter(d => new Date(d.ex_dividend_date) >= cutoff);
  const annualDPS = last12m.reduce((s, d) => s + (nn(d.amount) ?? 0), 0);

  // EPS (most recent annual)
  const latestIncome = data?.income[0];
  const incomeRec = latestIncome as unknown as Record<string, string> | undefined;
  const netIncome = incomeRec ? nn(incomeRec.netIncome) : null;

  // FCF (most recent annual)
  const latestCF = data?.cashflow[0];
  const cfRec = latestCF as unknown as Record<string, string> | undefined;
  const ocf = cfRec ? nn(cfRec.operatingCashflow) : null;
  const capex = cfRec ? nn(cfRec.capitalExpenditures) : null;
  const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : null;

  // Dividends paid (from cashflow statement)
  const divsPaidCF = cfRec ? Math.abs(nn(cfRec.dividendPayout) ?? 0) : null;

  // Payout ratio (using EPS × shares from income; or use dividendPayout / netIncome)
  const payoutRatio = divsPaidCF != null && netIncome != null && netIncome > 0 ? divsPaidCF / netIncome : null;
  const fcfCoverage = fcf != null && divsPaidCF != null && divsPaidCF > 0 ? fcf / divsPaidCF : null;

  // Years of consecutive payments
  const yearSet = new Set(divs.map(d => d.ex_dividend_date?.slice(0, 4)).filter(Boolean));
  const yearsOfPayments = yearSet.size;

  // Annual aggregated dividend chart data
  const annualDivMap: Record<string, number> = {};
  divs.forEach(d => {
    const yr = d.ex_dividend_date?.slice(0, 4);
    if (yr && nn(d.amount) != null) annualDivMap[yr] = (annualDivMap[yr] ?? 0) + nn(d.amount)!;
  });
  const chartData = Object.entries(annualDivMap).sort(([a], [b]) => a.localeCompare(b)).map(([year, total]) => ({ year, total: parseFloat(total.toFixed(4)) }));

  // YoY div growth
  const latestAnnual = chartData[chartData.length - 1];
  const prevAnnual = chartData[chartData.length - 2];
  const divGrowth = latestAnnual && prevAnnual && prevAnnual.total > 0
    ? ((latestAnnual.total - prevAnnual.total) / prevAnnual.total) * 100
    : null;

  const safety = paysDividends ? computeSafety(payoutRatio, fcfCoverage, yearsOfPayments) : null;
  const safetyColor = safety === 'Safe' ? '#10b981' : safety === 'Watch' ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px', color: '#e2e8f0', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700 }}>
          Dividend Safety Dashboard
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Assess whether a dividend is sustainable — payout ratio, FCF coverage, and payment history. Critical for Wheel strategy stock selection.
        </p>
      </div>

      {/* Why it matters */}
      <Card style={{ marginBottom: 20, background: '#10b98110', borderColor: '#10b98140' }}>
        <div style={{ color: '#10b981', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Why Dividend Safety Matters for Options Traders</div>
        <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>
          Wheel strategy traders target stocks with <strong style={{ color: '#e2e8f0' }}>safe, growing dividends</strong> — you collect option premium
          plus the dividend yield. A dividend cut is catastrophic: the stock drops 5–15% instantly, wiping out months of premium.
          FCF coverage &gt;1.5× and payout ratio &lt;65% are the two most reliable safety indicators.
        </div>
      </Card>

      {showKeyInput ? (
        <Card style={{ marginBottom: 24, borderColor: '#6366f140' }}>
          <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: 8 }}>Alpha Vantage API Key Required</div>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 12px' }}>
            Free key at <strong style={{ color: '#e2e8f0' }}>alphavantage.co/support/#api-key</strong> — 25 calls/day. Saved in your browser.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Paste your Alpha Vantage API key…"
              onKeyDown={e => e.key === 'Enter' && saveKey((e.target as HTMLInputElement).value.trim())}
              defaultValue={apiKey} id="ds-key-input" />
            <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => saveKey((document.getElementById('ds-key-input') as HTMLInputElement).value.trim())}>Save Key</button>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input value={inputVal} onChange={e => setInputVal(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && search(inputVal, apiKey)}
                placeholder="Enter ticker (e.g. JNJ, KO, ABBV)" style={inputStyle} />
            </div>
            <button onClick={() => search(inputVal, apiKey)} disabled={loading}
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {loading ? 'Loading… (~3s)' : 'Analyze'}
            </button>
            <button onClick={() => setShowKeyInput(true)}
              style={{ background: 'none', color: '#64748b', border: '1px solid #2a2d3e', borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer' }}>
              ⚙ API Key
            </button>
          </div>
          {loading && <div style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>Fetching 3 data sources (dividends, cash flow, income)…</div>}
          {error && <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {error}</div>}
          {ticker && !error && !loading && <div style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Showing <span style={{ color: '#818cf8', fontWeight: 700 }}>{ticker}</span></div>}
        </Card>
      )}

      {data && (
        <>
          {!paysDividends ? (
            <Card style={{ background: '#f59e0b10', borderColor: '#f59e0b40' }}>
              <div style={{ color: '#fcd34d', fontSize: 15, fontWeight: 600 }}>{ticker} does not pay a dividend</div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
                No dividend history found. This stock may still be suitable for the Wheel via premium only, or consider other dividend-paying stocks in the same sector.
              </div>
            </Card>
          ) : (
            <>
              {/* Safety badge */}
              {safety && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ background: safetyColor + '20', border: `2px solid ${safetyColor}`, borderRadius: 12, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: safetyColor }} />
                      <span style={{ color: safetyColor, fontSize: 20, fontWeight: 700 }}>{safety}</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>
                      {safety === 'Safe' && 'Dividend appears well-covered by both earnings and free cash flow.'}
                      {safety === 'Watch' && 'Dividend may be stretched — monitor payout ratio and FCF trends closely.'}
                      {safety === 'At Risk' && 'Dividend is at risk of a cut — payout ratio exceeds earnings or FCF.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Key metrics */}
              <div style={{ marginBottom: 24 }}>
                <SectionHeader title="Dividend Metrics" color="#10b981" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'ANNUAL DPS (LTM)', value: annualDPS > 0 ? '$' + annualDPS.toFixed(4) : '—', color: '#10b981' },
                    {
                      label: 'PAYOUT RATIO', value: payoutRatio != null ? (payoutRatio * 100).toFixed(1) + '%' : '—',
                      color: payoutRatio == null ? '#94a3b8' : payoutRatio < 0.60 ? '#10b981' : payoutRatio < 0.80 ? '#f59e0b' : '#ef4444',
                      sub: '% of net income',
                    },
                    {
                      label: 'FCF COVERAGE', value: fcfCoverage != null ? fcfCoverage.toFixed(2) + 'x' : '—',
                      color: fcfCoverage == null ? '#94a3b8' : fcfCoverage >= 1.5 ? '#10b981' : fcfCoverage >= 1.0 ? '#f59e0b' : '#ef4444',
                      sub: 'FCF ÷ dividends paid',
                    },
                    { label: 'FREE CASH FLOW', value: fcf != null ? fmtMoney(fcf) : '—', color: fcf != null && fcf > 0 ? '#10b981' : '#ef4444' },
                    { label: 'DIVIDENDS PAID', value: divsPaidCF != null ? fmtMoney(divsPaidCF) : '—', color: '#e2e8f0' },
                    { label: 'YoY DIV GROWTH', value: divGrowth != null ? (divGrowth > 0 ? '+' : '') + divGrowth.toFixed(1) + '%' : '—', color: divGrowth != null ? (divGrowth > 0 ? '#10b981' : '#ef4444') : '#94a3b8' },
                    { label: 'YEARS OF PAYMENTS', value: yearsOfPayments.toString(), color: yearsOfPayments >= 10 ? '#10b981' : yearsOfPayments >= 5 ? '#f59e0b' : '#ef4444', sub: yearsOfPayments >= 25 ? 'Dividend Aristocrat candidate' : undefined },
                    { label: 'PAYMENTS TRACKED', value: divs.length.toString(), color: '#e2e8f0' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>{m.label}</div>
                      <div style={{ color: m.color ?? '#e2e8f0', fontSize: 20, fontWeight: 700 }}>{m.value}</div>
                      {'sub' in m && m.sub && <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{m.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmarks */}
              <Card style={{ marginBottom: 24, background: '#0f1117' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>PAYOUT RATIO BENCHMARKS</div>
                    {[['< 40%', 'Very safe — room to grow', '#10b981'], ['40–60%', 'Safe for most sectors', '#10b981'], ['60–75%', 'Elevated — watch closely', '#f59e0b'], ['75–100%', 'Stretched — vulnerable to earnings miss', '#ef4444'], ['> 100%', 'Paid from capital, unsustainable', '#ef4444']].map(([range, label, color]) => (
                      <div key={range} style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'center' }}>
                        <span style={{ color, fontFamily: 'monospace', fontSize: 12, minWidth: 65 }}>{range}</span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>FCF COVERAGE BENCHMARKS</div>
                    {[['> 2.0×', 'Very safe, growing dividend likely', '#10b981'], ['1.5–2.0×', 'Safe', '#10b981'], ['1.0–1.5×', 'Adequate — monitor FCF trend', '#f59e0b'], ['0.5–1.0×', 'Dividend straining FCF', '#ef4444'], ['< 0.5×', 'Dividend likely unsustainable from FCF', '#ef4444']].map(([range, label, color]) => (
                      <div key={range} style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'center' }}>
                        <span style={{ color, fontFamily: 'monospace', fontSize: 12, minWidth: 65 }}>{range}</span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Annual dividend chart */}
              {chartData.length > 1 && (
                <div style={{ marginBottom: 24 }}>
                  <SectionHeader title="Annual Dividend Per Share History" color="#10b981" />
                  <Card>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                        <XAxis dataKey="year" {...CHART_STYLE.xAxis} />
                        <YAxis {...CHART_STYLE.yAxis} tickFormatter={v => '$' + v.toFixed(2)} />
                        <Tooltip {...CHART_STYLE.tooltip} formatter={(v: unknown) => ['$' + (v as number).toFixed(4), 'Annual DPS']} />
                        <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} fill="url(#divGrad)" dot={{ fill: '#10b981', r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              )}

              {/* Recent dividend payments */}
              <div>
                <SectionHeader title="Recent Dividend Payments" color="#10b981" />
                <Card style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #2a2d3e' }}>
                          {['Ex-Dividend Date', 'Amount / Share', 'YoY Change'].map(h => (
                            <th key={h} style={{ textAlign: h === 'Ex-Dividend Date' ? 'left' : 'right', padding: '12px 16px', color: '#64748b', fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {divs.slice(0, 16).map((d, i) => {
                          const amount = nn(d.amount);
                          const prevSame = divs[i + 4];
                          const prevAmt = prevSame ? nn(prevSame.amount) : null;
                          const chg = amount != null && prevAmt != null && prevAmt > 0 ? ((amount - prevAmt) / prevAmt) * 100 : null;
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #1e2130' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#1f2335')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '10px 16px', color: '#e2e8f0' }}>{d.ex_dividend_date}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>
                                {amount != null ? '$' + amount.toFixed(4) : '—'}
                              </td>
                              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                {chg != null ? (
                                  <span style={{ color: chg > 0 ? '#10b981' : chg < 0 ? '#ef4444' : '#64748b', fontSize: 12, fontWeight: 600 }}>
                                    {chg > 0 ? '+' : ''}{chg.toFixed(1)}% YoY
                                  </span>
                                ) : <span style={{ color: '#475569', fontSize: 12 }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
