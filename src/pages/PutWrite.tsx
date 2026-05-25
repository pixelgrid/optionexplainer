import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
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

// PUT Index vs S&P 500: normalized growth $100 starting 1986
const growthData = [
  { year: '1986', put: 100, spx: 100 },
  { year: '1990', put: 118, spx: 110 },
  { year: '1994', put: 152, spx: 138 },
  { year: '1998', put: 220, spx: 248 },
  { year: '2000', put: 261, spx: 246 },
  { year: '2002', put: 228, spx: 168 },
  { year: '2004', put: 268, spx: 196 },
  { year: '2007', put: 368, spx: 272 },
  { year: '2009', put: 272, spx: 172 },
  { year: '2013', put: 450, spx: 330 },
  { year: '2017', put: 590, spx: 490 },
  { year: '2019', put: 640, spx: 560 },
  { year: '2020', put: 520, spx: 520 },
  { year: '2021', put: 680, spx: 700 },
  { year: '2023', put: 720, spx: 720 },
];

// Rolling annual returns by year
const annualReturns = [
  { year: '2000', put: 7.3, spx: -9.1 },
  { year: '2001', put: 4.8, spx: -11.9 },
  { year: '2002', put: -12.4, spx: -22.1 },
  { year: '2003', put: 22.1, spx: 28.7 },
  { year: '2004', put: 11.2, spx: 10.9 },
  { year: '2005', put: 8.7, spx: 4.9 },
  { year: '2006', put: 14.3, spx: 15.8 },
  { year: '2007', put: 11.9, spx: 5.5 },
  { year: '2008', put: -26.8, spx: -37.0 },
  { year: '2009', put: 18.4, spx: 26.5 },
  { year: '2010', put: 13.1, spx: 15.1 },
  { year: '2011', put: 4.2, spx: 2.1 },
  { year: '2012', put: 15.8, spx: 16.0 },
  { year: '2013', put: 28.2, spx: 32.4 },
  { year: '2014', put: 13.2, spx: 13.7 },
  { year: '2015', put: 3.1, spx: 1.4 },
  { year: '2016', put: 14.9, spx: 12.0 },
  { year: '2017', put: 14.6, spx: 21.8 },
  { year: '2018', put: -6.1, spx: -4.4 },
  { year: '2019', put: 20.4, spx: 31.5 },
  { year: '2020', put: -1.2, spx: 18.4 },
  { year: '2021', put: 22.4, spx: 28.7 },
  { year: '2022', put: -18.4, spx: -18.1 },
  { year: '2023', put: 18.2, spx: 26.3 },
];

// Risk metrics comparison
const riskMetrics = [
  { metric: 'Annualized Return', put: '10.8%', spx: '10.2%', winner: 'PUT' },
  { metric: 'Annualized Std Dev', put: '9.4%', spx: '15.1%', winner: 'PUT' },
  { metric: 'Sharpe Ratio', put: '0.65', spx: '0.49', winner: 'PUT' },
  { metric: 'Max Drawdown', put: '-32.7%', spx: '-50.9%', winner: 'PUT' },
  { metric: 'Sortino Ratio', put: '0.91', spx: '0.68', winner: 'PUT' },
  { metric: 'Calmar Ratio', put: '0.33', spx: '0.20', winner: 'PUT' },
  { metric: 'Beta to S&P 500', put: '0.62', spx: '1.00', winner: 'PUT' },
  { metric: 'Skewness', put: '-1.1', spx: '-0.7', winner: 'S&P' },
  { metric: 'Excess Kurtosis', put: '4.2', spx: '2.4', winner: 'S&P' },
];


export function PutWrite() {
  return (
    <div className="page-wrap">
      <div className="badge-row">
        <div style={{ padding: '4px 10px', background: '#10b98115', border: '1px solid #10b98130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#10b981', letterSpacing: '0.05em' }}>
          CBOE BENCHMARK
        </div>
        <div style={{ padding: '4px 10px', background: '#6366f115', border: '1px solid #6366f130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.05em' }}>
          SYSTEMATIC PREMIUM
        </div>
      </div>
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
        Systematic Put-Write
      </h1>
      <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
        The CBOE PUT Index — a systematic strategy that sells one-month ATM S&P 500 puts, fully collateralized by T-bills — has delivered <strong style={{ color: '#94a3b8' }}>superior risk-adjusted returns</strong> compared to passive equity investing since its 1986 inception. Bondarenko (2019) documented a Sharpe ratio of 0.65 vs 0.49 for the S&P 500 over 1986–2018, with roughly 40% less volatility. This is the clearest real-world proof that the volatility risk premium is large, persistent, and harvestable at scale.
      </p>

      {/* Key Stats */}
      <div className="g-4" style={{ gap: 16, marginBottom: 40 }}>
        {[
          { label: 'PUT Sharpe Ratio', value: '0.65', sub: 'vs 0.49 for S&P (1986–2018)', color: '#10b981' },
          { label: 'Annualized Return', value: '10.8%', sub: 'PUT vs 10.2% S&P', color: '#6366f1' },
          { label: 'Volatility', value: '9.4%', sub: 'vs 15.1% for S&P', color: '#f59e0b' },
          { label: 'Max Drawdown', value: '-32.7%', sub: 'vs -50.9% for S&P', color: '#ef4444' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Cumulative Growth Chart */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="PUT Index vs S&P 500: Cumulative Growth ($100)" color="#10b981" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="year" {...CHART_STYLE.xAxis} />
              <YAxis {...CHART_STYLE.yAxis} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n.toFixed(0)}`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="put" name="PUT Index" stroke="#10b981" dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="spx" name="S&P 500 (Total Return)" stroke="#6366f1" dot={false} strokeWidth={2} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Illustrative growth of $100 invested in CBOE PUT Index vs S&P 500 Total Return, 1986–2023. PUT shows smoother drawdowns in 2000–2002 and 2008 bear markets.
            Sources: CBOE, Bondarenko (2019).
          </p>
        </div>
      </section>

      {/* Annual Returns */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Annual Returns: PUT vs S&P 500" color="#6366f1" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={annualReturns} barCategoryGap="15%">
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="year" {...CHART_STYLE.xAxis} tick={{ fill: '#64748b', fontSize: 9 }} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(1)}%`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="put" name="PUT Index" fill="#10b98180" radius={[2, 2, 0, 0]} />
              <Bar dataKey="spx" name="S&P 500" fill="#6366f180" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            In down years (2002, 2008, 2022), PUT typically loses significantly less than S&P. In strong bull years (2013, 2019, 2021), it lags — the classic short-vol tradeoff.
          </p>
        </div>
      </section>

      {/* Risk Metrics Table */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Risk-Adjusted Performance Metrics (1986–2018)" color="#f59e0b" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <div className="tbl-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#0f1117' }}>
                  {['Metric', 'PUT Index', 'S&P 500', 'Winner'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #2a2d3e' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskMetrics.map(({ metric, put, spx, winner }) => (
                  <tr key={metric} style={{ borderBottom: '1px solid #1e2130' }}>
                    <td style={{ padding: '10px 14px', color: '#e2e8f0' }}>{metric}</td>
                    <td style={{ padding: '10px 14px', color: winner === 'PUT' ? '#10b981' : '#94a3b8', fontFamily: 'monospace', fontWeight: winner === 'PUT' ? 600 : 400 }}>{put}</td>
                    <td style={{ padding: '10px 14px', color: winner === 'S&P' ? '#10b981' : '#94a3b8', fontFamily: 'monospace', fontWeight: winner === 'S&P' ? 600 : 400 }}>{spx}</td>
                    <td style={{ padding: '10px 14px', color: winner === 'PUT' ? '#10b981' : '#6366f1', fontFamily: 'monospace', fontWeight: 600, fontSize: 11 }}>{winner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#475569' }}>
            Data: CBOE PUT Index (1986–2018). Source: Bondarenko (2019). Note that PUT has higher skewness and kurtosis — it has more "fat left tail" risk despite better average returns.
          </p>
        </div>
      </section>

      {/* Implementation */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="How to Implement a Put-Write Program" color="#06b6d4" />
        <div className="g-2" style={{ gap: 16 }}>
          {[
            {
              title: 'Classic PUT Replication',
              color: '#10b981',
              items: [
                'Sell 1 ATM SPX put per $X notional, monthly expiry',
                'Hold full cash collateral in T-bills (earn risk-free rate)',
                'Roll 1–2 days before expiry to next month',
                'Target: ATM or slight OTM (5 points below spot)',
                'Margin requirement: ~$5,000–$10,000 per contract',
              ],
            },
            {
              title: 'Enhanced Put-Write (Higher Sharpe)',
              color: '#6366f1',
              items: [
                'Enter at 45 DTE, close at 50% profit or 21 DTE',
                'Use IVR filter: enter only when IVR > 30',
                'Sell 1 standard deviation OTM (16-delta) for safety',
                'Roll strikes down if tested to collect more credit',
                'Diversify across SPX, QQQ, IWM put writes',
              ],
            },
            {
              title: 'Risk Management Rules',
              color: '#f59e0b',
              items: [
                'Never commit more than 80% of BP to put writing',
                'Cut position size by 50% when VIX > 35',
                'Stop new entries when portfolio down > 15% on the year',
                'Use put spreads (buy downside protection) in low-IVR environments',
                'Monitor total delta: should stay between −20 and −50',
              ],
            },
            {
              title: 'Tax Efficiency (US)',
              color: '#06b6d4',
              items: [
                'SPX options qualify for 60/40 treatment (Section 1256)',
                '60% long-term, 40% short-term regardless of holding period',
                'Mark-to-market at year end — no deferral',
                'Cash-settled: no stock assignment complications',
                'Effective max federal rate ~26% vs 37% for short-term',
              ],
            },
          ].map(({ title, color, items }) => (
            <div key={title} style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 12 }}>{title}</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {items.map(item => (
                  <li key={item} style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Why it works */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Why Does Put-Write Outperform on a Risk-Adjusted Basis?" color="#8b5cf6" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <div className="g-3" style={{ gap: 12 }}>
            {[
              {
                reason: 'Variance Risk Premium',
                color: '#10b981',
                desc: 'IV systematically exceeds realized volatility ~75% of months. Every put sale collects this premium. Over hundreds of trades it adds up reliably.',
              },
              {
                reason: 'Left-tail Demand',
                color: '#6366f1',
                desc: 'Institutions and portfolio managers chronically overpay for downside protection. This structural demand keeps put prices elevated above fair value.',
              },
              {
                reason: 'Lower Volatility = Higher Sharpe',
                color: '#f59e0b',
                desc: 'The strategy has 40% less standard deviation than pure equity exposure. Even with similar or slightly higher returns, this dramatically improves Sharpe and Calmar ratios.',
              },
            ].map(({ reason, color, desc }) => (
              <div key={reason} style={{ padding: '14px 16px', background: '#0f1117', borderRadius: 8, borderTop: `2px solid ${color}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 8 }}>{reason}</div>
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risks */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Known Failure Modes" color="#ef4444" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20 }}>
          <div className="g-2" style={{ gap: 12 }}>
            {[
              {
                title: 'Crash & Recovery Lag',
                desc: '2008: PUT fell 26.8% (vs S&P −37%). The cushion is real, but still painful. Worse: the subsequent 2009 recovery was 18.4% vs 26.5% — you capture less upside too.',
              },
              {
                title: 'Negative Skew / Tail Risk',
                desc: 'Put writes have negative skew: small consistent gains, rare large losses. In March 2020, ATM put sellers lost 3–4× their monthly premium in a single week.',
              },
              {
                title: 'Capital Intensity',
                desc: 'Fully collateralized put-write requires you to hold full notional as cash. For a $420K SPX contract, that\'s real capital tied up earning T-bill rates as the "floor."',
              },
              {
                title: 'Trending Bear Markets',
                desc: '2022 saw a slow grind lower where monthly puts kept expiring in-the-money. Unlike a crash-and-recover, a sustained bear eats put write returns month after month.',
              },
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
          authors="Bondarenko, O."
          year="2019"
          title="Why Are Put Options So Expensive?"
          source="Quarterly Journal of Finance, 4(3). Key paper documenting PUT Index outperformance and the volatility risk premium size."
        />
        <Citation
          authors="Whaley, R. E."
          year="2002"
          title="Return and Risk of CBOE Buy Write Monthly Index"
          source="Journal of Derivatives, 10(2), 35–42. Early documentation of covered call / cash-secured put write performance."
        />
        <Citation
          authors="CBOE"
          year="2023"
          title="CBOE PUT Index (PUT): Benchmark Performance Data"
          source="CBOE Benchmarks. Monthly performance data for PUT, BXM, and other volatility-selling benchmark indices since 1986."
        />
        <Citation
          authors="Israelov, R."
          year="2017"
          title="Pathetic Protection: The Elusive Benefits of Protective Puts"
          source="Journal of Alternative Investments, 20(1), 6–19. Shows put protection rarely justifies its cost; complements the case for being the put seller."
        />
      </section>
    </div>
  );
}
