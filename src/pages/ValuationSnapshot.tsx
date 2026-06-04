import { useState, useCallback } from 'react';
import { avFetch, LS_AV_KEY, nn, sleep } from '../lib/avClient';

interface OverviewData {
  Name: string; Exchange: string; Sector: string; Industry: string;
  MarketCapitalization: string; SharesOutstanding: string;
  TrailingPE: string; ForwardPE: string; PEGRatio: string;
  PriceToBookRatio: string; PriceToSalesRatioTTM: string;
  EVToRevenue: string; EVToEBITDA: string;
  EPS: string; DilutedEPSTTM: string;
  DividendYield: string; DividendPerShare: string;
  ProfitMargin: string; OperatingMarginTTM: string; GrossProfitTTM: string;
  ReturnOnAssetsTTM: string; ReturnOnEquityTTM: string;
  RevenueTTM: string; RevenuePerShareTTM: string;
  QuarterlyEarningsGrowthYOY: string; QuarterlyRevenueGrowthYOY: string;
  AnalystTargetPrice: string; Beta: string;
  '52WeekHigh': string; '52WeekLow': string;
  '50DayMovingAverage': string; '200DayMovingAverage': string;
  EBITDA: string;
}

interface QuoteData {
  '05. price': string; '09. change': string; '10. change percent': string;
  '06. volume': string; '07. latest trading day': string;
}

async function fetchSnapshot(ticker: string, apiKey: string): Promise<{ overview: OverviewData; price: number | null }> {
  const sym = ticker.toUpperCase();
  const ov = await avFetch('OVERVIEW', sym, apiKey);
  await sleep(1200);
  const quote = await avFetch('GLOBAL_QUOTE', sym, apiKey);
  const overview = ov as unknown as OverviewData;
  const q = (quote['Global Quote'] ?? {}) as QuoteData;
  const price = nn(q['05. price']);
  return { overview, price };
}

function fmt(v: string | undefined, suffix = '', mult = 1): string {
  const n = nn(v ?? null);
  if (n == null) return '—';
  return (n * mult).toFixed(2) + suffix;
}

function fmtBig(v: string | undefined): string {
  const n = nn(v ?? null);
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return '$' + (abs / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return '$' + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return '$' + (abs / 1e6).toFixed(0) + 'M';
  return '$' + abs.toFixed(0);
}

// Color thresholds — not sector-adjusted, general guidance
function peColor(pe: number | null): string {
  if (pe == null) return 'var(--text)';
  if (pe < 0) return '#ef4444';
  if (pe < 15) return '#10b981';
  if (pe < 25) return '#f59e0b';
  if (pe < 40) return '#fb923c';
  return '#ef4444';
}
function pbColor(pb: number | null): string {
  if (pb == null) return 'var(--text)';
  if (pb < 1) return '#3b82f6';
  if (pb < 3) return '#10b981';
  if (pb < 6) return '#f59e0b';
  return '#ef4444';
}
function psColor(ps: number | null): string {
  if (ps == null) return 'var(--text)';
  if (ps < 2) return '#10b981';
  if (ps < 6) return '#f59e0b';
  if (ps < 12) return '#fb923c';
  return '#ef4444';
}
function evEbitdaColor(v: number | null): string {
  if (v == null) return 'var(--text)';
  if (v < 0) return 'var(--text)';
  if (v < 10) return '#10b981';
  if (v < 20) return '#f59e0b';
  if (v < 35) return '#fb923c';
  return '#ef4444';
}
function marginColor(v: number | null): string {
  if (v == null) return 'var(--text)';
  if (v > 0.20) return '#10b981';
  if (v > 0.10) return '#f59e0b';
  if (v > 0) return '#fb923c';
  return '#ef4444';
}
function roeColor(v: number | null): string {
  if (v == null) return 'var(--text)';
  if (v > 0.20) return '#10b981';
  if (v > 0.10) return '#f59e0b';
  return '#ef4444';
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

function MetricTile({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ color: color ?? 'var(--text-h)', fontSize: 20, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 14px', color: 'var(--text-h)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export function ValuationSnapshot() {
  const [inputVal, setInputVal] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_AV_KEY) ?? '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(LS_AV_KEY));
  const [result, setResult] = useState<{ overview: OverviewData; price: number | null } | null>(null);
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
      const d = await fetchSnapshot(sym.trim(), key.trim());
      if (!d.overview.Name || d.overview.Name === 'None') throw new Error(`No data found for ${sym.toUpperCase()}`);
      setResult(d);
      setTicker(sym.trim().toUpperCase());
    } catch (e) {
      setError((e as Error).message ?? 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  const ov = result?.overview;
  const price = result?.price;

  const pe = nn(ov?.TrailingPE ?? null);
  const fpe = nn(ov?.ForwardPE ?? null);
  const pb = nn(ov?.PriceToBookRatio ?? null);
  const ps = nn(ov?.PriceToSalesRatioTTM ?? null);
  const peg = nn(ov?.PEGRatio ?? null);
  const evEbitda = nn(ov?.EVToEBITDA ?? null);
  const high52 = nn(ov?.['52WeekHigh'] ?? null);
  const low52 = nn(ov?.['52WeekLow'] ?? null);
  const target = nn(ov?.AnalystTargetPrice ?? null);
  const profitMargin = nn(ov?.ProfitMargin ?? null);
  const opMargin = nn(ov?.OperatingMarginTTM ?? null);
  const roe = nn(ov?.ReturnOnEquityTTM ?? null);
  const roa = nn(ov?.ReturnOnAssetsTTM ?? null);
  const beta = nn(ov?.Beta ?? null);
  const divYield = nn(ov?.DividendYield ?? null);
  const revenueGrowth = nn(ov?.QuarterlyRevenueGrowthYOY ?? null);
  const earningsGrowth = nn(ov?.QuarterlyEarningsGrowthYOY ?? null);

  // 52-week range position
  const rangePos = price && high52 && low52 && high52 > low52
    ? ((price - low52) / (high52 - low52)) * 100
    : null;

  // Analyst upside
  const upside = price && target ? ((target - price) / price) * 100 : null;

  // MA context
  const ma50 = nn(ov?.['50DayMovingAverage'] ?? null);
  const ma200 = nn(ov?.['200DayMovingAverage'] ?? null);
  const aboveMa50 = price && ma50 ? price > ma50 : null;
  const aboveMa200 = price && ma200 ? price > ma200 : null;

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 8px', color: 'var(--text-h)', fontSize: 'clamp(22px,5vw,30px)', fontWeight: 700 }}>
          Valuation Snapshot
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Full valuation dashboard from a single API call — ratios, margins, analyst target, and 52-week context.
        </p>
      </div>

      {showKeyInput ? (
        <Card style={{ marginBottom: 24, border: '1px solid #6366f140' }}>
          <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: 8 }}>Alpha Vantage API Key Required</div>
          <p style={{ color: 'var(--text)', fontSize: 13, margin: '0 0 12px' }}>
            Free key at <strong style={{ color: 'var(--text-h)' }}>alphavantage.co/support/#api-key</strong> — 25 calls/day. Saved in your browser.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Paste your Alpha Vantage API key…"
              onKeyDown={e => e.key === 'Enter' && saveKey((e.target as HTMLInputElement).value.trim())}
              defaultValue={apiKey} id="vs-key-input" />
            <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => saveKey((document.getElementById('vs-key-input') as HTMLInputElement).value.trim())}>Save Key</button>
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
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}>
              {loading ? 'Loading…' : 'Analyze'}
            </button>
            <button onClick={() => setShowKeyInput(true)}
              style={{ background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, cursor: 'pointer' }}>
              ⚙ API Key
            </button>
          </div>
          {error && <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 13, background: '#ef444415', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>⚠ {error}</div>}
          {ticker && !error && <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 13 }}>Showing <span style={{ color: '#818cf8', fontWeight: 700 }}>{ticker}</span></div>}
        </Card>
      )}

      {ov && (
        <>
          {/* Company header */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', color: 'var(--text-h)', fontSize: 22, fontWeight: 700 }}>{ov.Name}</h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ color: '#818cf8', fontSize: 13, fontWeight: 600 }}>{ticker}</span>
                  <span style={{ color: '#475569' }}>·</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ov.Exchange}</span>
                  {ov.Sector && ov.Sector !== 'None' && (
                    <>
                      <span style={{ color: '#475569' }}>·</span>
                      <span style={{ background: '#6366f120', color: '#818cf8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{ov.Sector}</span>
                    </>
                  )}
                  {ov.Industry && ov.Industry !== 'None' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{ov.Industry}</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {price != null && <div style={{ color: 'var(--text-h)', fontSize: 28, fontWeight: 700 }}>${price.toFixed(2)}</div>}
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Market Cap: <span style={{ color: 'var(--text-h)' }}>{fmtBig(ov.MarketCapitalization)}</span></div>
                {beta != null && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Beta: <span style={{ color: beta > 1.5 ? '#f59e0b' : 'var(--text-h)' }}>{beta.toFixed(2)}</span></div>}
              </div>
            </div>
          </Card>

          {/* 52-week range */}
          {high52 && low52 && (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>52-WEEK RANGE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, minWidth: 60 }}>${low52.toFixed(2)}</span>
                <div style={{ flex: 1, position: 'relative', height: 8, background: 'var(--border)', borderRadius: 4 }}>
                  {rangePos != null && (
                    <div style={{ position: 'absolute', left: `${Math.max(0, Math.min(100, rangePos))}%`, top: -4, width: 16, height: 16, background: '#6366f1', borderRadius: '50%', transform: 'translateX(-50%)', border: '2px solid var(--text-h)' }} />
                  )}
                  <div style={{ width: `${Math.max(0, Math.min(100, rangePos ?? 0))}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981)', borderRadius: 4 }} />
                </div>
                <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>${high52.toFixed(2)}</span>
              </div>
              {rangePos != null && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                  Currently at <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{rangePos.toFixed(0)}%</span> of 52-week range
                  {aboveMa50 != null && <span style={{ marginLeft: 12, color: aboveMa50 ? '#10b981' : '#ef4444' }}>{aboveMa50 ? '▲' : '▼'} 50MA</span>}
                  {aboveMa200 != null && <span style={{ marginLeft: 8, color: aboveMa200 ? '#10b981' : '#ef4444' }}>{aboveMa200 ? '▲' : '▼'} 200MA</span>}
                </div>
              )}
            </Card>
          )}

          {/* Analyst target */}
          {target != null && price != null && (
            <Card style={{ marginBottom: 20, border: `1px solid ${upside != null && upside > 10 ? '#10b98140' : upside != null && upside < -10 ? '#ef444440' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>ANALYST CONSENSUS TARGET</div>
                  <div style={{ color: 'var(--text-h)', fontSize: 22, fontWeight: 700 }}>${target.toFixed(2)}</div>
                </div>
                {upside != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>IMPLIED UPSIDE</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: upside > 0 ? '#10b981' : '#ef4444' }}>
                      {upside > 0 ? '+' : ''}{upside.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Valuation ratios */}
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="Valuation Multiples" color="#8b5cf6" />
            <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>Color-coded using general market thresholds — always compare within sector for context.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              <MetricTile label="P/E (TTM)" value={pe != null ? pe.toFixed(1) + 'x' : '—'} color={peColor(pe)} sub="Trailing" />
              <MetricTile label="P/E (FORWARD)" value={fpe != null ? fpe.toFixed(1) + 'x' : '—'} color={peColor(fpe)} sub="Next 12 months" />
              <MetricTile label="P/B RATIO" value={pb != null ? pb.toFixed(2) + 'x' : '—'} color={pbColor(pb)} sub="Price / Book" />
              <MetricTile label="P/S RATIO (TTM)" value={ps != null ? ps.toFixed(2) + 'x' : '—'} color={psColor(ps)} sub="Price / Sales" />
              <MetricTile label="PEG RATIO" value={peg != null ? peg.toFixed(2) + 'x' : '—'}
                color={peg != null ? (peg < 1 ? '#10b981' : peg < 2 ? '#f59e0b' : '#ef4444') : undefined}
                sub="P/E ÷ Growth" />
              <MetricTile label="EV/EBITDA" value={evEbitda != null ? evEbitda.toFixed(1) + 'x' : '—'} color={evEbitdaColor(evEbitda)} />
              <MetricTile label="EV/REVENUE" value={fmt(ov.EVToRevenue, 'x')} />
              <MetricTile label="EPS (TTM)" value={nn(ov.DilutedEPSTTM) != null ? '$' + Number(ov.DilutedEPSTTM).toFixed(2) : '—'} />
            </div>
          </div>

          {/* Profitability */}
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="Profitability & Returns" color="#10b981" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              <MetricTile label="GROSS MARGIN" value={ov.GrossProfitTTM && ov.RevenueTTM && nn(ov.RevenueTTM) ? ((nn(ov.GrossProfitTTM) ?? 0) / nn(ov.RevenueTTM)! * 100).toFixed(1) + '%' : '—'} color="var(--text-h)" />
              <MetricTile label="OPERATING MARGIN" value={opMargin != null ? (opMargin * 100).toFixed(1) + '%' : '—'} color={marginColor(opMargin)} />
              <MetricTile label="NET PROFIT MARGIN" value={profitMargin != null ? (profitMargin * 100).toFixed(1) + '%' : '—'} color={marginColor(profitMargin)} />
              <MetricTile label="ROE (TTM)" value={roe != null ? (roe * 100).toFixed(1) + '%' : '—'} color={roeColor(roe)} />
              <MetricTile label="ROA (TTM)" value={roa != null ? (roa * 100).toFixed(1) + '%' : '—'} color={roa != null ? (roa > 0.08 ? '#10b981' : roa > 0.04 ? '#f59e0b' : '#ef4444') : undefined} />
              <MetricTile label="REVENUE (TTM)" value={fmtBig(ov.RevenueTTM)} />
              <MetricTile label="EBITDA" value={fmtBig(ov.EBITDA)} />
            </div>
          </div>

          {/* Growth & income */}
          <div style={{ marginBottom: 20 }}>
            <SectionHeader title="Growth & Income" color="#3b82f6" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              <MetricTile label="REVENUE GROWTH (QoQ YoY)" value={revenueGrowth != null ? (revenueGrowth > 0 ? '+' : '') + (revenueGrowth * 100).toFixed(1) + '%' : '—'}
                color={revenueGrowth != null ? (revenueGrowth > 0.1 ? '#10b981' : revenueGrowth > 0 ? '#f59e0b' : '#ef4444') : undefined} />
              <MetricTile label="EARNINGS GROWTH (QoQ YoY)" value={earningsGrowth != null ? (earningsGrowth > 0 ? '+' : '') + (earningsGrowth * 100).toFixed(1) + '%' : '—'}
                color={earningsGrowth != null ? (earningsGrowth > 0.1 ? '#10b981' : earningsGrowth > 0 ? '#f59e0b' : '#ef4444') : undefined} />
              <MetricTile label="DIVIDEND YIELD" value={divYield != null && divYield > 0 ? (divYield * 100).toFixed(2) + '%' : 'None'}
                color={divYield != null && divYield > 0 ? '#10b981' : 'var(--text-muted)'} />
              <MetricTile label="DIVIDEND / SHARE" value={nn(ov.DividendPerShare) != null && nn(ov.DividendPerShare)! > 0 ? '$' + Number(ov.DividendPerShare).toFixed(2) : 'None'} />
              <MetricTile label="SHARES OUTSTANDING" value={nn(ov.SharesOutstanding) != null ? (nn(ov.SharesOutstanding)! / 1e9 >= 1 ? (nn(ov.SharesOutstanding)! / 1e9).toFixed(2) + 'B' : (nn(ov.SharesOutstanding)! / 1e6).toFixed(0) + 'M') : '—'} />
            </div>
          </div>

          {/* Footnote */}
          <Card style={{ background: 'var(--bg)' }}>
            <div style={{ color: '#475569', fontSize: 12 }}>
              Data via Alpha Vantage OVERVIEW endpoint. Valuation colors use general market thresholds — high-growth tech typically trades at premium multiples that appear "expensive" by these thresholds. Always compare within sector peers.
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
