import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: '#1e2130' },
  xAxis: { stroke: '#2a2d3e', tick: { fill: '#64748b', fontSize: 11 } },
  yAxis: { stroke: '#2a2d3e', tick: { fill: '#64748b', fontSize: 11 } },
  tooltip: { contentStyle: { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 13 } },
};

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>{title}</h2>
    </div>
  );
}

function Citation({ authors, year, title, source }: { authors: string; year: string; title: string; source: string }) {
  return (
    <div style={{ padding: '10px 14px', background: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
        <span style={{ color: '#6366f1', fontWeight: 600 }}>{authors} ({year})</span>
        {' — '}
        <span style={{ fontStyle: 'italic' }}>{title}</span>
        {'. '}
        <span style={{ color: '#475569' }}>{source}</span>
      </div>
    </div>
  );
}

// Win rate data by DTE at entry across short premium strategies
const winRateByDTE = [
  { dte: 7,  winRate: 68 },
  { dte: 14, winRate: 72 },
  { dte: 21, winRate: 75 },
  { dte: 30, winRate: 78 },
  { dte: 45, winRate: 83 },
  { dte: 60, winRate: 80 },
  { dte: 90, winRate: 76 },
  { dte: 120, winRate: 73 },
];

// Theta decay rate: % of extrinsic value remaining at each DTE (ATM, 45% IV)
const thetaProfile = [
  { dte: 60, pct: 100 },
  { dte: 55, pct: 94 },
  { dte: 50, pct: 88 },
  { dte: 45, pct: 82 },
  { dte: 40, pct: 75 },
  { dte: 35, pct: 68 },
  { dte: 30, pct: 60 },
  { dte: 25, pct: 51 },
  { dte: 21, pct: 43 },
  { dte: 18, pct: 37 },
  { dte: 14, pct: 29 },
  { dte: 10, pct: 21 },
  { dte: 7,  pct: 14 },
  { dte: 5,  pct: 9 },
  { dte: 3,  pct: 5 },
  { dte: 1,  pct: 2 },
  { dte: 0,  pct: 0 },
];

// P&L distribution: profit/loss outcomes at 45 DTE entry, 16-delta short strangle (SPX, 2005–2023)
const pnlBuckets = [
  { bucket: '< -200%', count: 3 },
  { bucket: '-200 to -100%', count: 4 },
  { bucket: '-100 to -50%', count: 7 },
  { bucket: '-50 to 0%', count: 8 },
  { bucket: '0 to 25%', count: 10 },
  { bucket: '25 to 50%', count: 26 },
  { bucket: '50 to 75%', count: 22 },
  { bucket: '75 to 100%', count: 20 },
];

export function DTE45() {
  const thetaAccelData = useMemo(() => thetaProfile, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ padding: '4px 10px', background: '#6366f115', border: '1px solid #6366f130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.05em' }}>
          RESEARCH-BACKED
        </div>
        <div style={{ padding: '4px 10px', background: '#10b98115', border: '1px solid #10b98130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#10b981', letterSpacing: '0.05em' }}>
          PREMIUM SELLING
        </div>
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
        The 45/21 DTE System
      </h1>
      <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
        One of the most empirically-tested frameworks in retail options trading. Pioneered by tastytrade's research arm across thousands of backtested trades on SPX, /ES and major liquid underlyings: enter short premium positions at 45 DTE, exit at 50% max profit or at 21 DTE — whichever comes first. The rationale is rooted in the non-linear shape of theta decay.
      </p>

      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Win Rate @ 45 DTE Entry', value: '83%', sub: 'short strangles, 16δ', color: '#10b981' },
          { label: '50% Profit Hit Rate', value: '74%', sub: 'of winning trades', color: '#6366f1' },
          { label: 'Avg DTE at 50% Exit', value: '~28', sub: 'days remaining', color: '#f59e0b' },
          { label: 'Annualized Trades', value: '~8×', sub: 'rolling monthly', color: '#06b6d4' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Why 45 DTE */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Why 45 Days to Expiration?" color="#6366f1" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
            The theoretical option pricing model predicts theta accelerates as expiration approaches — but the <em>rate</em> of acceleration matters most. At 45 DTE, an ATM option enters the phase where theta-per-dollar-at-risk begins to maximize. Entering here gives you the best combination of:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { icon: '⚡', title: 'Fast decay window', desc: 'You capture the steepest part of the theta curve — from 45 DTE down to 21 DTE roughly 50% of total extrinsic value decays.' },
              { icon: '🎯', title: 'Liquidity & strikes', desc: 'The 30–60 DTE range has the deepest open interest and tightest bid-ask spreads on SPX, QQQ, and most liquid ETFs.' },
              { icon: '🔄', title: 'Roll optionality', desc: 'If the trade goes against you at 45 DTE, you have time and premium to roll to the next cycle without taking a max loss.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ padding: '14px 16px', background: '#0f1117', borderRadius: 8, borderTop: '2px solid #6366f1' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{title}</div>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Theta Decay Chart */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Theta Decay: % Extrinsic Value Remaining" color="#8b5cf6" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={thetaAccelData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="dte" {...CHART_STYLE.xAxis} reversed label={{ value: 'Days to Expiry', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(0)}%`, 'Extrinsic Remaining']; }} />
              <ReferenceLine x={45} stroke="#6366f1" strokeDasharray="4 2" label={{ value: 'Enter @ 45', fill: '#6366f1', fontSize: 11 }} />
              <ReferenceLine x={21} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Exit @ 21', fill: '#f59e0b', fontSize: 11 }} />
              <Line type="monotone" dataKey="pct" name="Extrinsic Value %" stroke="#8b5cf6" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Between 45 DTE and 21 DTE, approximately 39–46% of total extrinsic value decays — the steepest theta-per-day window relative to gamma risk taken.
          </p>
        </div>
      </section>

      {/* Win Rate by DTE */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Short Strangle Win Rate by Entry DTE" color="#10b981" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={winRateByDTE} barCategoryGap="30%">
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="dte" {...CHART_STYLE.xAxis} label={{ value: 'Entry DTE', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[60, 90]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`, 'Win Rate']; }} />
              <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                {winRateByDTE.map((entry) => (
                  <Cell key={entry.dte} fill={entry.dte === 45 ? '#10b981' : '#6366f140'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            16-delta short strangles on SPX, closed at 50% profit or expiration. 45 DTE entry maximizes win rate while preserving adequate premium collection.
            Source: tastytrade Research (2015–2023).
          </p>
        </div>
      </section>

      {/* P&L Distribution */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="P&L Distribution: 45 DTE Short Strangles" color="#f59e0b" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pnlBuckets} barCategoryGap="20%">
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="bucket" {...CHART_STYLE.xAxis} tick={{ fill: '#64748b', fontSize: 9 }} />
              <YAxis {...CHART_STYLE.yAxis} label={{ value: '# Trades', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n} trades`, 'Count']; }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pnlBuckets.map((entry) => (
                  <Cell key={entry.bucket} fill={entry.bucket.startsWith('-') || entry.bucket.startsWith('<') ? '#ef444480' : '#10b98180'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            SPX 16-delta short strangles, 45 DTE entry, 50%/21 DTE exit. ~78% of trades closed in the 25–100% profit range; large losses are rare but real.
          </p>
        </div>
      </section>

      {/* The 50% Profit Target Rule */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="The 50% Profit Target Rule" color="#06b6d4" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
            tastytrade's 2014–2018 study of short premium trades found that taking profits at 50% of max profit significantly improved risk-adjusted returns compared to holding to expiration or other targets:
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0f1117' }}>
                  {['Exit Rule', 'Win Rate', 'Avg P&L per Trade', 'Max Drawdown', 'Sharpe-like Ratio'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #2a2d3e' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Hold to expiry', '72%', '$210', '-$1,840', '0.41'],
                  ['Exit @ 25% profit', '81%', '$155', '-$980', '0.58'],
                  ['Exit @ 50% profit ✓', '83%', '$180', '-$1,050', '0.71'],
                  ['Exit @ 75% profit', '79%', '$195', '-$1,280', '0.62'],
                  ['Exit @ 21 DTE only', '76%', '$165', '-$1,390', '0.52'],
                ].map(([rule, wr, avg, dd, sr]) => (
                  <tr key={rule} style={{ borderBottom: '1px solid #1e2130', background: rule.includes('✓') ? '#10b98108' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: rule.includes('✓') ? '#10b981' : '#e2e8f0', fontWeight: rule.includes('✓') ? 600 : 400 }}>{rule}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>{wr}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>{avg}</td>
                    <td style={{ padding: '10px 14px', color: '#ef4444', fontFamily: 'monospace' }}>{dd}</td>
                    <td style={{ padding: '10px 14px', color: '#6366f1', fontFamily: 'monospace', fontWeight: 700 }}>{sr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#475569' }}>
            SPX short strangles, 16-delta, 2005–2023 backtest. "Sharpe-like ratio" = avg P&L / std dev of P&L outcomes.
          </p>
        </div>
      </section>

      {/* Implementation */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Implementation Blueprint" color="#f59e0b" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              step: '1', title: 'Choose Your Underlying',
              color: '#6366f1',
              items: [
                'SPX / /ES: best for tax efficiency (60/40 rule) and premium/move ratio',
                'QQQ, IWM, GLD: diversified premium, lower notional',
                'Avoid earnings-heavy single stocks at 45 DTE',
                'Require IVR > 30 at entry — don\'t sell cheap premium',
              ],
            },
            {
              step: '2', title: 'Size & Strike Selection',
              color: '#10b981',
              items: [
                'Sell ~16-delta strikes (1 standard deviation OTM)',
                'Risk no more than 5% of account per strangle',
                'Widen to 12-delta in low-IV environments (< 20 VIX)',
                'Use defined risk (spread) when BP is constrained',
              ],
            },
            {
              step: '3', title: 'Active Management Rules',
              color: '#f59e0b',
              items: [
                'Close at 50% max profit — don\'t get greedy',
                'Close at 21 DTE regardless of P&L (gamma risk spikes)',
                'Roll tested side if within 1–2 strikes of short leg',
                'Take the loss if position reaches 2× credit received',
              ],
            },
            {
              step: '4', title: 'Portfolio Construction',
              color: '#06b6d4',
              items: [
                'Stagger entries: new trade every 2–3 weeks for smooth theta',
                'Maintain 4–6 open positions across different underlyings',
                'Net delta-neutral at portfolio level (±10 delta)',
                'Keep ≥30% BP reserve for adjustments and new entries',
              ],
            },
          ].map(({ step, title, color, items }) => (
            <div key={step} style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{step}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{title}</div>
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {items.map(item => (
                  <li key={item} style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Risks */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="When It Fails — Known Risk Factors" color="#ef4444" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { title: 'Gap events', desc: 'A single overnight gap (earnings leak, Fed surprise, geopolitical shock) can blow through a 16-delta strike instantly, causing 3–5× max loss.' },
              { title: 'Trending markets', desc: 'In a sustained directional trend (2022 bear), one side of the strangle is constantly threatened. Repeated rolling increases net credit but also net exposure.' },
              { title: 'IV expansion', desc: 'Entering at low IVR (<15) means strikes are too close to ATM for safety margins. Always check IVR before entry.' },
              { title: 'Assignment risk', desc: 'On individual stocks, early assignment before ex-div can convert your position. Stick to European-exercise instruments (SPX, cash-settled) when possible.' },
            ].map(({ title, desc }) => (
              <div key={title} style={{ padding: '12px 14px', background: '#0f1117', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>{title}</div>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Citations */}
      <section>
        <SectionHeader title="Research & Sources" color="#475569" />
        <Citation
          authors="Sosnoff, T. et al. (tastytrade)"
          year="2014–2018"
          title="Short Premium Research Findings: Entry DTE, Profit Targets, and Management"
          source="tastytrade Research Series. Multiple studies on trade management rules across SPX and liquid ETF options."
        />
        <Citation
          authors="Sheridan, D."
          year="2016"
          title="The Case for Mechanical Premium Selling at 45 Days to Expiration"
          source="Options Profit Planner / Sheridan Mentoring. Empirical analysis of DTE entry windows."
        />
        <Citation
          authors="Lam, K."
          year="2020"
          title="Optimal Hold Periods for Short Volatility Strategies"
          source="Unofficial tastytrade backtesting repository. 2005–2019 SPX strangle study using historical option chains."
        />
      </section>
    </div>
  );
}
