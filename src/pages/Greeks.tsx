import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { blackScholes } from '../lib/blackScholes';

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: 'var(--border)' },
  xAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  yAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  tooltip: { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 } },
};

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Slider({ label, min, max, value, onChange, format }: {
  label: string; min: number; max: number; value: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  const fmt = format ?? ((v) => String(v));
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', fontFamily: 'monospace' }}>{fmt(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#6366f1' }}
      />
    </div>
  );
}

function ChartExplanation({ text }: { text: string }) {
  return (
    <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--text)', lineHeight: 1.7, padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--border)' }}>
      {text}
    </p>
  );
}

export function Greeks() {
  const [dte, setDte] = useState(30);
  const [ivPct, setIvPct] = useState(30);
  const [spot, setSpot] = useState(100);

  const K = 100;
  const r = 0.05;
  const sigma = ivPct / 100;
  const T = dte / 365;

  const current = useMemo(() => blackScholes({ S: spot, K, T, r, sigma }), [spot, T, sigma]);

  // Delta chart: vary stock price 60–140
  const deltaData = useMemo(() => {
    return Array.from({ length: 81 }, (_, i) => {
      const S = 60 + i;
      const res = blackScholes({ S, K, T: Math.max(T, 1 / 365), r, sigma });
      return { price: S, callDelta: +res.delta_call.toFixed(4), putDelta: +res.delta_put.toFixed(4) };
    });
  }, [T, sigma]);

  // Gamma chart: vary stock price 60–140
  const gammaData = useMemo(() => {
    return Array.from({ length: 81 }, (_, i) => {
      const S = 60 + i;
      const res = blackScholes({ S, K, T: Math.max(T, 1 / 365), r, sigma });
      return { price: S, gamma: +res.gamma.toFixed(5) };
    });
  }, [T, sigma]);

  // Theta decay: ATM call price vs DTE 120→0
  const thetaData = useMemo(() => {
    return Array.from({ length: 121 }, (_, i) => {
      const d = 120 - i;
      const res = blackScholes({ S: 100, K: 100, T: Math.max(d / 365, 1 / 365), r, sigma });
      return { dte: d, callPrice: +res.call.toFixed(3) };
    });
  }, [sigma]);

  // Vega chart: vary stock price 60–140
  const vegaData = useMemo(() => {
    return Array.from({ length: 81 }, (_, i) => {
      const S = 60 + i;
      const res = blackScholes({ S, K, T: Math.max(T, 1 / 365), r, sigma });
      return { price: S, vega: +res.vega.toFixed(4) };
    });
  }, [T, sigma]);

  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        The Greeks
      </h1>
      <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        The Greeks are risk measures that describe how an option's price responds to changes in market conditions. Delta measures price sensitivity to the underlying stock, Gamma measures the rate of change of delta, Theta captures time decay, and Vega measures sensitivity to implied volatility. Understanding these four numbers is essential for managing any options position.
      </p>

      {/* Sliders */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
          Interactive Controls — Strike fixed at $100
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Slider label="Days to Expiry (DTE)" min={1} max={180} value={dte} onChange={setDte} format={(v) => `${v}d`} />
          <Slider label="Implied Volatility (IV)" min={5} max={80} value={ivPct} onChange={setIvPct} format={(v) => `${v}%`} />
          <Slider label="Stock Price" min={50} max={150} value={spot} onChange={setSpot} format={(v) => `$${v}`} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="g-4" style={{ gap: 16, marginBottom: 48 }}>
        <StatCard label="Delta (Call)" value={current.delta_call.toFixed(3)} sub="$change per $1 stock move" color="#10b981" />
        <StatCard label="Gamma" value={current.gamma.toFixed(4)} sub="Delta change per $1 move" color="#f59e0b" />
        <StatCard label="Theta (Call)" value={`$${current.theta_call.toFixed(3)}`} sub="Value lost per day" color="#ef4444" />
        <StatCard label="Vega" value={`$${current.vega.toFixed(3)}`} sub="Value change per 1% IV" color="#06b6d4" />
      </div>

      {/* Delta Chart */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Delta — Price Sensitivity" color="#10b981" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={deltaData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} domain={[-1, 1]} />
              <Tooltip {...CHART_STYLE.tooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <ReferenceLine x={K} stroke="var(--border)" strokeDasharray="4 4" label={{ value: 'Strike', fill: '#475569', fontSize: 10 }} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Line type="monotone" dataKey="callDelta" name="Call Delta" stroke="#10b981" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="putDelta" name="Put Delta" stroke="#ef4444" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ChartExplanation text="Delta ranges from 0 to +1 for calls and 0 to −1 for puts. An ATM option has ~0.50 delta, meaning it moves about $0.50 for every $1 the stock moves. Deep ITM options approach ±1 (move like the stock), while deep OTM options approach 0. Traders use delta as a rough probability that the option expires in the money." />
      </section>

      {/* Gamma Chart */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Gamma — Delta Acceleration" color="#f59e0b" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={gammaData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} />
              <ReferenceLine x={K} stroke="var(--border)" strokeDasharray="4 4" label={{ value: 'Strike', fill: '#475569', fontSize: 10 }} />
              <Line type="monotone" dataKey="gamma" name="Gamma" stroke="#f59e0b" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ChartExplanation text="Gamma is highest at-the-money and near expiration, forming a bell curve centered on the strike. It measures how quickly your delta (directional exposure) changes. Long options have positive gamma — your delta grows when the stock moves in your favor. Short option sellers face negative gamma, meaning the position works harder against them as the stock moves." />
      </section>

      {/* Theta Decay Chart */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Theta — Time Decay" color="#8b5cf6" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thetaData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="dte" {...CHART_STYLE.xAxis} reversed label={{ value: 'Days to Expiry', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} />
              <ReferenceLine x={dte} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Current DTE', fill: '#6366f1', fontSize: 10 }} />
              <Line type="monotone" dataKey="callPrice" name="ATM Call Price ($)" stroke="#8b5cf6" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ChartExplanation text="Time decay is non-linear — it accelerates sharply in the final 30 days before expiry. An option that's been losing $0.05/day at 60 DTE might be losing $0.20/day at 10 DTE for the same ATM strike. Premium sellers benefit from this acceleration; buyers are hurt by it. The 30–45 DTE range is considered the 'sweet spot' for selling premium because you capture the steepest part of the decay curve." />
      </section>

      {/* Vega Chart */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Vega — Volatility Sensitivity" color="#06b6d4" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={vegaData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} />
              <ReferenceLine x={K} stroke="var(--border)" strokeDasharray="4 4" label={{ value: 'Strike', fill: '#475569', fontSize: 10 }} />
              <Line type="monotone" dataKey="vega" name="Vega ($ per 1% IV)" stroke="#06b6d4" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ChartExplanation text="Vega is highest at-the-money and decreases for deep ITM or OTM options. It represents how much an option's price changes for every 1 percentage point increase in implied volatility. Long options benefit from rising IV (positive vega), short options suffer. This is why buying options before earnings can backfire — even if the stock moves, if IV collapses post-announcement (IV crush), the option loses value." />
      </section>
    </div>
  );
}
