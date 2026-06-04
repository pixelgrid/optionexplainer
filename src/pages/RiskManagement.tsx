import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

// Drawdown comparison: 5% vs 1% risk per trade, 20 consecutive losses
const drawdownData = Array.from({ length: 21 }, (_, i) => {
  const acct1pct = Math.pow(1 - 0.01, i) * 100;
  const acct5pct = Math.pow(1 - 0.05, i) * 100;
  return {
    trade: i,
    '1% Risk': +acct1pct.toFixed(2),
    '5% Risk': +acct5pct.toFixed(2),
  };
});

export function RiskManagement() {
  const [portfolioSize, setPortfolioSize] = useState(25000);
  const [riskPct, setRiskPct] = useState(1);
  const [strategyType, setStrategyType] = useState<'defined' | 'undefined' | 'long'>('defined');

  const sizing = useMemo(() => {
    const maxDollarRisk = portfolioSize * (riskPct / 100);
    let spreadWidth = 5; // typical $5-wide spread
    let maxContracts = 0;
    let notes = '';

    if (strategyType === 'defined') {
      // For a $5-wide spread, max loss is $500/contract (minus credit)
      // Risk is (spread width - credit) × 100
      const riskPerContract = (spreadWidth - 0.5) * 100; // assume $0.50 credit
      maxContracts = Math.floor(maxDollarRisk / riskPerContract);
      notes = `Based on $${spreadWidth}-wide spread with $0.50 credit = $${riskPerContract} max risk/contract`;
    } else if (strategyType === 'undefined') {
      // Naked put: keep position to 1% of portfolio net liq
      // Position size = 1% rule means margin of ~20% stock × 100 shares
      const stockPrice = 100; // assumed
      maxContracts = Math.max(1, Math.floor((portfolioSize * 0.01) / (stockPrice * 0.01 * 100)));
      notes = `Undefined risk: size so margin requirement ≤ 1% of net liq per position. Approx ${maxContracts} contract(s) at $100 stock.`;
    } else {
      // Long options: treat as debit
      const premiumPerContract = 200; // assumed
      maxContracts = Math.floor(maxDollarRisk / premiumPerContract);
      notes = `Long options: max dollar risk is the full premium. Assuming $2.00 ($200) option cost.`;
    }

    return { maxDollarRisk, maxContracts, notes };
  }, [portfolioSize, riskPct, strategyType]);

  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        Risk Management
      </h1>
      <p style={{ margin: '0 0 40px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        The number one cause of options trading failure is not picking the wrong direction — it's sizing positions too large and letting a single bad trade wipe out months of consistent gains. Risk management is the unsexy part of options trading that separates professionals from gamblers.
      </p>

      {/* Section 1: 1-2% Rule */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="The 1-2% Rule" color="#6366f1" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          Never risk more than 1–2% of your total portfolio on a single trade. This sounds conservative, but consider what happens after a run of 20 consecutive losses (which can happen even with 70%+ win-rate strategies during adverse markets). At 5% risk per trade, you'd be down 64%. At 1% risk, you'd be down only 18% — still functional and recoverable.
        </p>
        <Card>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={drawdownData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="trade" {...CHART_STYLE.xAxis} label={{ value: 'Consecutive Losses', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[0, 105]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(1)}%`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <Line type="monotone" dataKey="1% Risk" stroke="#10b981" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="5% Risk" stroke="#ef4444" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            After 20 consecutive losses: 1% risk per trade → account at 82% | 5% risk per trade → account at 36%
          </p>
        </Card>
      </section>

      {/* Section 2: Position Sizing Calculator */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Position Sizing Calculator" color="#10b981" />
        <Card>
          <div className="g-2" style={{ gap: 20, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
                Portfolio Size
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input
                  type="number"
                  value={portfolioSize}
                  onChange={(e) => setPortfolioSize(Number(e.target.value))}
                  style={{
                    flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6,
                    padding: '8px 12px', color: 'var(--text-h)', fontSize: 14, fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text)' }}>Risk % per Trade</label>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>{riskPct}%</span>
              </div>
              <input
                type="range" min={0.5} max={5} step={0.5} value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: riskPct > 2 ? '#ef4444' : '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                <span>0.5% (safe)</span><span style={{ color: riskPct > 2 ? '#ef4444' : '#475569' }}>5% (aggressive)</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>Strategy Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'defined', label: 'Defined Risk Spread' },
                { key: 'undefined', label: 'Undefined Risk (Naked)' },
                { key: 'long', label: 'Long Options (Debit)' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStrategyType(key as typeof strategyType)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: `1px solid ${strategyType === key ? '#6366f1' : 'var(--border)'}`,
                    background: strategyType === key ? '#6366f118' : 'transparent',
                    color: strategyType === key ? '#6366f1' : 'var(--text-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 20px', border: '1px solid var(--border)' }}>
            <div className="g-3" style={{ gap: 16, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Max Dollar Risk</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: riskPct > 2 ? '#ef4444' : '#10b981', fontFamily: 'monospace' }}>
                  ${sizing.maxDollarRisk.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Max Contracts</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>
                  {sizing.maxContracts}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>As % of Portfolio</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
                  {riskPct}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>{sizing.notes}</div>
          </div>
        </Card>
      </section>

      {/* Section 3: Strategy-Specific Rules */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Strategy-Specific Rules" color="#8b5cf6" />
        <Card style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Strategy', 'Risk Type', 'Suggested Max Risk per Trade', 'Notes'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { strategy: 'Iron Condor / Vertical Spread', risk: 'Defined', max: '2–5% of portfolio', note: 'Max loss is capped. Can go slightly larger.' },
                { strategy: 'Cash-Secured Put / Covered Call', risk: 'Defined (by stock)', max: '1–2% premium risk', note: 'Stock risk is the real risk. Size by how much stock drop you can absorb.' },
                { strategy: 'Naked Put / Call', risk: 'Undefined', max: '1% of net liq', note: 'Margin required is large. Never exceed 5% margin in one position.' },
                { strategy: 'Long Call / Put', risk: 'Defined (debit)', max: '0.5–1% of portfolio', note: 'Treat as lottery ticket. Assume 100% loss is possible.' },
                { strategy: 'Debit Spread', risk: 'Defined', max: '1–2% of portfolio', note: 'Defined risk, but often lower win rate. Size conservatively.' },
                { strategy: 'Straddle / Strangle', risk: 'Defined (long)', max: '0.5–1% of portfolio', note: 'IV crush risk is significant. Size very small.' },
              ].map((row, i) => (
                <tr key={row.strategy} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-h)', fontWeight: 500 }}>{row.strategy}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      color: row.risk === 'Defined' ? '#10b981' : '#ef4444',
                      background: row.risk === 'Defined' ? '#10b98118' : '#ef444418',
                    }}>{row.risk}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#6366f1', fontWeight: 600, fontFamily: 'monospace' }}>{row.max}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Section 4: The 16% Rule */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="The 16% Rule — Margin Safety Buffer" color="#f59e0b" />
        <Card style={{ borderLeft: '3px solid #f59e0b' }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            When selling undefined risk options, keep at least <strong style={{ color: '#f59e0b' }}>16× your maximum loss</strong> available in cash or liquid assets. This ensures a single large adverse move (a "16σ" event is essentially impossible, but even a "3σ" event won't wipe you out).
          </p>
          <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
            <strong style={{ color: '#f59e0b' }}>Example:</strong> You sell a naked put on XYZ. If the stock drops 15% overnight (a common earnings gap), your max realistic loss might be $2,000. The 16× rule says you should have $32,000 in your account before entering this trade. This prevents margin calls from forced liquidation during volatile markets.
          </div>
        </Card>
      </section>

      {/* Section 5: Correlation */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Correlation &amp; Portfolio Risk" color="#ef4444" />
        <div className="g-2" style={{ gap: 16 }}>
          <Card style={{ borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>The Illusion of Diversification</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>
              Having 10 short puts on AAPL, MSFT, GOOGL, META, NVDA, AMD, TSLA, AMZN, CRM, and ADBE is NOT diversification. They are all tech stocks with 0.85+ correlation. In a tech selloff, all 10 go against you simultaneously. You effectively have 10× the position in "tech short vol."
            </p>
          </Card>
          <Card style={{ borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Real Diversification</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>
              Spread across uncorrelated sectors: tech, healthcare, energy, consumer staples, financials, commodities, bonds. Limit to 1–2 positions per sector. Consider a short VIX position separate from individual stock positions. Correlation breaks down exactly when you need it most — in a crisis.
            </p>
          </Card>
        </div>
      </section>

      {/* Section 6: Profit Taking */}
      <section style={{ marginBottom: 24 }}>
        <SectionHeader title="Systematic Profit Taking Rules" color="#10b981" />
        <Card>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Having pre-defined exit rules removes emotion from your trading. Without rules, you'll hold winners too long (greed) and close losers too early (fear) — both of which degrade your returns.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              {
                rule: 'Close at 50% of Max Profit',
                color: '#10b981',
                text: 'For credit trades (spreads, CSPs, iron condors): buy back the spread when you\'ve captured 50% of the premium. A trade you sold for $1.00 closes when you can buy it back for $0.50. This eliminates your risk for the second half of the trade, freeing up capital for a new position. Research shows 50% take-profit outperforms holding to expiry on a risk-adjusted basis.',
              },
              {
                rule: 'Cut Losses at 2× Credit Received',
                color: '#ef4444',
                text: 'For credit trades: if you collected $1.00 and it grows to a $2.00 loss ($2.00 debit to close), exit. Don\'t hope for a recovery. Take the $1.00 net loss and reset. Three 50% winners and one 2× loser = net profitable. Three 50% winners and one 5× loser = deep in the hole.',
              },
              {
                rule: 'Long Options: Set a Timer, Not Just a Target',
                color: '#8b5cf6',
                text: 'For debit trades: set a maximum holding period. If you buy a call with 45 DTE and it hasn\'t worked in 20 days, close it — you\'ve now paid for 20 days of theta with nothing to show. Never let a debit position decay to worthless; sell when it still has residual value.',
              },
            ].map(({ rule, color, text }) => (
              <div key={rule} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6 }}>{rule}</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>{text}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
