import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function StepCard({
  number, title, color, children,
}: { number: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid #2a2d3e', background: `${color}08` }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>{number}</div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#e2e8f0' }}>{title}</h3>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

// P&L data for cash-secured put (strike 145, premium $2)
const cspPnl = Array.from({ length: 61 }, (_, i) => {
  const S = 120 + i;
  const premium = 200;
  const strike = 145;
  const pnl = S >= strike ? premium : premium - (strike - S) * 100;
  return { price: S, pnl };
});

// Covered call P&L (own shares at 143, sell 150 call for $2)
const ccPnl = Array.from({ length: 61 }, (_, i) => {
  const S = 120 + i;
  const costBasis = 143;
  const callStrike = 150;
  const callPremium = 200;
  const stockPnl = (S - costBasis) * 100;
  const callPnl = S <= callStrike ? callPremium : callPremium - (S - callStrike) * 100;
  return { price: S, pnl: stockPnl + callPnl };
});

export function Wheel() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
        The Wheel Strategy
      </h1>
      <p style={{ margin: '0 0 8px', color: '#6366f1', fontSize: 16, fontWeight: 500 }}>
        A systematic income strategy combining cash-secured puts and covered calls
      </p>
      <p style={{ margin: '0 0 40px', color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
        The Wheel (also called the "Triple Income Strategy") is one of the most popular strategies for generating consistent income on stocks you're comfortable owning. It leverages two core option-selling strategies in sequence: first selling cash-secured puts, then selling covered calls if assigned, creating a repeating cycle of premium collection.
      </p>

      {/* Visual cycle diagram */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="The Cycle" color="#6366f1" />
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
            {/* Node 1 */}
            <div style={{ textAlign: 'center', padding: '20px 16px', background: '#10b98118', border: '2px solid #10b981', borderRadius: 12, minWidth: 140 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>💰</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Cash-Secured Put</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Sell OTM put, collect premium</div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
              <div style={{ fontSize: 20, color: '#6366f1' }}>→</div>
              <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, whiteSpace: 'nowrap' }}>If Assigned</div>
            </div>
            {/* Node 2 */}
            <div style={{ textAlign: 'center', padding: '20px 16px', background: '#6366f118', border: '2px solid #6366f1', borderRadius: 12, minWidth: 140 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📦</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>Own 100 Shares</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>At strike − premium</div>
            </div>
            {/* Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
              <div style={{ fontSize: 20, color: '#f59e0b' }}>→</div>
              <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>Sell Covered Call</div>
            </div>
            {/* Node 3 */}
            <div style={{ textAlign: 'center', padding: '20px 16px', background: '#f59e0b18', border: '2px solid #f59e0b', borderRadius: 12, minWidth: 140 }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>📈</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Covered Call</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Sell ATM/OTM call</div>
            </div>
            {/* Arrow back */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px' }}>
              <div style={{ fontSize: 20, color: '#10b981' }}>→</div>
              <div style={{ fontSize: 10, color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>Called Away</div>
            </div>
            {/* Back to start */}
            <div style={{ textAlign: 'center', padding: '16px', background: '#0f1117', borderRadius: 8, border: '1px dashed #2a2d3e', minWidth: 80 }}>
              <div style={{ fontSize: 18 }}>🔄</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Repeat</div>
            </div>
          </div>
        </Card>
      </section>

      {/* Step 1: Cash-Secured Put */}
      <StepCard number={1} title="Sell a Cash-Secured Put" color="#10b981">
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          A cash-secured put means you sell a put option while keeping enough cash in your account to purchase 100 shares if assigned. You immediately collect the premium. Your obligation: buy the shares at the strike price if the stock falls below it at expiry.
        </p>
        <div style={{ padding: '12px 16px', background: '#0f1117', borderRadius: 8, borderLeft: '3px solid #10b981', marginBottom: 14, fontSize: 13, color: '#94a3b8' }}>
          <strong style={{ color: '#10b981' }}>Example:</strong> AAPL trading at $155. Sell the 145-strike put expiring in 30 days for $2.00 premium. You collect <strong style={{ color: '#e2e8f0' }}>$200</strong> immediately. If AAPL stays above $145, the put expires worthless — you keep all $200. Annualized: ($200 / $14,500 reserve × 12) = <strong style={{ color: '#10b981' }}>~16.6% annualized</strong>.
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={cspPnl}>
            <CartesianGrid {...CHART_STYLE.cartesianGrid} />
            <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price at Expiry ($)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} height={40} />
            <YAxis {...CHART_STYLE.yAxis} tickFormatter={(v) => `$${v}`} />
            <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n}`, 'P&L']; }} />
            <ReferenceLine y={0} stroke="#2a2d3e" />
            <ReferenceLine x={145} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Strike $145', fill: '#10b981', fontSize: 10 }} />
            <ReferenceLine x={143} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Breakeven $143', fill: '#f59e0b', fontSize: 10 }} />
            <Line type="monotone" dataKey="pnl" name="P&L" stroke="#10b981" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </StepCard>

      {/* Step 2: Get Assigned */}
      <StepCard number={2} title="Get Assigned — You Now Own Shares" color="#6366f1">
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          If AAPL falls below $145 at expiry, you get assigned — your broker purchases 100 shares at $145 and debits your account $14,500. But you already collected $200 in premium, so your effective cost basis is <strong style={{ color: '#e2e8f0' }}>$143 per share</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ padding: '12px 16px', background: '#0f1117', borderRadius: 8, borderLeft: '3px solid #10b981', fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#10b981' }}>Is This Bad?</strong> Not necessarily. If you chose AAPL because you'd be happy owning it at $143, assignment is simply the next step in the strategy. You've already collected $200 and now you own shares at a discount to where the stock was when you sold the put.
          </div>
          <div style={{ padding: '12px 16px', background: '#0f1117', borderRadius: 8, borderLeft: '3px solid #ef4444', fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#ef4444' }}>Stock Selection Is Everything</strong> This is why the Wheel only works on stocks you genuinely want to own. If you're assigned on a stock that then falls from $145 to $100, your $200 premium barely cushions a $4,500 paper loss. Only run the Wheel on quality names you'd hold anyway.
          </div>
        </div>
      </StepCard>

      {/* Step 3: Covered Call */}
      <StepCard number={3} title="Sell a Covered Call" color="#f59e0b">
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          You now own 100 shares with a $143 cost basis. Sell a covered call at or above your cost basis to collect more premium and reduce your risk. Target the strike where you'd be happy to sell your shares.
        </p>
        <div style={{ padding: '12px 16px', background: '#0f1117', borderRadius: 8, borderLeft: '3px solid #f59e0b', marginBottom: 14, fontSize: 13, color: '#94a3b8' }}>
          <strong style={{ color: '#f59e0b' }}>Example continued:</strong> Sell the 150 call for $2.00. Collect another <strong style={{ color: '#e2e8f0' }}>$200</strong>. Now you've collected $400 total, your effective cost basis is $141. If AAPL stays below $150, the call expires worthless, you keep the $200 and can sell another call next month.
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ccPnl}>
            <CartesianGrid {...CHART_STYLE.cartesianGrid} />
            <XAxis dataKey="price" {...CHART_STYLE.xAxis} label={{ value: 'Stock Price at Expiry ($)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} height={40} />
            <YAxis {...CHART_STYLE.yAxis} tickFormatter={(v) => `$${v}`} />
            <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n}`, 'P&L']; }} />
            <ReferenceLine y={0} stroke="#2a2d3e" />
            <ReferenceLine x={150} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Call Strike $150', fill: '#f59e0b', fontSize: 10 }} />
            <Line type="monotone" dataKey="pnl" name="Combined P&L" stroke="#f59e0b" dot={false} strokeWidth={2.5} />
          </LineChart>
        </ResponsiveContainer>
      </StepCard>

      {/* Step 4: Called Away */}
      <StepCard number={4} title="Get Called Away — Full Cycle Complete" color="#ef4444">
        <p style={{ margin: '0 0 14px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          If AAPL rises above $150 at expiry, your shares are called away at $150. You're back to cash and the cycle begins again.
        </p>
        <div style={{ padding: '12px 16px', background: '#0f1117', borderRadius: 8, borderLeft: '3px solid #10b981', fontSize: 13, color: '#94a3b8' }}>
          <strong style={{ color: '#10b981' }}>Final Tally:</strong> Bought shares at effective $143, sold at $150 = <strong style={{ color: '#e2e8f0' }}>$700 gain</strong> on the stock. Plus $400 in total premium = <strong style={{ color: '#10b981' }}>$1,100 total profit</strong> on $14,500 deployed. In ~60 days: <strong style={{ color: '#10b981' }}>7.6% return (~45% annualized)</strong>. But note: this requires AAPL to be assigned AND recover — a lucky scenario. In a flat/sideways market, you'd collect $200–$400 in premium without the stock move.
        </div>
      </StepCard>

      {/* The Math */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="The Math — Annualized Return" color="#6366f1" />
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Typical CSP: $2 premium on $145 stock</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Premium collected', value: '$200', color: '#10b981' },
                  { label: 'Capital required', value: '$14,500', color: '#94a3b8' },
                  { label: 'Return per cycle', value: '1.38%', color: '#6366f1' },
                  { label: 'Cycles per year (30d)', value: '12', color: '#94a3b8' },
                  { label: 'Annualized (no assignment)', value: '~16.5%', color: '#10b981' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e2130' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>With Assignment + Covered Call</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'CSP premium', value: '$200', color: '#10b981' },
                  { label: 'Covered call premium', value: '$200', color: '#10b981' },
                  { label: 'Stock appreciation (if any)', value: '$700', color: '#10b981' },
                  { label: 'Total profit', value: '$1,100', color: '#10b981' },
                  { label: 'Return on capital', value: '7.6%', color: '#6366f1' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e2130' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Risks */}
      <section style={{ marginBottom: 24 }}>
        <SectionHeader title="Risks — What Can Go Wrong" color="#ef4444" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              title: 'Stock Crashes',
              color: '#ef4444',
              text: 'If you sell a $145 put and the stock falls to $80, you own 100 shares worth $8,000 that you paid $14,500 for. The $200 premium is irrelevant. This is why stock selection is the #1 determinant of Wheel strategy success. Only run the Wheel on companies with strong fundamentals that you\'d genuinely want to own at a discount.',
            },
            {
              title: 'Stock Rockets (Capped Upside)',
              color: '#f59e0b',
              text: 'If you sell a $150 covered call and AAPL goes to $200, your shares get called away at $150. You "miss" the $50 gain above $150. This is the trade-off: you sacrificed upside for premium income. The Wheel isn\'t for stocks you expect to have huge moves — it\'s for stable, range-bound names.',
            },
            {
              title: 'Rolling Indefinitely',
              color: '#8b5cf6',
              text: 'In a falling market, some traders "roll down and out" repeatedly, collecting small credits while their cost basis stays elevated above the current market price. This can trap capital for months. Know when to take the assignment or just close the position — don\'t let the strategy manage you.',
            },
            {
              title: 'Tax Considerations',
              color: '#64748b',
              text: 'Premium from selling puts/calls is typically taxed as short-term capital gains (ordinary income). Frequent assignment and sale of shares can create multiple taxable events per year. Consult a tax advisor, especially for large positions. Tax drag can significantly reduce the apparent returns.',
            },
          ].map(({ title, color, text }) => (
            <div key={title} style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 8 }}>{title}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
