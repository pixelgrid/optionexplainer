const ACCENT = '#f59e0b';

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '20px 24px',
  ...style,
});

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 40 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: ACCENT }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

const STRATEGIES = [
  {
    name: 'Laddering',
    objective: 'Smooth reinvestment risk; maintain liquidity at regular intervals',
    when: 'Retail buy-and-hold investors; uncertainty about future rate direction',
    mechanics: 'Equal allocation across a range of maturities (e.g., 1, 2, 3, 4, 5yr). As each rung matures, reinvest in a new long end. Cash flows stagger throughout the holding period.',
    pros: ['Reduces reinvestment risk vs bullet', 'Regular liquidity events', 'Simple to implement and explain', 'Natural averaging of interest rates'],
    cons: ['Lower expected return vs barbell in parallel shifts', 'No explicit duration target', 'Sub-optimal for liability matching'],
    convexity: 'Medium',
    durFlex: 'Low',
    investor: 'Retail, conservative',
    color: '#6366f1',
  },
  {
    name: 'Barbell',
    objective: 'Maximize convexity; exploit curve reshaping',
    when: 'View that yield curve will steepen or flatten non-linearly; seeking higher convexity than a bullet',
    mechanics: 'Concentrate at short end (e.g., 2yr) + long end (e.g., 30yr). Zero allocation to intermediate maturities. Duration-matched to a benchmark by weighting the two wings.',
    pros: ['Higher convexity than bullet at same duration', 'Outperforms in parallel yield shifts (convexity benefit)', 'Flexible: adjust weights for curve views'],
    cons: ['Underperforms in bear flattener (short end cheapens)', 'Higher transaction costs (more securities)', 'Reinvestment risk on short end'],
    convexity: 'High',
    durFlex: 'Medium',
    investor: 'Institutional, active managers',
    color: ACCENT,
  },
  {
    name: 'Bullet',
    objective: 'Match a known future liability; minimize basis risk',
    when: 'Defined benefit pension with a known payment date; corporate sinking fund; endowment spending requirement',
    mechanics: 'Concentrate holdings around a single target maturity. Equivalent to a zero-coupon bond in terms of liability matching precision. Often implemented with on-the-run Treasuries at the target maturity.',
    pros: ['Precise liability match', 'Simple; low transaction costs', 'Predictable cash flow timing'],
    cons: ['Lower convexity than barbell at same duration', 'No diversification across maturities', 'Vulnerable to supply/liquidity in single maturity'],
    convexity: 'Low',
    durFlex: 'Very Low',
    investor: 'Pension, insurance, liability-driven',
    color: '#10b981',
  },
  {
    name: 'Rolling Down the Curve',
    objective: 'Harvest carry + roll-down in steepest part of curve',
    when: 'Normal (upward-sloping) yield curve; stable rate environment expected',
    mechanics: 'Buy bonds where the curve is steepest (typically 5–7yr belly). Hold for 6–12 months, benefiting from yield compression as they roll to shorter maturities. Total return = coupon + roll-down gain — no yield change required.',
    pros: ['Earns excess return vs rolling short-term paper', 'Does not require rate view (works in stable rates)', 'Intuitive and widely used'],
    cons: ['Curve must stay normal/steep', 'Vulnerable to bear flattener', 'Requires regular rebalancing as bonds shorten'],
    convexity: 'Medium',
    durFlex: 'Medium',
    investor: 'Asset managers, hedge funds',
    color: '#3b82f6',
  },
  {
    name: 'Immunization',
    objective: 'Match asset portfolio to liability stream; protect funded status',
    when: 'Pension funds, insurance companies; regulatory requirement to minimize surplus volatility',
    mechanics: 'Match duration (and ideally convexity) of asset portfolio to liability duration. Redington conditions: (1) PV(assets) = PV(liabilities), (2) duration match, (3) asset convexity ≥ liability convexity. Requires regular rebalancing as duration drift occurs.',
    pros: ['Funded ratio insulated from parallel rate moves', 'Regulatory capital benefits', 'Transparent and auditable'],
    cons: ['Does not protect against non-parallel shifts', 'Requires active rebalancing', 'Restricts asset allocation flexibility'],
    convexity: 'Matched',
    durFlex: 'Constrained',
    investor: 'Pension funds, insurers (LDI)',
    color: '#8b5cf6',
  },
  {
    name: 'Duration Extension / Compression',
    objective: 'Express active rate view vs benchmark duration target',
    when: 'Portfolio manager has strong conviction on direction of rates vs consensus',
    mechanics: 'Benchmark duration is set by the index (e.g., Bloomberg US Agg ≈ 6yr). Long duration vs index = overweight bonds relative to benchmark = bullish on bonds (expecting yields to fall). Short duration = underweight = expecting yields to rise. Expressed in years of active duration or DV01 vs benchmark.',
    pros: ['Simple expression of rate view', 'Transparent risk measure', 'Works within existing portfolio'],
    cons: ['Tracking error vs benchmark', 'Conviction-based; requires macro view', 'Can be wrong for extended periods'],
    convexity: 'Varies',
    durFlex: 'High',
    investor: 'Active bond fund managers',
    color: '#ec4899',
  },
  {
    name: 'Carry Trade',
    objective: 'Earn yield differential (carry) between bonds funded at short-term rates',
    when: 'Steep yield curve; stable credit spreads; repo funding available at attractive rates',
    mechanics: 'Buy high-yielding bonds (e.g., long-dated IG, HY). Fund in repo at short-term rates. Positive carry = coupon income minus funding cost. Funded carry can leverage returns but amplifies losses. Classic cross-currency carry: buy USD bonds, fund in JPY via FX swap.',
    pros: ['Earns yield differential without directional rate view', 'Can be large absolute returns in stable environments', 'Income-oriented'],
    cons: ['Mark-to-market losses if spreads widen', 'Repo funding can disappear in stress', 'Leverage amplifies downside; forced deleveraging risk'],
    convexity: 'Varies',
    durFlex: 'High',
    investor: 'Hedge funds, prop desks',
    color: '#f97316',
  },
  {
    name: 'Curve Flattener / Steepener',
    objective: 'Express view on yield curve slope without directional rate bet',
    when: 'Conviction on Fed path or term premium but uncertainty about level of rates',
    mechanics: 'Flattener: long 2yr + short 10yr, DV01-neutral. Profits when 2s10s spread narrows. Steepener: reverse. DV01-neutral construction means the position has no P&L from parallel shifts — only slope changes matter.',
    pros: ['Pure expression of curve view', 'Limited sensitivity to overall rate level', 'Flexible sizing'],
    cons: ['Carry cost on the short leg', 'Basis risk vs exact DV01 neutrality', 'Can move against before thesis plays out'],
    convexity: 'Varies',
    durFlex: 'High',
    investor: 'Macro funds, rates desks',
    color: '#14b8a6',
  },
];

const COMPARISON = [
  { strategy: 'Laddering', convexity: 'Medium', durFlex: 'Low', investor: 'Retail, conservative' },
  { strategy: 'Barbell', convexity: 'High', durFlex: 'Medium', investor: 'Institutional, active' },
  { strategy: 'Bullet', convexity: 'Low', durFlex: 'Very Low', investor: 'Pension, LDI' },
  { strategy: 'Roll Down', convexity: 'Medium', durFlex: 'Medium', investor: 'Asset managers, HFs' },
  { strategy: 'Immunization', convexity: 'Matched', durFlex: 'Constrained', investor: 'Pension, insurers' },
  { strategy: 'Duration Ext.', convexity: 'Varies', durFlex: 'High', investor: 'Active bond funds' },
  { strategy: 'Carry Trade', convexity: 'Varies', durFlex: 'High', investor: 'Hedge funds' },
  { strategy: 'Curve Trade', convexity: 'Varies', durFlex: 'High', investor: 'Macro funds' },
];

export function BondStrategies() {
  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      {/* Hero */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, background: ACCENT + '18', border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: '3px 10px' }}>
            Fixed Income
          </span>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
          Bond Portfolio Strategies
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          From passive laddering to complex curve trades, fixed income portfolio management spans a wide spectrum of objectives, risk tolerances, and investor types. Each strategy involves explicit trade-offs between yield, convexity, duration flexibility, and implementation cost.
        </p>
      </div>

      {STRATEGIES.map(({ name, objective, when, mechanics, pros, cons, color }) => (
        <div key={name} style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-h)' }}>{name}</h2>
          </div>
          <div style={card()}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="g-2" style={{ gap: 12 }}>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Objective</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{objective}</p>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>When to Use</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{when}</p>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Mechanics</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{mechanics}</p>
              </div>
              <div className="g-2" style={{ gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Advantages</div>
                  {pros.map(p => (
                    <div key={p} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                      <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>+</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Drawbacks</div>
                  {cons.map(c => (
                    <div key={c} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                      <span style={{ color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>−</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <SectionHeader title="Strategy Comparison" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {['Strategy', 'Convexity', 'Duration Flexibility', 'Suitable Investor'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: ACCENT, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, i) => (
              <tr key={row.strategy} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                <td style={{ padding: '9px 14px', color: 'var(--text-h)', fontWeight: 600 }}>{row.strategy}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)' }}>{row.convexity}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)' }}>{row.durFlex}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{row.investor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
