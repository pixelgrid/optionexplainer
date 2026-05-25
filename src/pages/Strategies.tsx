import { useState } from 'react';
import { strategies } from '../data/strategies';
import { StrategyCard } from '../components/StrategyCard';
import type { Category } from '../data/strategies';

type Filter = 'all' | Category;

const filters: { label: string; value: Filter; color: string }[] = [
  { label: 'All', value: 'all', color: '#6366f1' },
  { label: 'Bullish', value: 'bullish', color: '#10b981' },
  { label: 'Bearish', value: 'bearish', color: '#ef4444' },
  { label: 'Neutral', value: 'neutral', color: '#3b82f6' },
  { label: 'Volatile', value: 'volatile', color: '#8b5cf6' },
  { label: 'Synthetic', value: 'synthetic', color: '#f59e0b' },
];

export function Strategies() {
  const [active, setActive] = useState<Filter>('all');

  const visible = active === 'all'
    ? strategies
    : strategies.filter((s) => s.category === active);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(20px, 4vw, 32px) clamp(14px, 3vw, 24px)' }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
          Options Strategy Guide
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>
          {strategies.length} strategies with live P&L charts. Click any card to see when it's best used.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {filters.map((f) => {
          const isActive = active === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActive(f.value)}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: `1px solid ${isActive ? f.color : '#2a2d3e'}`,
                background: isActive ? `${f.color}18` : 'transparent',
                color: isActive ? f.color : '#64748b',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
              {f.value !== 'all' && (
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                  ({strategies.filter((s) => s.category === f.value).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 20,
        }}
      >
        {visible.map((s) => (
          <StrategyCard key={s.id} strategy={s} />
        ))}
      </div>
    </div>
  );
}
