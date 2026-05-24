import { useState } from 'react';
import type { Strategy } from '../data/strategies';
import { PnlChart } from './PnlChart';

const categoryColors: Record<string, string> = {
  bullish: '#10b981',
  bearish: '#ef4444',
  neutral: '#3b82f6',
  volatile: '#8b5cf6',
  synthetic: '#f59e0b',
};

const categoryLabels: Record<string, string> = {
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
  volatile: 'Volatile',
  synthetic: 'Synthetic',
};

interface Props {
  strategy: Strategy;
}

export function StrategyCard({ strategy }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = categoryColors[strategy.category];

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #2a2d3e' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#e2e8f0' }}>
            {strategy.name}
          </h3>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color,
              background: `${color}18`,
              border: `1px solid ${color}40`,
              borderRadius: 6,
              padding: '2px 8px',
            }}
          >
            {categoryLabels[strategy.category]}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          {strategy.description}
        </p>
      </div>

      {/* Chart */}
      <div style={{ padding: '12px 8px 4px' }}>
        <div style={{ fontSize: 11, color: '#475569', marginLeft: 12, marginBottom: 4 }}>
          P&L at expiration (spot = $100)
        </div>
        <PnlChart strategy={strategy} />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1,
          background: '#2a2d3e',
          borderTop: '1px solid #2a2d3e',
          margin: '8px 0 0',
        }}
      >
        {[
          { label: 'Max Profit', value: strategy.maxProfit, color: '#10b981' },
          { label: 'Max Loss', value: strategy.maxLoss, color: '#ef4444' },
          { label: 'Breakeven', value: strategy.breakeven, color: '#94a3b8' },
        ].map(({ label, value, color: c }) => (
          <div
            key={label}
            style={{ background: '#1a1d27', padding: '10px 12px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{ fontSize: 12, color: c, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Expandable when to use */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          borderTop: '1px solid #2a2d3e',
          padding: '10px 20px',
          cursor: 'pointer',
          color: '#6366f1',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ flex: 1 }}>When to use</span>
        <span style={{ fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div
          style={{
            padding: '4px 20px 16px',
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.65,
            borderTop: '1px solid #1e2130',
          }}
        >
          {strategy.whenToUse}
        </div>
      )}
    </div>
  );
}
