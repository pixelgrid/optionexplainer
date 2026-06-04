import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
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

function InputCard({
  symbol, label, description, min, max, value, onChange, step = 1, format,
}: {
  symbol: string; label: string; description: string; min: number; max: number;
  value: number; onChange: (v: number) => void; step?: number; format: (v: number) => string;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#6366f1' }}>{symbol}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)' }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>{format(value)}</span>
      </div>
      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#6366f1' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginTop: 4 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color = 'var(--text)' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

export function Pricing() {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [dte, setDte] = useState(30);
  const [ivPct, setIvPct] = useState(30);
  const [rPct, setRPct] = useState(5);

  const T = dte / 365;
  const sigma = ivPct / 100;
  const r = rPct / 100;

  const result = useMemo(() => blackScholes({ S, K, T, r, sigma }), [S, K, T, r, sigma]);

  const callVsStockData = useMemo(() => {
    return Array.from({ length: 81 }, (_, i) => {
      const price = 60 + i;
      const res = blackScholes({ S: price, K, T, r, sigma });
      const intrinsic = Math.max(price - K, 0);
      return {
        price,
        call: +res.call.toFixed(3),
        intrinsic: +intrinsic.toFixed(3),
      };
    });
  }, [K, T, r, sigma]);

  const thetaDecayData = useMemo(() => {
    return Array.from({ length: 121 }, (_, i) => {
      const d = 120 - i;
      const res = blackScholes({ S, K: S, T: Math.max(d / 365, 1 / 365), r, sigma });
      return { dte: d, call: +res.call.toFixed(3), put: +res.put.toFixed(3) };
    });
  }, [S, r, sigma]);

  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        How Options Are Priced
      </h1>
      <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        Option prices are determined by five inputs fed into the Black-Scholes model (or similar). Understanding how each input drives price is fundamental to trading options effectively. Use the interactive calculator below to explore how changing each variable affects the theoretical option value.
      </p>

      {/* 5 Inputs */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="The 5 Inputs" color="#6366f1" />
        <div className="g-2" style={{ gap: 16 }}>
          <InputCard
            symbol="S" label="Stock Price" min={50} max={150} value={S} onChange={setS}
            format={(v) => `$${v}`}
            description="The current market price of the underlying stock. Higher stock price increases call value, decreases put value."
          />
          <InputCard
            symbol="K" label="Strike Price" min={50} max={150} value={K} onChange={setK}
            format={(v) => `$${v}`}
            description="The price at which the option can be exercised. For calls, lower strikes are more valuable (deeper ITM). For puts, higher strikes are more valuable."
          />
          <InputCard
            symbol="T" label="Days to Expiry" min={1} max={365} value={dte} onChange={setDte}
            format={(v) => `${v}d`}
            description="More time = more extrinsic value. Options lose value as expiry approaches (theta decay). This erosion accelerates in the final 30 days."
          />
          <InputCard
            symbol="σ" label="Implied Volatility" min={5} max={80} value={ivPct} onChange={setIvPct}
            format={(v) => `${v}%`}
            description="The market's expectation of future price movement. Higher IV inflates both calls and puts. When IV is high, options are expensive; when low, they're cheap."
          />
          <InputCard
            symbol="r" label="Risk-Free Rate" min={0} max={10} step={0.1} value={rPct} onChange={setRPct}
            format={(v) => `${v}%`}
            description="The annualized interest rate (e.g., 3-month T-bill yield). Higher rates increase call values slightly and decrease put values (carry cost effect)."
          />

          {/* Results panel */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', marginBottom: 12 }}>Theoretical Prices &amp; Greeks</div>
            <ResultRow label="Call Price" value={`$${result.call.toFixed(3)}`} color="#10b981" />
            <ResultRow label="Put Price" value={`$${result.put.toFixed(3)}`} color="#ef4444" />
            <ResultRow label="Call Delta" value={result.delta_call.toFixed(4)} color="#10b981" />
            <ResultRow label="Put Delta" value={result.delta_put.toFixed(4)} color="#ef4444" />
            <ResultRow label="Gamma" value={result.gamma.toFixed(5)} color="#f59e0b" />
            <ResultRow label="Theta (Call/day)" value={`$${result.theta_call.toFixed(4)}`} color="#8b5cf6" />
            <ResultRow label="Theta (Put/day)" value={`$${result.theta_put.toFixed(4)}`} color="#8b5cf6" />
            <ResultRow label="Vega (per 1% IV)" value={`$${result.vega.toFixed(4)}`} color="#06b6d4" />
          </div>
        </div>
      </section>

      {/* Call Price vs Stock Price chart */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Call Price vs Stock Price" color="#10b981" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={callVsStockData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n.toFixed(2)}`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <Line type="monotone" dataKey="call" name="Call Price (BS)" stroke="#10b981" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="intrinsic" name="Intrinsic Value" stroke="#475569" dot={false} strokeWidth={1.5} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            The gap between the call price curve and intrinsic value is the extrinsic (time) value. It's highest at the strike price and erodes to zero at expiry.
          </p>
        </div>
      </section>

      {/* Theta decay chart */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Theta Decay — ATM Call &amp; Put Price vs Time" color="#8b5cf6" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thetaDecayData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="dte" {...CHART_STYLE.xAxis} reversed label={{ value: 'Days to Expiry', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n.toFixed(2)}`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <Line type="monotone" dataKey="call" name="ATM Call Price" stroke="#10b981" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="put" name="ATM Put Price" stroke="#ef4444" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            ATM options lose value accelerating toward expiry. Notice the steep drop in the final 30 days — this is why sellers love the 30–45 DTE entry window.
          </p>
        </div>
      </section>

      {/* Why does my call lose money section */}
      <section style={{ marginBottom: 24 }}>
        <SectionHeader title={'Why does my call lose money even when the stock goes up?'} color="#f59e0b" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            This is the most common beginner frustration. There are two culprits:
          </p>
          <div className="g-2" style={{ gap: 16, marginBottom: 16 }}>
            <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>IV Crush</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                You bought a call when IV was 55% (e.g., before earnings). The stock went up 3%, but IV collapsed to 28% after the announcement. The drop in IV wiped out more value than the directional gain added. This is especially brutal on earnings plays.
              </p>
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6', marginBottom: 6 }}>Theta Decay</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                You held a call for 2 weeks while the stock moved sideways, then up 2%. But 14 days of theta ate $0.60 out of your $2.00 option. When the stock finally moved, you were already deep in the hole. Always factor in how many days of decay you're paying for.
              </p>
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 8, fontSize: 14, color: 'var(--text)' }}>
            <strong style={{ color: '#f59e0b' }}>The fix:</strong> Buy options with IVR below 25 so IV can expand rather than crush. Always know your theta cost per day. For directional bets, consider debit spreads — they reduce your vega exposure significantly while keeping directional upside.
          </div>
        </div>
      </section>
    </div>
  );
}
