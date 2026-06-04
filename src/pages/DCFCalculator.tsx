import { useState, useCallback, useMemo } from 'react';
import { avFetch, LS_AV_KEY, nn, fmtMoney, sleep } from '../lib/avClient';

interface CashFlowReport {
  fiscalDateEnding: string;
  operatingCashflow: string;
  capitalExpenditures: string;
  dividendPayout: string;
}

interface DCFData {
  name: string;
  sector: string;
  sharesOutstanding: number | null;
  analystTarget: number | null;
  baseFCF: number | null;
  fcfHistory: { year: string; fcf: number }[];
  recentReports: CashFlowReport[];
}

async function fetchDCFData(ticker: string, apiKey: string): Promise<DCFData> {
  const sym = ticker.toUpperCase();
  const ov = await avFetch('OVERVIEW', sym, apiKey);
  await sleep(1200);
  const cf = await avFetch('CASH_FLOW', sym, apiKey);

  const overview = ov as Record<string, string>;
  const reports = ((cf.annualReports ?? []) as CashFlowReport[]).slice(0, 6);

  const sharesOutstanding = nn(overview.SharesOutstanding);
  const analystTarget = nn(overview.AnalystTargetPrice);

  const fcfHistory = reports.map(r => {
    const ocf = nn(r.operatingCashflow);
    const capex = nn(r.capitalExpenditures);
    const fcf = ocf != null && capex != null ? ocf - Math.abs(capex) : null;
    return { year: r.fiscalDateEnding?.slice(0, 4) ?? '', fcf };
  }).filter((r): r is { year: string; fcf: number } => r.fcf != null);

  const latestReport = reports[0];
  let baseFCF: number | null = null;
  if (latestReport) {
    const ocf = nn(latestReport.operatingCashflow);
    const capex = nn(latestReport.capitalExpenditures);
    if (ocf != null && capex != null) baseFCF = ocf - Math.abs(capex);
  }

  return {
    name: overview.Name ?? sym,
    sector: overview.Sector ?? '',
    sharesOutstanding,
    analystTarget,
    baseFCF,
    fcfHistory: fcfHistory.reverse(),
    recentReports: reports,
  };
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt: fmtFn }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'var(--text)', fontSize: 13 }}>{label}</span>
        <span style={{ color: '#818cf8', fontWeight: 700, fontSize: 14 }}>{fmtFn(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#6366f1' }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 14px', color: 'var(--text-h)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

function computeDCF(baseFCF: number, growthRate: number, terminalGrowth: number, discountRate: number, shares: number | null) {
  if (discountRate <= terminalGrowth) return null;
  const projectedFCFs: number[] = [];
  let fcf = baseFCF;
  for (let t = 1; t <= 5; t++) {
    fcf = fcf * (1 + growthRate);
    projectedFCFs.push(fcf);
  }
  const terminalValue = (projectedFCFs[4] * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const pvFCFs = projectedFCFs.map((f, i) => f / Math.pow(1 + discountRate, i + 1));
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, 5);
  const enterpriseValue = pvFCFs.reduce((s, v) => s + v, 0) + pvTerminal;
  const intrinsicPerShare = shares && shares > 0 ? enterpriseValue / shares : null;
  return { projectedFCFs, terminalValue, pvFCFs, pvTerminal, enterpriseValue, intrinsicPerShare };
}

export function DCFCalculator() {
  const [inputVal, setInputVal] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_AV_KEY) ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(LS_AV_KEY));
  const [data, setData] = useState<DCFData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticker, setTicker] = useState('');

  const [growthRate, setGrowthRate] = useState(0.10);
  const [terminalGrowth, setTerminalGrowth] = useState(0.03);
  const [discountRate, setDiscountRate] = useState(0.10);
  const [currentPrice, setCurrentPrice] = useState('');

  const saveKey = (k: string) => {
    setApiKey(k);
    if (k) { localStorage.setItem(LS_AV_KEY, k); setShowKeyInput(false); }
    else localStorage.removeItem(LS_AV_KEY);
  };

  const search = useCallback(async (sym: string, key: string) => {
    if (!sym.trim() || !key.trim()) return;
    setLoading(true); setError('');
    try {
      const d = await fetchDCFData(sym.trim(), key.trim());
      setData(d);
      setTicker(sym.trim().toUpperCase());
    } catch (e) {
      setError((e as Error).message ?? 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const baseFCF = data?.baseFCF ?? null;
  const shares = data?.sharesOutstanding ?? null;

  const dcfResult = useMemo(() => {
    if (baseFCF == null) return null;
    if (baseFCF <= 0) return null;
    return computeDCF(baseFCF, growthRate, terminalGrowth, discountRate, shares);
  }, [baseFCF, growthRate, terminalGrowth, discountRate, shares]);

  const price = nn(currentPrice) ?? nn(data?.analystTarget?.toString() ?? null);
  const marginOfSafety = dcfResult?.intrinsicPerShare && price
    ? ((dcfResult.intrinsicPerShare - price) / price) * 100
    : null;

  // Sensitivity table: rows = discount rate, cols = growth rate
  const sensitivityRates = [0.07, 0.09, 0.11, 0.13, 0.15];
  const sensitivityGrowths = [0.05, 0.10, 0.15, 0.20, 0.25];

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px', color: 'var(--text-h)', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700 }}>
          DCF Intrinsic Value Calculator
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Discounted cash flow model using live FCF data. Adjust growth and discount assumptions to find a fair value range.
        </p>
      </div>

      {/* Methodology note */}
      <Card style={{ marginBottom: 20, background: '#6366f110', border: '1px solid #6366f140' }}>
        <div style={{ color: '#818cf8', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Model Methodology</div>
        <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
          5-year projection of Free Cash Flow (OCF − CapEx), discounted at the WACC. Terminal value uses Gordon Growth Model at end of Year 5.
          This is a <strong style={{ color: 'var(--text-h)' }}>simplified equity DCF</strong> — it does not subtract net debt from enterprise value.
          Use the output as a <strong style={{ color: 'var(--text-h)' }}>range, not a price target</strong>. Negative or near-zero FCF companies are not suited for this model.
        </div>
      </Card>

      {showKeyInput ? (
        <Card style={{ marginBottom: 24, border: '1px solid #6366f140' }}>
          <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: 8 }}>Alpha Vantage API Key Required</div>
          <p style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 12px' }}>
            Free key at <strong style={{ color: 'var(--text-h)' }}>alphavantage.co/support/#api-key</strong> — 25 calls/day. Saved in your browser.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Paste your Alpha Vantage API key…"
              onKeyDown={e => e.key === 'Enter' && saveKey((e.target as HTMLInputElement).value.trim())}
              defaultValue={apiKey} id="dcf-key-input" />
            <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => saveKey((document.getElementById('dcf-key-input') as HTMLInputElement).value.trim())}>Save Key</button>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input value={inputVal} onChange={e => setInputVal(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && search(inputVal, apiKey)}
                placeholder="Enter ticker (e.g. AAPL, MSFT)" style={inputStyle} />
            </div>
            <button onClick={() => search(inputVal, apiKey)} disabled={loading}
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {loading ? 'Loading…' : 'Fetch Data'}
            </button>
            <button onClick={() => setShowKeyInput(true)}
              style={{ background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer' }}>
              ⚙ API Key
            </button>
          </div>
          {error && <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {error}</div>}
          {ticker && !error && <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>Showing <span style={{ color: '#818cf8', fontWeight: 700 }}>{ticker}</span> · {data?.name}</div>}
        </Card>
      )}

      {data && (
        <>
          {/* FCF history */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Free Cash Flow History" color="#10b981" />
            <Card>
              {data.fcfHistory.length > 0 ? (
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {data.fcfHistory.map(({ year, fcf }, i) => {
                    const isLatest = i === data.fcfHistory.length - 1;
                    return (
                      <div key={year} style={{ textAlign: 'center', minWidth: 80 }}>
                        <div style={{ color: fcf > 0 ? '#10b981' : '#ef4444', fontSize: 15, fontWeight: 700 }}>{fmtMoney(fcf)}</div>
                        <div style={{ color: isLatest ? '#818cf8' : 'var(--text-muted)', fontSize: 11, marginTop: 4, fontWeight: isLatest ? 700 : 400 }}>
                          {year}{isLatest ? ' ★' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No FCF history available.</div>}

              {baseFCF != null && baseFCF <= 0 && (
                <div style={{ marginTop: 16, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13 }}>
                  ⚠ Latest FCF is negative ({fmtMoney(baseFCF)}). DCF model requires positive FCF. Use a forward FCF estimate below or try a different period.
                </div>
              )}
            </Card>
          </div>

          {/* Assumptions */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Model Assumptions" color="#6366f1" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Card>
                <div style={{ display: 'grid', gap: 20 }}>
                  <Slider label="Revenue/FCF Growth (Yr 1–5)" value={growthRate} min={0.01} max={0.40} step={0.01}
                    onChange={setGrowthRate} fmt={v => (v * 100).toFixed(0) + '%/yr'} />
                  <Slider label="Terminal Growth Rate" value={terminalGrowth} min={0.01} max={0.07} step={0.005}
                    onChange={setTerminalGrowth} fmt={v => (v * 100).toFixed(1) + '%'} />
                  <Slider label="Discount Rate (WACC)" value={discountRate} min={0.05} max={0.20} step={0.005}
                    onChange={setDiscountRate} fmt={v => (v * 100).toFixed(1) + '%'} />
                </div>
              </Card>
              <Card>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Base FCF (auto-filled)</div>
                    <div style={{ color: baseFCF != null && baseFCF > 0 ? '#10b981' : '#ef4444', fontSize: 20, fontWeight: 700 }}>
                      {baseFCF != null ? fmtMoney(baseFCF) : '—'}
                    </div>
                    <div style={{ color: '#475569', fontSize: 11 }}>Most recent annual OCF − |CapEx|</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>Current Price (for margin of safety)</div>
                    <input value={currentPrice} onChange={e => setCurrentPrice(e.target.value)}
                      placeholder={data.analystTarget ? `Analyst target: $${data.analystTarget.toFixed(2)}` : 'e.g. 185.00'}
                      style={{ ...inputStyle, fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>Shares Outstanding</div>
                    <div style={{ color: 'var(--text-h)', fontSize: 14, fontWeight: 600 }}>
                      {shares ? (shares / 1e9 >= 1 ? (shares / 1e9).toFixed(2) + 'B' : (shares / 1e6).toFixed(0) + 'M') : '—'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* DCF result */}
          {dcfResult && (
            <>
              <div style={{ marginBottom: 24 }}>
                <SectionHeader title="Valuation Result" color="#f59e0b" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>INTRINSIC VALUE / SHARE</div>
                    <div style={{ color: '#f59e0b', fontSize: 28, fontWeight: 700 }}>
                      {dcfResult.intrinsicPerShare != null ? '$' + dcfResult.intrinsicPerShare.toFixed(2) : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>ENTERPRISE VALUE</div>
                    <div style={{ color: 'var(--text-h)', fontSize: 20, fontWeight: 700 }}>{fmtMoney(dcfResult.enterpriseValue)}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>PV OF TERMINAL VALUE</div>
                    <div style={{ color: 'var(--text-h)', fontSize: 20, fontWeight: 700 }}>{fmtMoney(dcfResult.pvTerminal)}</div>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
                      {((dcfResult.pvTerminal / dcfResult.enterpriseValue) * 100).toFixed(0)}% of total value
                    </div>
                  </div>
                  {marginOfSafety != null && (
                    <div style={{ background: marginOfSafety > 20 ? '#10b98115' : marginOfSafety < -20 ? '#ef444415' : '#f59e0b15', border: `1px solid ${marginOfSafety > 20 ? '#10b98140' : marginOfSafety < -20 ? '#ef444440' : '#f59e0b40'}`, borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>MARGIN OF SAFETY</div>
                      <div style={{ color: marginOfSafety > 20 ? '#10b981' : marginOfSafety < -20 ? '#ef4444' : '#f59e0b', fontSize: 28, fontWeight: 700 }}>
                        {marginOfSafety > 0 ? '+' : ''}{marginOfSafety.toFixed(1)}%
                      </div>
                      <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>vs ${price?.toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {/* Projected FCF table */}
                <Card style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Terminal'].map(h => (
                            <th key={h} style={{ textAlign: h ? 'right' : 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 16px', color: 'var(--text)' }}>Projected FCF</td>
                          {dcfResult.projectedFCFs.map((v, i) => <td key={i} style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-h)', fontFamily: 'monospace' }}>{fmtMoney(v)}</td>)}
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-h)', fontFamily: 'monospace' }}>{fmtMoney(dcfResult.terminalValue)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px 16px', color: 'var(--text)' }}>Present Value</td>
                          {dcfResult.pvFCFs.map((v, i) => <td key={i} style={{ padding: '10px 16px', textAlign: 'right', color: '#818cf8', fontFamily: 'monospace' }}>{fmtMoney(v)}</td>)}
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#818cf8', fontFamily: 'monospace' }}>{fmtMoney(dcfResult.pvTerminal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Sensitivity table */}
              <div style={{ marginBottom: 24 }}>
                <SectionHeader title="Intrinsic Value Sensitivity" color="#8b5cf6" />
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>
                  Value per share across different growth and discount rate assumptions. Green = above current price, red = below.
                </p>
                <Card style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>WACC ↓ / Growth →</th>
                          {sensitivityGrowths.map(g => (
                            <th key={g} style={{ padding: '10px 14px', textAlign: 'right', color: g === growthRate ? '#818cf8' : 'var(--text-muted)', fontWeight: g === growthRate ? 700 : 500 }}>
                              {(g * 100).toFixed(0)}%
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sensitivityRates.map(r => (
                          <tr key={r} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 14px', color: r === discountRate ? '#818cf8' : 'var(--text)', fontWeight: r === discountRate ? 700 : 400 }}>
                              {(r * 100).toFixed(0)}%
                            </td>
                            {sensitivityGrowths.map(g => {
                              const res = baseFCF != null && baseFCF > 0 ? computeDCF(baseFCF, g, terminalGrowth, r, shares) : null;
                              const iv = res?.intrinsicPerShare;
                              const isSelected = Math.abs(r - discountRate) < 0.001 && Math.abs(g - growthRate) < 0.001;
                              const above = iv != null && price != null ? iv > price : null;
                              return (
                                <td key={g} style={{
                                  padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace',
                                  color: iv == null ? '#475569' : above ? '#10b981' : '#ef4444',
                                  background: isSelected ? '#6366f120' : 'transparent',
                                  fontWeight: isSelected ? 700 : 400,
                                }}>
                                  {iv != null ? '$' + iv.toFixed(0) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </>
          )}

          {baseFCF != null && baseFCF <= 0 && (
            <Card style={{ background: '#f59e0b10', border: '1px solid #f59e0b40' }}>
              <div style={{ color: '#fcd34d', fontSize: 14 }}>
                DCF model requires positive FCF. {ticker} had negative FCF of {fmtMoney(baseFCF)} in the most recent year. Consider using a forward FCF estimate or a different valuation approach (EV/Revenue, EV/EBITDA) for this company.
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
