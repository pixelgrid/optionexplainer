import { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts';
import { avFetch, LS_AV_KEY, sleep } from '../lib/avClient';

interface QuarterlyEarning {
  fiscalDateEnding: string;
  reportedDate: string;
  reportedEPS: string;
  estimatedEPS: string;
  surprise: string;
  surprisePercentage: string;
}

interface AnnualEarning {
  fiscalDateEnding: string;
  reportedEPS: string;
}

interface EarningsData {
  symbol: string;
  quarterly: QuarterlyEarning[];
  annual: AnnualEarning[];
}

async function fetchEarnings(ticker: string, apiKey: string): Promise<EarningsData> {
  const data = await avFetch('EARNINGS', ticker.toUpperCase(), apiKey);
  await sleep(300);
  return {
    symbol: (data.symbol as string) ?? ticker.toUpperCase(),
    quarterly: (data.quarterlyEarnings as QuarterlyEarning[]) ?? [],
    annual: (data.annualEarnings as AnnualEarning[]) ?? [],
  };
}

function nn(v: string): number | null {
  if (!v || v === 'None') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
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

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 14px', color: 'var(--text-h)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
};

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: 'var(--border)' },
  xAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  yAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  tooltip: { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 } },
};

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ color: color ?? 'var(--text-h)', fontSize: 24, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function EarningsSurprises() {
  const [inputVal, setInputVal] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_AV_KEY) ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(LS_AV_KEY));
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saveKey = (k: string) => {
    setApiKey(k);
    if (k) { localStorage.setItem(LS_AV_KEY, k); setShowKeyInput(false); }
    else localStorage.removeItem(LS_AV_KEY);
  };

  const search = useCallback(async (sym: string, key: string) => {
    if (!sym.trim() || !key.trim()) return;
    setLoading(true); setError('');
    try {
      const d = await fetchEarnings(sym.trim(), key.trim());
      setData(d);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute stats from quarterly data
  const quarters = data?.quarterly?.slice(0, 20) ?? [];
  const withEstimates = quarters.filter(q => nn(q.estimatedEPS) !== null && nn(q.reportedEPS) !== null);
  const beats = withEstimates.filter(q => (nn(q.surprisePercentage) ?? 0) > 0);
  const misses = withEstimates.filter(q => (nn(q.surprisePercentage) ?? 0) < 0);
  const beatRate = withEstimates.length > 0 ? (beats.length / withEstimates.length) * 100 : null;
  const avgSurprise = withEstimates.length > 0
    ? withEstimates.reduce((s, q) => s + (nn(q.surprisePercentage) ?? 0), 0) / withEstimates.length
    : null;

  // Beat/miss streak
  let streak = 0;
  let streakType: 'beat' | 'miss' | null = null;
  for (const q of withEstimates) {
    const sp = nn(q.surprisePercentage) ?? 0;
    if (streak === 0) { streakType = sp > 0 ? 'beat' : 'miss'; streak = 1; }
    else if ((sp > 0 && streakType === 'beat') || (sp <= 0 && streakType === 'miss')) streak++;
    else break;
  }

  // Chart data (last 12 quarters, reversed so oldest is left)
  const chartData = withEstimates.slice(0, 12).reverse().map(q => ({
    period: q.fiscalDateEnding.slice(0, 7),
    surprise: parseFloat((nn(q.surprisePercentage) ?? 0).toFixed(2)),
    reported: nn(q.reportedEPS),
    estimated: nn(q.estimatedEPS),
  }));

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px', color: 'var(--text-h)', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700 }}>
          Earnings Surprise Tracker
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Historical EPS beats and misses, surprise magnitude, and consistency — essential context before trading options around earnings.
        </p>
      </div>

      {/* API key setup */}
      {showKeyInput ? (
        <Card style={{ marginBottom: 24, border: '1px solid #6366f140' }}>
          <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: 8 }}>Alpha Vantage API Key Required</div>
          <p style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 12px' }}>
            Free key at <strong style={{ color: 'var(--text-h)' }}>alphavantage.co/support/#api-key</strong> — 25 calls/day, no credit card. Saved locally in your browser.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Paste your Alpha Vantage API key…"
              onKeyDown={e => e.key === 'Enter' && saveKey((e.target as HTMLInputElement).value.trim())}
              defaultValue={apiKey} id="es-key-input" />
            <button style={btnStyle} onClick={() => saveKey((document.getElementById('es-key-input') as HTMLInputElement).value.trim())}>Save Key</button>
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input value={inputVal} onChange={e => setInputVal(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && search(inputVal, apiKey)}
                placeholder="Enter ticker (e.g. AAPL, MSFT, NVDA)" style={inputStyle} />
            </div>
            <button onClick={() => search(inputVal, apiKey)} disabled={loading}
              style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Loading…' : 'Search'}
            </button>
            <button onClick={() => setShowKeyInput(true)}
              style={{ background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer' }}>
              ⚙ API Key
            </button>
          </div>
          {error && <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {error}</div>}
        </Card>
      )}

      {/* Educational intro */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ color: '#818cf8', fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Why Earnings Surprises Matter for Options</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { title: 'Consistent beaters → sell premium', body: 'A stock that beats 80%+ of quarters with small surprises is ideal for short straddles/strangles. IV overestimates the actual move, creating edge.' },
            { title: 'Volatile misses → avoid short vol', body: 'Stocks that miss randomly by large margins crush short options positions. Check the surprise % distribution before selling.' },
            { title: 'Beat streak signals momentum', body: 'Multi-quarter beat streaks often accompany guidance raises, which structurally expand multiples — good for long calls going into earnings.' },
          ].map(item => (
            <div key={item.title} style={{ background: '#6366f110', border: '1px solid #6366f130', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#818cf8', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{item.title.toUpperCase()}</div>
              <div style={{ color: 'var(--text)', fontSize: 13 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </Card>

      {data && (
        <>
          {/* Summary stats */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title={`${data.symbol} — Earnings Summary`} color="#6366f1" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
              <StatBox label="BEAT RATE" value={beatRate != null ? beatRate.toFixed(0) + '%' : '—'}
                sub={`${beats.length} of ${withEstimates.length} qtrs`}
                color={beatRate != null ? (beatRate >= 70 ? '#10b981' : beatRate >= 50 ? '#f59e0b' : '#ef4444') : undefined} />
              <StatBox label="AVG SURPRISE" value={avgSurprise != null ? (avgSurprise > 0 ? '+' : '') + avgSurprise.toFixed(1) + '%' : '—'}
                color={avgSurprise != null ? (avgSurprise > 2 ? '#10b981' : avgSurprise > 0 ? '#f59e0b' : '#ef4444') : undefined} />
              <StatBox label="CURRENT STREAK" value={streak > 0 ? `${streak}Q` : '—'}
                sub={streakType ? streakType.toUpperCase() + 'S' : undefined}
                color={streakType === 'beat' ? '#10b981' : streakType === 'miss' ? '#ef4444' : undefined} />
              <StatBox label="QUARTERS TRACKED" value={withEstimates.length.toString()} sub="with estimates" />
              <StatBox label="BEATS / MISSES" value={`${beats.length} / ${misses.length}`} />
            </div>
          </div>

          {/* Surprise chart */}
          {chartData.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <SectionHeader title="EPS Surprise % — Last 12 Quarters" color="#6366f1" />
              <Card>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                    <XAxis dataKey="period" {...CHART_STYLE.xAxis} />
                    <YAxis {...CHART_STYLE.yAxis} tickFormatter={v => v + '%'} />
                    <Tooltip {...CHART_STYLE.tooltip} formatter={(v: unknown) => [(v as number).toFixed(2) + '%', 'Surprise']} />
                    <ReferenceLine y={0} stroke="var(--border)" strokeWidth={2} />
                    <Bar dataKey="surprise" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.surprise >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* EPS table */}
          <div style={{ marginBottom: 24 }}>
            <SectionHeader title="Quarterly EPS Detail" color="#6366f1" />
            <Card style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Period', 'Report Date', 'Estimated EPS', 'Reported EPS', 'Surprise', 'Surprise %'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Period' || h === 'Report Date' ? 'left' : 'right', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.slice(0, 16).map((q, i) => {
                      const sp = nn(q.surprisePercentage);
                      const beat = sp != null && sp > 0;
                      const miss = sp != null && sp < 0;
                      const color = beat ? '#10b981' : miss ? '#ef4444' : 'var(--text)';
                      const reported = nn(q.reportedEPS);
                      const estimated = nn(q.estimatedEPS);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 16px', color: 'var(--text-h)', fontWeight: 600 }}>{q.fiscalDateEnding?.slice(0, 7)}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{q.reportedDate ?? '—'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text)', fontFamily: 'monospace' }}>
                            {estimated != null ? '$' + estimated.toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-h)', fontFamily: 'monospace', fontWeight: 600 }}>
                            {reported != null ? '$' + reported.toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color, fontFamily: 'monospace' }}>
                            {nn(q.surprise) != null ? (nn(q.surprise)! > 0 ? '+' : '') + nn(q.surprise)!.toFixed(2) : '—'}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            {sp != null ? (
                              <span style={{ background: beat ? '#10b98120' : miss ? '#ef444420' : '#6366f120', color, border: `1px solid ${beat ? '#10b98140' : miss ? '#ef444440' : '#6366f140'}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                                {sp > 0 ? '+' : ''}{sp.toFixed(1)}%
                              </span>
                            ) : <span style={{ color: '#475569' }}>n/a</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Annual EPS trend */}
          {data.annual.length > 0 && (
            <div>
              <SectionHeader title="Annual EPS History" color="#6366f1" />
              <Card>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {data.annual.slice(0, 8).reverse().map((a, i) => {
                    const eps = nn(a.reportedEPS);
                    return (
                      <div key={i} style={{ textAlign: 'center', minWidth: 80 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{a.fiscalDateEnding?.slice(0, 4)}</div>
                        <div style={{ color: eps != null && eps > 0 ? 'var(--text-h)' : '#ef4444', fontSize: 18, fontWeight: 700 }}>
                          {eps != null ? (eps > 0 ? '$' : '-$') + Math.abs(eps).toFixed(2) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
