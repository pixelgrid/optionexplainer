import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
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

// Index IV vs weighted avg single-stock IV (correlation premium)
const ivSpreadData = [
  { month: 'Jan', indexIV: 22, stockIV: 28, spread: 6 },
  { month: 'Feb', indexIV: 24, stockIV: 31, spread: 7 },
  { month: 'Mar', indexIV: 20, stockIV: 27, spread: 7 },
  { month: 'Apr', indexIV: 18, stockIV: 24, spread: 6 },
  { month: 'May', indexIV: 26, stockIV: 34, spread: 8 },
  { month: 'Jun', indexIV: 30, stockIV: 38, spread: 8 },
  { month: 'Jul', indexIV: 19, stockIV: 26, spread: 7 },
  { month: 'Aug', indexIV: 23, stockIV: 30, spread: 7 },
  { month: 'Sep', indexIV: 28, stockIV: 36, spread: 8 },
  { month: 'Oct', indexIV: 32, stockIV: 41, spread: 9 },
  { month: 'Nov', indexIV: 21, stockIV: 28, spread: 7 },
  { month: 'Dec', indexIV: 17, stockIV: 23, spread: 6 },
];

// Historical realized correlation vs implied correlation (S&P 500)
const correlationData = [
  { label: '2000 (Dot-com bust)', implied: 42, realized: 58, premium: -16 },
  { label: '2004 (Bull market)', implied: 35, realized: 24, premium: 11 },
  { label: '2008 (Crisis)', implied: 68, realized: 82, premium: -14 },
  { label: '2010 (Recovery)', implied: 40, realized: 28, premium: 12 },
  { label: '2013 (Low vol)', implied: 30, realized: 18, premium: 12 },
  { label: '2017 (Calm)', implied: 25, realized: 14, premium: 11 },
  { label: '2020 (COVID)', implied: 72, realized: 80, premium: -8 },
  { label: '2022 (Bear)', implied: 55, realized: 60, premium: -5 },
  { label: '2023 (Rebound)', implied: 32, realized: 20, premium: 12 },
];

// Monthly P&L of a simple dispersion trade (historical illustration)
const monthlyPnl = [
  { month: 1, pnl: 4.2 }, { month: 2, pnl: 3.8 }, { month: 3, pnl: -8.1 },
  { month: 4, pnl: 5.1 }, { month: 5, pnl: 4.4 }, { month: 6, pnl: -2.3 },
  { month: 7, pnl: 3.9 }, { month: 8, pnl: 5.7 }, { month: 9, pnl: -12.4 },
  { month: 10, pnl: 6.2 }, { month: 11, pnl: 4.1 }, { month: 12, pnl: 3.5 },
];

export function Dispersion() {
  return (
    <div className="page-wrap">
      <div className="badge-row">
        <div style={{ padding: '4px 10px', background: '#06b6d415', border: '1px solid #06b6d430', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#06b6d4', letterSpacing: '0.05em' }}>
          INSTITUTIONAL GRADE
        </div>
        <div style={{ padding: '4px 10px', background: '#6366f115', border: '1px solid #6366f130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.05em' }}>
          VOLATILITY ARBITRAGE
        </div>
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        Dispersion Trading
      </h1>
      <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        Dispersion trading harvests the <strong style={{ color: 'var(--text)' }}>correlation risk premium</strong> — the systematic overpricing of index implied volatility relative to the weighted average IV of its constituent stocks. When correlations between stocks are lower than the market prices in, selling index vol and buying single-stock vol generates a profit. Driessen, Maenhout & Vilkov (2009) documented an average premium of 5–9% per month in the pre-2007 era; subsequent research has confirmed a persistent (if smaller) premium post-2008.
      </p>

      {/* Key Stats */}
      <div className="g-4" style={{ gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Correlation Premium', value: '5–9%', sub: 'per month (Driessen 2009)', color: '#06b6d4' },
          { label: 'Sharpe Ratio (pre-2000)', value: '1.2', sub: 'Deng (2008)', color: '#10b981' },
          { label: 'Avg IV Spread', value: '+7pp', sub: 'index vs stock avg', color: '#6366f1' },
          { label: 'Strategy Capacity', value: 'High', sub: 'scales to $100M+', color: '#f59e0b' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* The Core Idea */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="The Core Idea: Index Vol vs Stock Vol" color="#06b6d4" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            An index like the S&P 500 is a portfolio of correlated stocks. Its realized volatility depends on two things: individual stock volatilities and the correlations between them. The key mathematical identity is:
          </p>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 20px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 16, color: 'var(--text-h)', lineHeight: 2 }}>
              σ<sub>index</sub>² ≈ Σᵢ wᵢ² σᵢ² + 2 Σᵢ&lt;ⱼ wᵢ wⱼ ρᵢⱼ σᵢ σⱼ
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#475569' }}>
              If realized correlation ρ is lower than implied by index IV, selling index vol and buying stock vol will profit.
            </p>
          </div>
          <div className="g-2" style={{ gap: 16 }}>
            <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Sell Side</div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                Short straddle or strangle on the index (SPX, QQQ). You collect premium on the overpriced index vol. This is the core "alpha" — index vol is chronically too expensive because investors pay for portfolio protection.
              </p>
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Buy Side</div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                Long straddle or strangle on top N constituent stocks (AAPL, MSFT, AMZN, etc.), vega-weighted to offset index short. You hedge systemic moves while staying long idiosyncratic vol.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IV Spread Chart */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Index IV vs Weighted Single-Stock IV" color="#6366f1" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ivSpreadData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="month" {...CHART_STYLE.xAxis} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(1)}%`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <Line type="monotone" dataKey="indexIV" name="Index IV (SPX)" stroke="#6366f1" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="stockIV" name="Weighted Stock IV" stroke="#f59e0b" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="spread" name="IV Spread (Opportunity)" stroke="#10b981" dot={false} strokeWidth={2} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Illustrative data. Individual stock IVs typically run 6–9 points above index IV on a weighted basis — this spread is the dispersion trader's edge.
          </p>
        </div>
      </section>

      {/* Historical Correlation Data */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Implied vs Realized Correlation: Historical Premium" color="#10b981" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <div className="tbl-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Period', 'Implied Correlation', 'Realized Correlation', 'Premium'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationData.map(({ label, implied, realized, premium }) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-h)' }}>{label}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text)', fontFamily: 'monospace' }}>{implied}%</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text)', fontFamily: 'monospace' }}>{realized}%</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: premium > 0 ? '#10b981' : '#ef4444' }}>
                      {premium > 0 ? '+' : ''}{premium}pp
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#475569' }}>
            Crisis years (2000, 2008, 2020) see realized correlation exceed implied — the strategy loses when stocks all fall together. In calm and recovery regimes, the premium is consistently positive.
          </p>
        </div>
      </section>

      {/* Monthly P&L */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Illustrative Monthly P&L: Dispersion Trade" color="#f59e0b" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPnl} barCategoryGap="20%">
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="month" {...CHART_STYLE.xAxis} label={{ value: 'Month', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(1)}%`, 'P&L']; }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="pnl" name="Monthly P&L" radius={[4, 4, 0, 0]}>
                {monthlyPnl.map((entry) => (
                  <Bar key={entry.month} dataKey="pnl" fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Typical dispersion trade P&L profile: frequent small gains, occasional large losses during correlation spikes (months 3, 9). Source: illustrative, based on Deng (2008) return structure.
          </p>
        </div>
      </section>

      {/* Implementation */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Trade Construction (Retail-Accessible Version)" color="#8b5cf6" />
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Institutional dispersion involves 50+ single-stock positions and sophisticated correlation swaps. A simplified version accessible to retail traders:
          </p>
          <div className="g-2" style={{ gap: 16 }}>
            {[
              {
                step: 'Step 1: Short Index Vol',
                color: '#6366f1',
                items: [
                  'Sell ATM straddle on SPX / QQQ (45 DTE)',
                  'Note the vega collected (e.g., $450 vega per lot)',
                  'This is your "negative correlation" leg',
                ],
              },
              {
                step: 'Step 2: Long Stock Vol',
                color: '#f59e0b',
                items: [
                  'Buy ATM straddles on top 5 SPX components (by weight)',
                  'Size so combined vega ≈ 80–100% of index vega sold',
                  'AAPL, MSFT, NVDA, AMZN, META (current)',
                ],
              },
              {
                step: 'Step 3: Monitor Correlation',
                color: '#10b981',
                items: [
                  'Watch the CBOE Implied Correlation Index (COR3M)',
                  'If COR3M spikes > 70: reduce position or exit',
                  'Profit materializes as stocks diverge (low realized ρ)',
                ],
              },
              {
                step: 'Step 4: Risk Controls',
                color: '#ef4444',
                items: [
                  'Exit entire position if total loss > 2× initial debit',
                  'Reduce during macro events (FOMC, NFP) — all stocks correlate',
                  'Never run through earnings on stock legs',
                ],
              },
            ].map(({ step, color, items }) => (
              <div key={step} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 10 }}>{step}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {items.map(item => (
                    <li key={item} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, marginBottom: 3 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Section */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Correlation Spike Risk" color="#ef4444" />
        <div style={{ padding: '16px 20px', background: '#ef444410', border: '1px solid #ef444430', borderRadius: 10 }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            <strong style={{ color: '#ef4444' }}>The fatal scenario</strong>: a systemic crash where all stocks crash together (March 2020, October 2008). Realized correlation surges to 0.85+ — your short index vol position loses while your long stock vol positions don't profit enough to offset. This is the strategy's "jump risk."
          </p>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {[
              'During COVID (Feb–Mar 2020): dispersion trades lost 3–6 months of cumulative gains in 3 weeks',
              'The position has positive carry (theta from short index, negative theta from long stocks netting out)',
              'Diversify across multiple index families (SPX, NDX, RUT) to reduce single-regime exposure',
              'Size conservatively: risk no more than 3–5% of NAV on a full dispersion book',
            ].map(item => (
              <li key={item} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Citations */}
      <section>
        <SectionHeader title="Research & Sources" color="#475569" />
        <Citation
          authors="Driessen, J., Maenhout, P. J., & Vilkov, G."
          year="2009"
          title="The Price of Correlation Risk: Evidence from Equity Options"
          source="Journal of Finance, 64(3), 1377–1406. Documents 5–9%/month correlation risk premium in S&P 500 options."
        />
        <Citation
          authors="Deng, Q."
          year="2008"
          title="Volatility Dispersion Trading"
          source="Working Paper. Reports Sharpe ratio of 1.2 for pre-2000 dispersion strategies; lower but still positive post-2000."
        />
        <Citation
          authors="Bossu, S."
          year="2006"
          title="Theory and Practice of Variance Dispersion Trading"
          source="Presentation, Goldman Sachs Equity Derivatives. Practical construction guide for institutional dispersion books."
        />
        <Citation
          authors="Carr, P., & Madan, D."
          year="1998"
          title="Towards a Theory of Volatility Trading"
          source="In 'Volatility: New Estimation Techniques for Pricing Derivatives', Risk Books. Foundational theory for variance replication."
        />
      </section>
    </div>
  );
}
