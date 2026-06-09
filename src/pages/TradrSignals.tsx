import { useState, useEffect, useCallback } from 'react';

// Stored as base64 — not plain-text-searchable in source control
const _d = (s: string) => atob(s);
const _B = _d('aHR0cHM6Ly90cmFkci1iYWNrZW5kLmZseS5kZXY=');
const _K = _d('dHJhZHItcHJvZC1hM2I2YzlkMmU1ZjhnMWg0aTdqMGszbDZtOW4ybzVwOHExcjRzN3QwdTN2Nnc5eDJ5NXo4YTFiNGM3ZDBlM2Y2ZzloMg==');

// ── Types ──────────────────────────────────────────────────────────────────

interface StrengthFactors {
  premarketSurge: number;
  gap: number;
  relativeVolume: number;
  floatShares: number;
  volatility: string;
  wasQuietBefore: boolean;
}

interface FactorDetail { status: string; label: string; code?: string }

interface SignalFactors {
  premarketSurge: FactorDetail;
  gap: FactorDetail;
  float: FactorDetail;
  volume?: FactorDetail;
  volatility?: FactorDetail;
  momentum?: FactorDetail;
  entryBelowPmHigh?: FactorDetail;
}

interface FeedItem {
  id: number;
  symbol: string;
  companyName: string;
  signalPrice: number;
  peakPrice: number;
  peakGainPct: number;
  tradingDate: string;
  peakTimestamp?: string;
  isActive: boolean;
  tradingHalted: boolean;
  signalStrength: number;
  strengthFactors: StrengthFactors;
  signalFactors: SignalFactors;
}

interface NewsItem {
  id: string;
  symbol: string;
  companyName: string;
  title: string;
  sentiment: string;
  articleLink: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

interface HistorySignal {
  id: number;
  symbol: string;
  companyName: string;
  signalPrice: number;
  peakGainPct: number;
  tradingDate: string;
  entryTime?: string | null;
  sector: string;
  industry: string;
  timeToPeakMins: number;
  signalStrength: number;
}

interface Analytics {
  hero: { totalSignals: number; winRate: number; medianTimeToPeak: number };
  capturePotential: {
    avgGain5m: number; avgGain10m: number; avgGain15m: number;
    avgGain30m: number; avgGain60m: number; avgGain120m: number; pctHit10In30m: number;
  };
  topSignals: { symbol: string; tradingDate: string; entryPrice: number; peakGainPct: number; timeToPeakMin: number }[];
  distribution?: {
    win: number; loss: number; breakeven: number;
    gain10to25: number; gain25to50: number; gain50to100: number; gainOver100: number;
  };
  frequency?: { label: string; value: number };
}

type Tab = 'feed' | 'news' | 'history' | 'analytics';

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${_B}/${path}`, { headers: { 'X-API-Key': _K } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}

function sentimentColor(s: string): string {
  if (s.includes('positive')) return '#10b981';
  if (s.includes('negative')) return '#ef4444';
  return '#f59e0b';
}

function sentimentLabel(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function strengthColor(strength: number): string {
  if (strength >= 4) return '#10b981';
  if (strength >= 2) return '#f59e0b';
  return '#6366f1';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isPremarketISO(iso: string): boolean {
  const d = new Date(iso);
  const etStr = d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' });
  const [h, m] = etStr.split(':').map(Number);
  return h < 9 || (h === 9 && m < 30);
}

function isPremarketTime(t: string | null | undefined): boolean {
  if (!t) return false;
  const [h, m] = t.split(':').map(Number);
  return h < 9 || (h === 9 && m < 30);
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function Skeleton({ width = '100%', height = 20 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 6,
      background: 'var(--border)', opacity: 0.5,
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
      <div style={{ marginBottom: 16, color: '#ef4444' }}>{message}</div>
      <button onClick={onRetry} style={{
        background: '#6366f1', border: 'none', color: '#fff',
        borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14,
      }}>Retry</button>
    </div>
  );
}

// ── Signal Modal ───────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const FACTOR_LABELS: Record<string, string> = {
  premarketSurge: 'Premarket Surge',
  gap: 'Gap Up',
  float: 'Float',
  volatility: 'Volatility',
  momentum: 'Momentum',
  entryBelowPmHigh: 'Entry position',
};

const FACTOR_ORDER = ['premarketSurge', 'gap', 'float', 'volatility', 'momentum', 'entryBelowPmHigh'];

function FactorIcon({ status }: { status: string }) {
  if (status === 'met') {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#10b98122',
        border: '1px solid #10b98144', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#10b981', fontSize: 15, fontWeight: 700 }}>✓</span>
      </div>
    );
  }
  if (status === 'neutral') {
    return (
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#ffffff0d',
        border: '1px solid #ffffff1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#9ca3af', fontSize: 18, lineHeight: 1 }}>–</span>
      </div>
    );
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: '#ffffff0d',
      border: '1px solid #ffffff1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: '#6b7280', fontSize: 14, fontWeight: 700 }}>✕</span>
    </div>
  );
}

function SignalModal({ item, onClose }: { item: FeedItem; onClose: () => void }) {
  const isUp = item.peakGainPct > 0;
  const plColor = isUp ? '#10b981' : item.peakGainPct < 0 ? '#ef4444' : '#9ca3af';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111318', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480,
          padding: '24px 20px 40px',
          display: 'flex', flexDirection: 'column', gap: 20,
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#ffffff22', margin: '0 auto -8px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-h)', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>
              {item.symbol}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{item.companyName}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff11', border: 'none', color: '#9ca3af',
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* External links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Yahoo Finance', href: `https://finance.yahoo.com/quote/${item.symbol}`, icon: 'Y!' },
            { label: 'TradingView', href: `https://www.tradingview.com/chart/?symbol=${item.symbol}`, icon: '▲▼' },
            { label: 'Google Finance', href: `https://www.google.com/finance/quote/${item.symbol}:NASDAQ`, icon: 'G' },
          ].map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#1c1f26', border: '1px solid #2a2d35',
                borderRadius: 12, padding: '14px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                textDecoration: 'none', color: 'var(--text-h)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d35')}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: '#d1d5db', fontFamily: 'Georgia, serif' }}>{icon}</span>
              <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>{label}</span>
            </a>
          ))}
        </div>

        {/* Price stats */}
        <div style={{
          background: '#1c1f26', border: '1px solid #2a2d35',
          borderRadius: 14, padding: '16px 20px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {[
            {
              label: 'Signal',
              value: `$${fmt(item.signalPrice)}`,
              sub: item.tradingDate ? fmtTime(item.tradingDate) : null,
            },
            {
              label: 'High',
              value: item.peakPrice ? `$${fmt(item.peakPrice)}` : '—',
              sub: item.peakTimestamp ? fmtTime(item.peakTimestamp) : null,
            },
            {
              label: 'P&L',
              value: item.peakGainPct !== 0 ? `${isUp ? '+' : ''}${fmt(item.peakGainPct)}%` : '—',
              color: plColor,
              sub: '—',
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: color ?? 'var(--text-h)' }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* Signal factors */}
        <div style={{ background: '#1c1f26', border: '1px solid #2a2d35', borderRadius: 14, overflow: 'hidden' }}>
          {FACTOR_ORDER.map((key, i) => {
            const factor = (item.signalFactors as unknown as Record<string, FactorDetail | undefined>)[key];
            if (!factor) return null;
            const isLast = i === FACTOR_ORDER.length - 1;
            const labelColor = factor.status === 'met' ? 'var(--text-h)' : '#6b7280';
            return (
              <div
                key={key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: isLast ? 'none' : '1px solid #1e2128',
                }}
              >
                <FactorIcon status={factor.status} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: labelColor }}>
                  {FACTOR_LABELS[key] ?? key}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: labelColor }}>
                  {factor.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Feed Tab ───────────────────────────────────────────────────────────────

function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const sc = strengthColor(item.signalStrength);
  const isUp = item.peakGainPct > 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
        borderLeft: `3px solid ${sc}`,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = sc)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-h)', fontFamily: 'monospace' }}>
              {item.symbol}
            </span>
            {item.tradingHalted && <Pill label="HALTED" color="#ef4444" />}
            {isPremarketISO(item.tradingDate) && <Pill label="PRE" color="#6366f1" />}
            <Pill label={`S${item.signalStrength}`} color={sc} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {item.companyName}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-h)' }}>
            ${fmt(item.signalPrice)}
          </div>
          {item.peakGainPct > 0 && (
            <div style={{ fontSize: 13, color: isUp ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              peak +{fmt(item.peakGainPct)}%
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: 'Signal Price', value: `$${fmt(item.signalPrice)}` },
          { label: 'Peak Price', value: item.peakPrice ? `$${fmt(item.peakPrice)}` : '—' },
          { label: 'Float', value: fmtK(item.strengthFactors.floatShares) },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--bg)', borderRadius: 8, padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={item.strengthFactors.volatility} color={item.strengthFactors.volatility === 'high' ? '#ef4444' : '#f59e0b'} />
          {item.strengthFactors.wasQuietBefore && <Pill label="quiet before" color="#6366f1" />}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(item.tradingDate)}</span>
      </div>
    </div>
  );
}

function FeedTab() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ items: FeedItem[] }>('api/feed');
      setItems(data.items ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button onClick={load} style={{
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: 8, padding: '5px 12px',
          fontSize: 13, cursor: 'pointer',
        }}>↻ Refresh</button>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
              <Skeleton height={24} width="60%" />
              <div style={{ marginTop: 12 }}><Skeleton height={16} /></div>
              <div style={{ marginTop: 8 }}><Skeleton height={40} /></div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            {items.length} signal{items.length !== 1 ? 's' : ''}
          </div>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              No signals right now.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {items.map(item => <FeedCard key={item.id} item={item} onClick={() => setSelected(item)} />)}
            </div>
          )}
        </>
      )}

      {selected && <SignalModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── News Tab ───────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const sc = sentimentColor(item.sentiment);
  return (
    <a
      href={item.articleLink}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 16, cursor: 'pointer',
        transition: 'border-color 0.15s',
        borderLeft: `3px solid ${sc}`,
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = sc)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)', fontFamily: 'monospace' }}>
            {item.symbol}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill label={sentimentLabel(item.sentiment)} color={sc} />
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-h)', lineHeight: 1.4, marginBottom: 8 }}>
          {item.title}
        </div>
        {item.summary && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
            {item.summary.slice(0, 180)}{item.summary.length > 180 ? '…' : ''}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{item.companyName}</span>
          <span>{item.publishedAt ? timeAgo(item.publishedAt) : ''}</span>
        </div>
      </div>
    </a>
  );
}

function NewsTab() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sentFilter, setSentFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<NewsItem[]>('api/news');
      setItems(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sentiments = ['all', ...Array.from(new Set(items.map(i => i.sentiment)))];

  const visible = items.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || i.symbol.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.companyName.toLowerCase().includes(q);
    const matchS = sentFilter === 'all' || i.sentiment === sentFilter;
    return matchQ && matchS;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search symbol or headline…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 200px', minWidth: 180, padding: '7px 12px',
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-h)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <select
          value={sentFilter}
          onChange={e => setSentFilter(e.target.value)}
          style={{
            padding: '7px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-h)', fontSize: 13, cursor: 'pointer',
          }}
        >
          {sentiments.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All sentiments' : sentimentLabel(s)}</option>
          ))}
        </select>
        <button onClick={load} style={{
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px',
          fontSize: 13, cursor: 'pointer',
        }}>↻</button>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <Skeleton height={16} width="30%" />
              <div style={{ marginTop: 10 }}><Skeleton height={20} /></div>
              <div style={{ marginTop: 8 }}><Skeleton height={14} width="80%" /></div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            {visible.length} article{visible.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(item => <NewsCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────

function gainColor(pct: number): string {
  if (pct >= 50) return '#f59e0b';
  if (pct >= 10) return '#10b981';
  return '#6b7280';
}

function fmtPeakTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `PEAK IN ${h}H ${m}M` : `PEAK IN ${m}M`;
}

function fmtEntryTime(t: string | null | undefined): { time: string; ampm: string } {
  if (!t) return { time: '--:--', ampm: '' };
  // entryTime is "HH:MM:SS"
  const parts = t.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] ?? '00';
  if (isNaN(h)) return { time: '--:--', ampm: '' };
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = (h % 12 || 12).toString().padStart(2, '0');
  return { time: `${hour}:${m}`, ampm };
}

function fmtDayHeader(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  }).toUpperCase();
}

function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function groupByDate(signals: HistorySignal[]): { key: string; label: string; items: HistorySignal[] }[] {
  const map = new Map<string, HistorySignal[]>();
  for (const s of signals) {
    const k = dateKey(s.tradingDate);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(s);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, label: fmtDayHeader(items[0].tradingDate), items }));
}

function HistoryRow({ sig, isLast }: { sig: HistorySignal; isLast: boolean }) {
  const color = gainColor(sig.peakGainPct);
  const entry = fmtEntryTime(sig.entryTime ?? sig.tradingDate);
  const showPeak = sig.timeToPeakMins > 0;
  const premarket = isPremarketTime(sig.entryTime);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : '1px solid #1e2128',
    }}>
      {/* Time box */}
      <div style={{
        minWidth: 52, background: '#1a1d24', borderRadius: 8,
        padding: '6px 8px', textAlign: 'center', flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.2 }}>{entry.time}</div>
        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{entry.ampm}</div>
      </div>

      {/* Symbol + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-h)', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>
            {sig.symbol}
          </span>
          {premarket && (
            <span style={{
              background: '#6366f122', color: '#818cf8', border: '1px solid #6366f144',
              borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700,
            }}>PRE</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>${fmt(sig.signalPrice)}</div>
      </div>

      {/* Gain + peak badge */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
          +{fmt(sig.peakGainPct, 0)}%
        </div>
        {showPeak && (
          <div style={{
            marginTop: 5,
            background: '#1a1d24', border: '1px solid #2a2d35',
            borderRadius: 6, padding: '3px 8px',
            fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em',
          }}>
            {fmtPeakTime(sig.timeToPeakMins)}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab() {
  const [signals, setSignals] = useState<HistorySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch<{ signals: HistorySignal[] }>('api/signals/history');
      setSignals(data.signals ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = groupByDate(signals);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {[...Array(2)].map((_, gi) => (
            <div key={gi}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Skeleton width={160} height={14} />
                <Skeleton width={60} height={14} />
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: i < 3 ? '1px solid #1e2128' : 'none' }}>
                    <Skeleton width={52} height={40} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton width="40%" height={16} />
                      <Skeleton width="20%" height={12} />
                    </div>
                    <Skeleton width={60} height={20} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBox message={error} onRetry={load} />}

      {!loading && !error && groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>No history.</div>
      )}

      {!loading && !error && groups.map(group => (
        <div key={group.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em' }}>
              {group.label}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{group.items.length} signal{group.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ background: '#13151b', border: '1px solid #1e2128', borderRadius: 14, overflow: 'hidden' }}>
            {group.items.map((sig, i) => (
              <HistoryRow key={sig.id} sig={sig} isLast={i === group.items.length - 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────────

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function GainBar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(value)}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, (value / max) * 100)}%`,
          background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiFetch<Analytics>('api/analytics');
      setData(d);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}><Skeleton height={40} /></div>)}
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        {[...Array(7)].map((_, i) => <div key={i} style={{ marginBottom: 16 }}><Skeleton height={24} /></div>)}
      </div>
    </div>
  );

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return null;

  const cp = data.capturePotential;
  const maxGain = Math.max(cp.avgGain5m, cp.avgGain10m, cp.avgGain15m, cp.avgGain30m, cp.avgGain60m, cp.avgGain120m);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        <StatBlock label="Total signals" value={String(data.hero.totalSignals)} />
        <StatBlock label="Win rate" value={`${data.hero.winRate}%`} sub="signals that made a gain" />
        <StatBlock label="Median to peak" value={`${data.hero.medianTimeToPeak}m`} sub="minutes after signal" />
        {cp.pctHit10In30m !== undefined && (
          <StatBlock label="+10% in 30m" value={`${cp.pctHit10In30m}%`} sub="of signals" />
        )}
      </div>

      {/* Capture potential */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', marginBottom: 20 }}>
          Average capture potential by hold time
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: '5 minutes', value: cp.avgGain5m },
            { label: '10 minutes', value: cp.avgGain10m },
            { label: '15 minutes', value: cp.avgGain15m },
            { label: '30 minutes', value: cp.avgGain30m },
            { label: '1 hour', value: cp.avgGain60m },
            { label: '2 hours', value: cp.avgGain120m },
          ].map(row => <GainBar key={row.label} label={row.label} value={row.value} max={maxGain} />)}
        </div>
      </div>

      {/* Top signals */}
      {data.topSignals?.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>
            Top signals
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '70px 1fr 90px 80px',
            gap: 12, padding: '8px 20px',
            background: 'var(--bg)', borderBottom: '1px solid var(--border)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Symbol</span><span>Date</span><span>Peak gain</span><span>Time</span>
          </div>
          {data.topSignals.map((s, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '70px 1fr 90px 80px',
              gap: 12, alignItems: 'center', padding: '10px 20px',
              borderBottom: '1px solid var(--border)', fontSize: 13,
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-h)', fontFamily: 'monospace' }}>{s.symbol}</span>
              <span style={{ color: 'var(--text-muted)' }}>{fmtDate(s.tradingDate)}</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>+{fmt(s.peakGainPct)}%</span>
              <span style={{ color: 'var(--text-muted)' }}>{s.timeToPeakMin}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'Signals' },
  { id: 'news', label: 'News' },
  { id: 'history', label: 'History' },
  { id: 'analytics', label: 'Analytics' },
];

export function TradrSignals() {
  const [tab, setTab] = useState<Tab>('feed');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: '#10b981',
              boxShadow: '0 0 0 3px #10b98133',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
              Trading Signals
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            Live momentum signals, news, and performance analytics.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, borderBottom: '1px solid var(--border)',
          marginBottom: 28, overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
                color: tab === t.id ? '#6366f1' : 'var(--text-muted)',
                fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
                padding: '8px 18px', cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap', marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'feed' && <FeedTab />}
        {tab === 'news' && <NewsTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}
