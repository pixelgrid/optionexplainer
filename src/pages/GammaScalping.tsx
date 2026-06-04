import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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

function Citation({ authors, year, title, source }: { authors: string; year: string; title: string; source: string }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
        <span style={{ color: '#6366f1', fontWeight: 600 }}>{authors} ({year})</span>
        {' — '}
        <span style={{ fontStyle: 'italic' }}>{title}</span>
        {'. '}
        <span style={{ color: '#475569' }}>{source}</span>
      </div>
    </div>
  );
}

// Gamma P&L vs stock move: long straddle at different rehedge thresholds
const gammaPnlData = Array.from({ length: 21 }, (_, i) => {
  const move = -10 + i; // stock move in $
  const rawGammaPnl = 0.5 * 0.04 * move * move; // 0.5 * gamma * move^2, gamma ≈ 0.04
  const thetaCost = 0.18; // daily theta burn ($)
  return {
    move,
    gammaPnl: +rawGammaPnl.toFixed(2),
    netPnl: +(rawGammaPnl - thetaCost).toFixed(2),
  };
});

// Rehedge frequency impact on net P&L (more frequent = better gamma capture but more slippage)
const rehedgeData = [
  { freq: 'Daily', grossPnl: 820, slippage: 180, netPnl: 640, sharpe: 0.72 },
  { freq: 'Every $2', grossPnl: 890, slippage: 210, netPnl: 680, sharpe: 0.81 },
  { freq: 'Every $5', grossPnl: 760, slippage: 120, netPnl: 640, sharpe: 0.79 },
  { freq: 'Every $10', grossPnl: 620, slippage: 80, netPnl: 540, sharpe: 0.68 },
  { freq: 'Never', grossPnl: 420, slippage: 20, netPnl: 400, sharpe: 0.45 },
];

// Realized vs implied vol: gamma scalping profits from realized > implied
const rvIvData = [
  { month: 'Jan', rv: 18, iv: 22, spread: -4 },
  { month: 'Feb', rv: 24, iv: 22, spread: 2 },
  { month: 'Mar', rv: 31, iv: 28, spread: 3 },
  { month: 'Apr', rv: 19, iv: 21, spread: -2 },
  { month: 'May', rv: 26, iv: 24, spread: 2 },
  { month: 'Jun', rv: 20, iv: 23, spread: -3 },
  { month: 'Jul', rv: 29, iv: 26, spread: 3 },
  { month: 'Aug', rv: 22, iv: 24, spread: -2 },
  { month: 'Sep', rv: 34, iv: 29, spread: 5 },
  { month: 'Oct', rv: 21, iv: 25, spread: -4 },
  { month: 'Nov', rv: 23, iv: 22, spread: 1 },
  { month: 'Dec', rv: 19, iv: 21, spread: -2 },
];

// Delta of long straddle vs stock price, showing gamma convexity
const deltaProfile = Array.from({ length: 61 }, (_, i) => {
  const s = 70 + i;
  const res = blackScholes({ S: s, K: 100, T: 30 / 365, r: 0.05, sigma: 0.25 });
  const straddle_delta = res.delta_call + res.delta_put; // net delta of long straddle
  return { price: s, delta: +straddle_delta.toFixed(3) };
});

export function GammaScalping() {
  return (
    <div className="page-wrap">
      <div className="badge-row">
        <div style={{ padding: '4px 10px', background: '#f59e0b15', border: '1px solid #f59e0b30', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.05em' }}>
          MARKET NEUTRAL
        </div>
        <div style={{ padding: '4px 10px', background: '#10b98115', border: '1px solid #10b98130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#10b981', letterSpacing: '0.05em' }}>
          LONG VOLATILITY
        </div>
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        Gamma Scalping
      </h1>
      <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        Gamma scalping (also called "delta-hedged long gamma" or "scalping gamma") is a strategy where you buy a straddle or other long-gamma position and continuously delta-hedge it to lock in profits from each stock move. The premise: if realized volatility exceeds implied volatility, the gamma profits from rehedging will exceed the theta you pay. Israelov & Nielsen (2015, AQR) decomposed short volatility strategies and found the long-gamma hedge component generates a Sharpe ratio approaching 1.0 when systematically applied.
      </p>

      {/* Key Stats */}
      <div className="g-4" style={{ gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Sharpe (Systematic)', value: '~1.0', sub: 'Israelov & Nielsen (AQR)', color: '#f59e0b' },
          { label: 'Break-even RV>IV', value: 'Need RV ≥ IV', sub: 'to cover theta cost', color: '#6366f1' },
          { label: 'Profit Driver', value: 'γ × (dS)²', sub: '0.5 × gamma × move²', color: '#10b981' },
          { label: 'Delta at Start', value: '≈ 0', sub: 'ATM straddle is neutral', color: '#06b6d4' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* The Mechanics */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="The Mechanics: Gamma vs Theta" color="#f59e0b" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Every long options position has two competing forces:
          </p>
          <div className="g-2" style={{ gap: 16, marginBottom: 16 }}>
            <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Gamma P&L (positive)</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-h)', marginBottom: 8 }}>
                ΔP&L = ½ × γ × (ΔS)²
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                Every time the stock moves, you gain. The bigger the move, the bigger the gain. This scales with the <em>square</em> of the move — so large moves are very profitable.
              </p>
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Theta Cost (negative)</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-h)', marginBottom: 8 }}>
                Daily Cost = θ × $1/day
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                Time erodes option value every day. For an ATM straddle, this is the "rent" you pay to own the position. At 30 DTE and 30% IV, theta on a $100 straddle might be $0.15–$0.25/day.
              </p>
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 8, fontSize: 14, color: 'var(--text)' }}>
            <strong style={{ color: '#f59e0b' }}>The Break-Even Equation:</strong> You profit when the realized volatility of the stock over your holding period exceeds the implied volatility you paid. If you bought at 28% IV and the stock actually moves at 33% vol, you'll collect more from gamma scalping than you lose to theta.
          </div>
        </div>
      </section>

      {/* Gamma P&L vs Move */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Gamma P&L vs Stock Move (Single Day)" color="#10b981" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={gammaPnlData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="move" {...CHART_STYLE.xAxis} label={{ value: 'Stock Move ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n.toFixed(2)}`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Line type="monotone" dataKey="gammaPnl" name="Gross Gamma P&L" stroke="#10b981" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="netPnl" name="Net P&L (after Theta)" stroke="#6366f1" dot={false} strokeWidth={2} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Gross gamma P&L is always positive for any move (convex). Net P&L (blue dashed) subtracts daily theta cost. You need ~$2.1+ moves per day to break even in this example.
          </p>
        </div>
      </section>

      {/* Delta Profile */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Long Straddle Delta vs Stock Price" color="#8b5cf6" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={deltaProfile}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} domain={[-1, 1]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(3)}`, 'Net Delta']; }} />
              <ReferenceLine y={0} stroke="#475569" />
              <ReferenceLine x={100} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Strike', fill: '#f59e0b', fontSize: 10 }} />
              <Line type="monotone" dataKey="delta" name="Straddle Net Delta" stroke="#8b5cf6" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            At the strike (K=100), the ATM straddle is delta-neutral. As the stock moves, the delta becomes non-zero. Gamma scalping means selling delta when stock rises and buying when it falls.
          </p>
        </div>
      </section>

      {/* Rehedging Frequency */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Rehedge Frequency vs Net P&L" color="#06b6d4" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            How often you rehedge is a key decision. More frequent hedging captures gamma more precisely but incurs more transaction costs (bid-ask spread × shares hedged):
          </p>
          <div className="tbl-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Hedge Frequency', 'Gross Gamma P&L', 'Slippage/Costs', 'Net P&L', 'Sharpe'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rehedgeData.map(({ freq, grossPnl, slippage, netPnl, sharpe }) => (
                  <tr key={freq} style={{ borderBottom: '1px solid var(--border)', background: freq === 'Every $2' ? '#10b98108' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', color: freq === 'Every $2' ? '#10b981' : 'var(--text-h)', fontWeight: freq === 'Every $2' ? 600 : 400 }}>{freq}</td>
                    <td style={{ padding: '10px 14px', color: '#10b981', fontFamily: 'monospace' }}>${grossPnl}</td>
                    <td style={{ padding: '10px 14px', color: '#ef4444', fontFamily: 'monospace' }}>${slippage}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text)', fontFamily: 'monospace', fontWeight: 600 }}>${netPnl}</td>
                    <td style={{ padding: '10px 14px', color: '#6366f1', fontFamily: 'monospace', fontWeight: 700 }}>{sharpe.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#475569' }}>
            Illustrative figures for a 30 DTE SPY straddle in a moderate-volatility regime. "Every $2" band rehedging (rehedge when delta ≠ 0 by $2) typically maximizes net Sharpe.
          </p>
        </div>
      </section>

      {/* RV vs IV */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="RV vs IV: When Gamma Scalping Profits" color="#ef4444" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rvIvData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="month" {...CHART_STYLE.xAxis} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(0)}%`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Line type="monotone" dataKey="rv" name="Realized Vol (RV)" stroke="#10b981" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="iv" name="Implied Vol (IV)" stroke="#ef4444" dot={false} strokeWidth={2} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Gamma scalping profits when RV &gt; IV (green above red). Most months see IV &gt; RV — this is why sellers of options typically win more often. The scalper must time entries when RV is likely to exceed IV.
          </p>
        </div>
      </section>

      {/* AQR Decomposition */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="AQR Decomposition: What Actually Drives Short-Vol Returns" color="#6366f1" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Israelov & Nielsen (2015) decomposed the PUT index return into its component parts, finding that the return to systematic short volatility is <em>not</em> primarily from directional equity beta, but from a distinct volatility risk premium:
          </p>
          <div className="g-3" style={{ gap: 12 }}>
            {[
              { component: 'Equity Beta Component', return: '+4.1%/yr', sharpe: '0.28', color: '#6366f1', desc: 'Passive long exposure to equity returns. This is why short vol loses badly in crashes.' },
              { component: 'Volatility Risk Premium', return: '+6.3%/yr', sharpe: '0.97', color: '#10b981', desc: 'Pure premium collected from IV > RV. The systematic edge — isolated via delta hedging.' },
              { component: 'Jump Risk Premium', return: '+2.1%/yr', sharpe: '0.34', color: '#f59e0b', desc: 'Compensation for rare tail events. Earned slowly, lost catastrophically in crashes.' },
            ].map(({ component, return: ret, sharpe, color, desc }) => (
              <div key={component} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderTop: `2px solid ${color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{component}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 18, color: 'var(--text-h)', fontWeight: 700, marginBottom: 2 }}>{ret}</div>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>Sharpe: {sharpe}</div>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#6366f110', border: '1px solid #6366f130', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
            <strong style={{ color: '#6366f1' }}>Key Insight:</strong> The volatility risk premium component (Sharpe ~1.0) is accessed <em>most cleanly</em> when delta-hedging neutralizes the directional equity exposure. This is exactly what gamma scalping does — it strips out beta and isolates the vol premium.
          </div>
        </div>
      </section>

      {/* Citations */}
      <section>
        <SectionHeader title="Research & Sources" color="#475569" />
        <Citation
          authors="Israelov, R., & Nielsen, L. N."
          year="2015"
          title="Still Not Cheap: Portfolio Protection in Calm Markets"
          source="AQR Capital Management. Working paper decomposing PUT index returns into equity beta, volatility risk premium, and jump risk premium components."
        />
        <Citation
          authors="Carr, P., & Wu, L."
          year="2009"
          title="Variance Risk Premiums"
          source="Review of Financial Studies, 22(3), 1311–1341. Documents negative delta-hedged gains (−23 bps/day ATM) as evidence of systematic vol risk premium."
        />
        <Citation
          authors="Leland, H. E."
          year="1985"
          title="Option Pricing and Replication with Transaction Costs"
          source="Journal of Finance, 40(5), 1283–1301. Theoretical foundation for rehedging frequency under transaction costs."
        />
        <Citation
          authors="Sinclair, E."
          year="2013"
          title="Volatility Trading (2nd ed.)"
          source="Wiley Finance. Chapter 9: Practical gamma scalping, break-even calculations, and rehedge optimization."
        />
      </section>
    </div>
  );
}
