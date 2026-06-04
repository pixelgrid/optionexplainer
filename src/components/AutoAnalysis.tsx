import { useState, useRef } from 'react';
import { avFetch, LS_AV_KEY, sleep } from '../lib/avClient';
import {
  scoreFinancialHealth, scoreEarningsQuality, scoreValuation, scoreDCF,
  scoreDividends, scoreSentiment, computeComposite,
  type PhaseScore, type Grade,
  type AVOverview, type AVReport, type AVEarningsQuarter,
  type AVDividendEntry, type AVNewsItem,
} from '../lib/autoAnalysis';

// ── Colour helpers ────────────────────────────────────────────────────────────

function gradeColor(g: Grade): string {
  if (g === 'A+' || g === 'A') return '#10b981';
  if (g === 'B+' || g === 'B') return '#22c55e';
  if (g === 'C+') return '#f59e0b';
  if (g === 'C') return '#fb923c';
  if (g === 'D') return '#ef4444';
  return '#dc2626';
}

function scoreBarColor(s: number): string {
  if (s >= 75) return '#10b981';
  if (s >= 60) return '#22c55e';
  if (s >= 45) return '#f59e0b';
  if (s >= 30) return '#fb923c';
  return '#ef4444';
}

// ── Fetch steps ───────────────────────────────────────────────────────────────

interface FetchStep {
  id: string; label: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  error?: string;
}

const STEPS: FetchStep[] = [
  { id: 'overview', label: 'Company overview & ratios', status: 'idle' },
  { id: 'income', label: 'Income statement (4yr)', status: 'idle' },
  { id: 'balance', label: 'Balance sheet', status: 'idle' },
  { id: 'cashflow', label: 'Cash flow statement', status: 'idle' },
  { id: 'earnings', label: 'Earnings history (8Q)', status: 'idle' },
  { id: 'dividends', label: 'Dividend history', status: 'idle' },
  { id: 'news', label: 'News & sentiment', status: 'idle' },
];

// ── Phase score card ──────────────────────────────────────────────────────────

function PhaseResultCard({ ps }: { ps: PhaseScore }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'details' | 'flags'>('details');
  const gc = gradeColor(ps.grade);
  const bc = scoreBarColor(ps.score);

  const PHASE_ACCENT: Record<number, string> = {
    2: '#10b981', 3: '#3b82f6', 4: '#f59e0b',
    5: '#6366f1', 6: '#ec4899', 7: '#06b6d4',
  };
  const accent = PHASE_ACCENT[ps.phase] ?? '#6366f1';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${open ? accent + '55' : 'var(--border)'}`,
      borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
      }}>
        {/* Grade badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: gc + '18', border: `2px solid ${gc}40`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: gc, lineHeight: 1 }}>{ps.grade}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{ps.score}/100</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
            Phase {ps.phase}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', marginBottom: 3 }}>
            {ps.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {ps.headline}
          </div>
          {/* Score bar */}
          <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: ps.score + '%',
              background: bc, borderRadius: 2, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        <span style={{
          fontSize: 13, color: 'var(--text-muted)', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s',
        }}>▾</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Summary bar */}
          <div style={{ padding: '10px 16px', background: accent + '0d', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
            {ps.summary}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {([['details', 'Score Breakdown'], ['flags', `Signals (${ps.flags.length})`]] as [string, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as 'details' | 'flags')} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '9px 16px',
                fontSize: 12, fontWeight: tab === id ? 700 : 400,
                color: tab === id ? accent : 'var(--text-muted)',
                borderBottom: tab === id ? `2px solid ${accent}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '14px 16px' }}>
            {tab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ps.details.map((d, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card2)', borderRadius: 7, padding: '10px 12px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)' }}>{d.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{d.value}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {d.points}/{d.maxPoints}pts
                        </span>
                      </div>
                    </div>
                    {/* Mini score bar */}
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: (d.points / d.maxPoints * 100) + '%',
                        background: d.points / d.maxPoints > 0.7 ? '#10b981' : d.points / d.maxPoints > 0.45 ? '#f59e0b' : '#ef4444',
                        borderRadius: 2,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55 }}>{d.note}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'flags' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {ps.flags.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No significant flags identified
                  </div>
                ) : ps.flags.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 7, alignItems: 'flex-start',
                    background: f.type === 'good' ? 'rgba(16,185,129,0.07)' : f.type === 'bad' ? 'rgba(239,68,68,0.07)' : 'var(--bg-card2)',
                    border: `1px solid ${f.type === 'good' ? 'rgba(16,185,129,0.25)' : f.type === 'bad' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                  }}>
                    <span style={{
                      fontSize: 11, flexShrink: 0, marginTop: 1,
                      color: f.type === 'good' ? '#10b981' : f.type === 'bad' ? '#ef4444' : 'var(--text-muted)',
                    }}>
                      {f.type === 'good' ? '✓' : f.type === 'bad' ? '✗' : '→'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overall composite card ────────────────────────────────────────────────────

function CompositeCard({ phases }: { phases: PhaseScore[] }) {
  const { score, grade, headline } = computeComposite(phases);
  const gc = gradeColor(grade);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `2px solid ${gc}40`,
      borderRadius: 12, padding: '20px 22px', marginBottom: 24,
      boxShadow: `0 0 0 1px ${gc}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Big grade */}
        <div style={{
          width: 64, height: 64, borderRadius: 12, flexShrink: 0,
          background: gc + '18', border: `2px solid ${gc}50`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: gc }}>{grade}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{score}/100</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
            Overall Composite Score
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-h)', marginBottom: 8, lineHeight: 1.4 }}>
            {headline}
          </div>
          {/* Bar */}
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: score + '%', background: gc, borderRadius: 3, transition: 'width 0.8s ease' }} />
          </div>
          {/* Phase mini bars */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {phases.map(p => (
              <div key={p.phase} title={`Phase ${p.phase}: ${p.title} — ${p.grade} (${p.score})`} style={{ flex: 1 }}>
                <div style={{ height: 3, background: gradeColor(p.grade), borderRadius: 2, opacity: 0.8 }} />
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: 2 }}>P{p.phase}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weights disclaimer */}
      <div style={{ marginTop: 14, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        Weighted composite: Financial Health 25% · Earnings 20% · Valuation 20% · DCF 15% · Dividends 10% · Sentiment 10%. Scores are based on quantitative metrics from Alpha Vantage data — sector context and qualitative moat assessment (Phase 1 & 8) are not included.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AutoAnalysis() {
  const [ticker, setTicker] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(LS_AV_KEY) ?? '');
  const [steps, setSteps] = useState<FetchStep[]>(STEPS.map(s => ({ ...s })));
  const [phases, setPhases] = useState<PhaseScore[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const abortRef = useRef(false);

  const setStep = (id: string, status: FetchStep['status'], err?: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, error: err } : s));
  };

  const runAnalysis = async () => {
    if (!ticker.trim() || !apiKey.trim()) return;
    localStorage.setItem(LS_AV_KEY, apiKey);
    abortRef.current = false;
    setRunning(true); setDone(false); setError(null); setPhases([]);
    setSteps(STEPS.map(s => ({ ...s, status: 'idle' })));

    const sym = ticker.trim().toUpperCase();

    try {
      // ── OVERVIEW ──
      setStep('overview', 'loading');
      const ovRaw = await avFetch('OVERVIEW', sym, apiKey);
      if (abortRef.current) return;
      const ov = ovRaw as unknown as AVOverview;
      if (!ov.Name) throw new Error('Ticker not found or API key is invalid');
      setCompanyName(ov.Name); setSector(ov.Sector);
      setStep('overview', 'done');
      await sleep(1200);

      // ── GLOBAL QUOTE ──
      const quoteRaw = await avFetch('GLOBAL_QUOTE', sym, apiKey);
      const price = parseFloat((quoteRaw['Global Quote'] as Record<string,string>)?.['05. price'] ?? '') || null;
      await sleep(1200);

      // ── INCOME STATEMENT ──
      setStep('income', 'loading');
      const incRaw = await avFetch('INCOME_STATEMENT', sym, apiKey) as Record<string, AVReport[]>;
      if (abortRef.current) return;
      const income: AVReport[] = incRaw.annualReports ?? [];
      setStep('income', 'done');
      await sleep(1200);

      // ── BALANCE SHEET ──
      setStep('balance', 'loading');
      const balRaw = await avFetch('BALANCE_SHEET', sym, apiKey) as Record<string, AVReport[]>;
      if (abortRef.current) return;
      const balance: AVReport[] = balRaw.annualReports ?? [];
      setStep('balance', 'done');
      await sleep(1200);

      // ── CASH FLOW ──
      setStep('cashflow', 'loading');
      const cfRaw = await avFetch('CASH_FLOW', sym, apiKey) as Record<string, AVReport[]>;
      if (abortRef.current) return;
      const cashflow: AVReport[] = cfRaw.annualReports ?? [];
      setStep('cashflow', 'done');
      await sleep(1200);

      // ── EARNINGS ──
      setStep('earnings', 'loading');
      const earRaw = await avFetch('EARNINGS', sym, apiKey) as Record<string, AVEarningsQuarter[]>;
      if (abortRef.current) return;
      const earnings: AVEarningsQuarter[] = earRaw.quarterlyEarnings ?? [];
      setStep('earnings', 'done');
      await sleep(1200);

      // ── DIVIDENDS ──
      setStep('dividends', 'loading');
      let divEntries: AVDividendEntry[] = [];
      try {
        const divRaw = await avFetch('DIVIDENDS', sym, apiKey) as Record<string, AVDividendEntry[]>;
        divEntries = divRaw.data ?? [];
        setStep('dividends', 'done');
      } catch {
        setStep('dividends', 'done'); // not fatal
      }
      await sleep(1200);

      // ── NEWS SENTIMENT ──
      setStep('news', 'loading');
      let newsItems: AVNewsItem[] = [];
      try {
        const newsRaw = await avFetch('NEWS_SENTIMENT', sym, apiKey) as Record<string, unknown>;
        newsItems = (newsRaw.feed as AVNewsItem[]) ?? [];
        setStep('news', 'done');
      } catch {
        setStep('news', 'done'); // not fatal
      }

      if (abortRef.current) return;

      // ── SCORING ──
      const scored: PhaseScore[] = [
        scoreFinancialHealth(income, balance, cashflow),
        scoreEarningsQuality(earnings),
        scoreValuation(ov, price),
        scoreDCF(cashflow, [], ov, price),
        scoreDividends(divEntries, cashflow, income, ov),
        scoreSentiment(newsItems, sym, ov),
      ];
      setPhases(scored);
      setDone(true);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    abortRef.current = true;
    setRunning(false); setDone(false); setError(null);
    setPhases([]); setSteps(STEPS.map(s => ({ ...s, status: 'idle' })));
    setCompanyName(''); setSector('');
  };

  const anyRunning = steps.some(s => s.status === 'loading');
  const doneCount = steps.filter(s => s.status === 'done').length;
  const progressPct = (doneCount / steps.length) * 100;

  return (
    <div style={{ marginBottom: 48 }}>
      {/* Section header */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px 22px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 4, height: 22, borderRadius: 2, background: '#6366f1' }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-h)' }}>
            Auto-Analysis — Phases 2–7
          </h2>
          <span style={{
            fontSize: 10, background: '#6366f118', color: '#6366f1',
            border: '1px solid #6366f130', borderRadius: 4, padding: '2px 7px',
          }}>
            Beta
          </span>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Enter a ticker and your Alpha Vantage API key. Fetches 7 endpoints, scores each phase 0–100, and gives a detailed justification. Free tier: 25 calls/day — this analysis uses 8 calls.
        </p>

        {/* Inputs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && !running && runAnalysis()}
            placeholder="Ticker — e.g. AAPL"
            disabled={running}
            style={{
              width: 140, background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '9px 13px', color: 'var(--text-h)',
              fontSize: 14, fontWeight: 600, outline: 'none', letterSpacing: '0.05em',
            }}
          />
          <input
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Alpha Vantage API key"
            type="password"
            disabled={running}
            style={{
              flex: 1, minWidth: 180, background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '9px 13px', color: 'var(--text-h)', fontSize: 13, outline: 'none',
            }}
          />
          {!running ? (
            <button
              onClick={runAnalysis}
              disabled={!ticker.trim() || !apiKey.trim()}
              style={{
                background: '#6366f1', border: 'none', borderRadius: 8,
                padding: '9px 22px', fontSize: 13, fontWeight: 700, color: '#fff',
                cursor: ticker.trim() && apiKey.trim() ? 'pointer' : 'not-allowed',
                opacity: ticker.trim() && apiKey.trim() ? 1 : 0.5, transition: 'opacity 0.15s',
              }}
            >
              Run Analysis →
            </button>
          ) : (
            <button
              onClick={() => { abortRef.current = true; setRunning(false); }}
              style={{
                background: '#ef4444', border: 'none', borderRadius: 8,
                padding: '9px 18px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          {done && (
            <button onClick={reset} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 8,
              padding: '9px 14px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              Reset
            </button>
          )}
        </div>

        {/* API key hint */}
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
          Get a free key at{' '}
          <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer"
            style={{ color: '#6366f1' }}>alphavantage.co</a>
          {' '}· Free tier: 25 calls/day, 5 calls/min
        </div>
      </div>

      {/* Progress */}
      {(running || done) && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 18px', marginBottom: 20,
        }}>
          {/* Overall bar */}
          {running && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)' }}>
                  {anyRunning ? 'Fetching data…' : 'Scoring all phases…'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doneCount}/{steps.length}</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: progressPct + '%',
                  background: '#6366f1', borderRadius: 2, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {/* Step list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {steps.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 6,
                background: s.status === 'done' ? 'rgba(16,185,129,0.07)' : s.status === 'loading' ? 'rgba(99,102,241,0.07)' : 'var(--bg-card2)',
                border: `1px solid ${s.status === 'done' ? 'rgba(16,185,129,0.2)' : s.status === 'loading' ? 'rgba(99,102,241,0.2)' : 'var(--border)'}`,
              }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>
                  {s.status === 'done' ? '✓' : s.status === 'loading' ? '⟳' : s.status === 'error' ? '✗' : '○'}
                </span>
                <span style={{
                  fontSize: 11, color: s.status === 'done' ? '#10b981' : s.status === 'loading' ? '#6366f1' : 'var(--text-muted)',
                  fontWeight: s.status === 'loading' ? 600 : 400,
                }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '14px 16px', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, marginBottom: 16,
          fontSize: 13, color: '#ef4444',
        }}>
          <strong>Error: </strong>{error}
        </div>
      )}

      {/* Results */}
      {done && phases.length > 0 && (
        <div>
          {/* Company header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
            padding: '12px 16px', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 8,
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>
                {companyName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({ticker.toUpperCase()})</span>
              </div>
              {sector && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sector}</div>}
            </div>
          </div>

          {/* Composite */}
          <CompositeCard phases={phases} />

          {/* Phase cards */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            Phase Breakdown — click to expand
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {phases.map(p => <PhaseResultCard key={p.phase} ps={p} />)}
          </div>

          {/* Disclaimer */}
          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65,
          }}>
            <strong style={{ color: 'var(--text-h)' }}>Important: </strong>
            This is a quantitative screening tool, not financial advice. Scores do not account for sector-specific norms, management quality, competitive moat (Phase 1), or qualitative factors. Phase 1 (Business Understanding) and Phase 8 (Decision & Sizing) require your own judgment and cannot be automated. Always do your own due diligence before making investment decisions.
          </div>
        </div>
      )}
    </div>
  );
}
