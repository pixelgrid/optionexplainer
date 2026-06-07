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

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 18px', margin: '12px 0', fontFamily: 'monospace', fontSize: 13, color: ACCENT, overflowX: 'auto' }}>
      {children}
    </div>
  );
}

const MACRO_REGIMES = [
  {
    regime: 'Stagflation',
    conditions: 'High inflation + weak growth',
    bondView: 'Worst for bonds',
    action: 'Short duration, TIPS over nominals, credit underweight',
    color: '#ef4444',
    detail: 'Real yields rise as nominal yields rise but inflation expectations also increase. Fixed coupons eroded in real terms. TIPS provide inflation protection but real yields still rise. Example: 1970s, 2022.',
  },
  {
    regime: 'Disinflationary Growth',
    conditions: 'Moderate growth + falling inflation',
    bondView: 'Bearish to neutral',
    action: 'Neutral duration; equities and credit preferred',
    color: ACCENT,
    detail: 'Growth supports risk assets; falling inflation removes rate hike premium but doesn\'t drive strong bond rally. Spreads should tighten as default risk falls. Classic "goldilocks" environment.',
  },
  {
    regime: 'Deflationary Bust',
    conditions: 'Recession + deflation risk',
    bondView: 'Best for long-duration Treasuries',
    action: 'Extend duration, overweight Treasuries, underweight credit',
    color: '#10b981',
    detail: 'Flight to quality drives Treasury yields to lows. Deflation means real value of fixed coupon rises. Credit spreads blow out. The classic 2008 scenario: 30yr Treasury gained 40%+ while equities and credit collapsed.',
  },
  {
    regime: 'Reflationary Recovery',
    conditions: 'Rising growth + moderate inflation',
    bondView: 'Bearish (rising yields)',
    action: 'Short duration vs benchmark; overweight TIPS breakevens, high yield',
    color: '#8b5cf6',
    detail: 'Recovery from recession drives rate expectations higher. Term premium expands. Bear steepener: long end rises faster than short. Credit spreads tighten — HY often outperforms. Example: 2009–2010.',
  },
];

export function BondMacro() {
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
          Macro &amp; Rates Framework
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          Bond markets are where macroeconomic views are expressed with the highest liquidity and precision. Understanding the relationship between central bank policy, inflation expectations, term premium, and the yield curve is essential for positioning fixed income portfolios.
        </p>
      </div>

      <SectionHeader title="Nominal vs Real Yields — The Fisher Equation" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Every nominal yield can be decomposed into a real yield (inflation-adjusted return) and inflation expectations. This is the Fisher equation:
        </p>
        <Formula>
          (1 + Nominal Yield) = (1 + Real Yield) × (1 + Expected Inflation)
          {'\n'}
          Simplified: Nominal Yield ≈ Real Yield + Expected Inflation
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          When the 10-year Treasury yields 4.5% and the 10-year TIPS yields 2.1%, the market-implied <strong style={{ color: 'var(--text-h)' }}>breakeven inflation</strong> is 4.5% − 2.1% = <strong style={{ color: ACCENT }}>2.4%</strong>. If actual realized inflation over the next 10 years exceeds 2.4%, TIPS will have outperformed nominal Treasuries. If inflation comes in below 2.4%, nominals outperform.
        </p>
      </div>

      <SectionHeader title="TIPS & Breakeven Inflation" />
      <div style={card()}>
        <div className="g-2" style={{ gap: 14 }}>
          <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>How TIPS Work</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              TIPS (Treasury Inflation-Protected Securities) adjust their principal daily with CPI. A fixed coupon rate is applied to the inflation-adjusted principal, so nominal coupon payments grow with inflation. At maturity, investors receive the greater of the original par value or the inflation-adjusted principal — providing floor protection against deflation.
            </p>
          </div>
          <div style={{ borderLeft: '3px solid #10b981', paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>Trading Breakevens</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              Buying TIPS + shorting nominal Treasuries (same maturity, DV01-neutral) = a pure inflation trade. Long breakevens = bet on rising inflation expectations. Short breakevens = bet on disinflation. Oil prices, supply chain dynamics, Fed credibility, and labor market tightness all drive breakeven inflation. At 2.4%, breakevens are near the Fed's 2% target — any sustained above-target inflation makes TIPS attractive.
            </p>
          </div>
        </div>
      </div>

      <SectionHeader title="Central Bank Reaction Function" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The Fed operates a <strong style={{ color: 'var(--text-h)' }}>dual mandate</strong>: maximum employment and price stability (2% inflation target). The market continuously updates its expectation of the Fed funds rate path, which is directly visible in:
        </p>
        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
          {[
            { item: 'Fed Funds Futures', desc: 'Price implied probability of rate hikes/cuts at each future FOMC meeting — the most direct measure of market rate expectations.' },
            { item: '2-Year Treasury', desc: 'Most sensitive to near-term Fed policy; essentially prices the average expected Fed funds rate over the next 2 years.' },
            { item: 'OIS (Overnight Index Swap) Curve', desc: 'Strips out term premium; the OIS curve represents pure rate expectations through maturity.' },
          ].map(({ item, desc }) => (
            <div key={item} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              <span style={{ color: ACCENT, fontWeight: 700, flexShrink: 0 }}>▸</span>
              <span><strong style={{ color: 'var(--text-h)' }}>{item}:</strong> {desc}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The long end (10yr, 30yr) reflects the market's view of the <strong style={{ color: 'var(--text-h)' }}>terminal rate</strong> (where the Fed will ultimately settle) plus the <strong style={{ color: 'var(--text-h)' }}>term premium</strong>. When the market believes the Fed is near its peak rate, the short end stabilizes while the long end moves with growth and inflation expectations independently.
        </p>
      </div>

      <SectionHeader title="Term Premium" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The term premium is the extra yield investors demand for holding long-duration bonds vs continuously rolling short-term instruments. It compensates for:
        </p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {[
            'Duration/inflation uncertainty: longer bonds have more price risk if inflation or growth surprises',
            'Liquidity risk: long bonds less liquid than T-bills in stress',
            'Regulatory/institutional demand: central bank QE compressed term premium post-GFC',
            'Supply effects: large Treasury issuance (fiscal deficits) pushes term premium higher',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              <span style={{ color: ACCENT, flexShrink: 0 }}>•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The NY Fed's ACM (Adrian-Crump-Moench) model estimates the 10yr term premium. It turned negative post-QE (2014–2021) — an unprecedented compression — and has since rebounded toward historical norms of 50–100bp. Rising term premium = bear steepener: long end rises without short end following.
        </p>
      </div>

      <SectionHeader title="Bear Flattener vs Bull Steepener" />
      <div style={{ display: 'grid', gap: 12 }}>
        {[
          {
            name: 'Bear Flattener',
            description: 'Short end rises faster than the long end. Short rates price in more Fed hikes; long end anchored by belief the hikes will eventually slow growth/inflation. The yield curve flattens on a "bear" (rates rising) backdrop.',
            trigger: 'Fed hawkish pivot; inflation surprises to the upside; tight labor market',
            example: '2yr rises from 4.0% → 5.0%; 10yr rises from 3.8% → 4.2% → 2s10s inverts from −20bp to −80bp',
            portfolio: 'Short duration; credit initially OK but eventually spreads widen on recession risk; long the 2s10s flattener trade',
            color: '#ef4444',
          },
          {
            name: 'Bull Steepener',
            description: 'Long end falls faster than the short end. Typically occurs when: (a) Fed cutting rates but long end stays elevated on inflation concerns, or (b) Risk-off drives flight to short-dated bills while long-end investors stay cautious.',
            trigger: 'Fed rate cuts begin; recession confirmed; risk-off flight to quality in short bills',
            example: '10yr falls from 4.5% → 3.8%; 2yr falls more slowly from 5.0% → 4.5% → 2s10s goes from −50bp to −30bp (less inverted)',
            portfolio: 'Long duration; credit underweight as recession risk rises; long bonds over bills',
            color: '#10b981',
          },
          {
            name: 'Bear Steepener',
            description: 'Long end rises faster than the short end on a rising-rates backdrop. Long-term inflation or fiscal deficit concerns drive long yields higher while the Fed holds short rates steady or cuts. Often precedes or accompanies a term premium surge.',
            trigger: 'Fiscal expansion; inflation risk premium rising; foreign selling of Treasuries; Fed pause with long-end selloff',
            example: '2yr stays at 4.5%; 30yr rises from 4.5% → 5.2% → massive 2s30s steepening',
            portfolio: 'Short long-duration bonds; steepener trades; TIPS vs nominals if inflation-driven',
            color: ACCENT,
          },
          {
            name: 'Bull Flattener',
            description: 'Long end falls faster than short end in a falling-rates environment. Long duration investors pile into the long end on strong demand; short end anchored by near-term Fed path expectations. Positive for bonds overall.',
            trigger: 'Risk-off flight to long Treasuries; QE announcements; sharp growth slowdown',
            example: '30yr falls from 5.0% → 4.2%; 2yr falls less from 4.8% → 4.4% → curve flattens significantly',
            portfolio: 'Long duration; long bonds massively outperform; flattener trades benefit',
            color: '#3b82f6',
          },
        ].map(({ name, description, trigger, example, portfolio, color }) => (
          <div key={name} style={card({ borderTop: `3px solid ${color}` })}>
            <div style={{ fontWeight: 700, color, fontSize: 15, marginBottom: 8 }}>{name}</div>
            <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{description}</p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { label: 'Trigger', value: trigger },
                { label: 'Example', value: example, mono: true },
                { label: 'Portfolio Implication', value: portfolio },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="Macro Regimes for Bonds" />
      <div style={{ display: 'grid', gap: 12 }}>
        {MACRO_REGIMES.map(({ regime, conditions, bondView, action, detail, color }) => (
          <div key={regime} style={card({ borderLeft: `3px solid ${color}` })}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color, fontSize: 15 }}>{regime}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{conditions}</div>
              </div>
              <span style={{ background: color + '20', color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>{bondView}</span>
            </div>
            <p style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{detail}</p>
            <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-h)' }}>Action:</strong> {action}
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="Duration Positioning vs Benchmark" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Fixed income portfolio managers express rate views as <strong style={{ color: 'var(--text-h)' }}>active duration</strong> (years over/under benchmark) or <strong style={{ color: 'var(--text-h)' }}>DV01 ($)</strong>.
        </p>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: ACCENT, background: 'var(--bg)', borderRadius: 8, padding: '12px 18px', marginBottom: 14 }}>
          Example: Bloomberg US Agg benchmark duration = 6.2yr
          <br />
          Portfolio duration = 5.2yr → active duration = −1.0yr (short duration vs benchmark)
          <br />
          At $500M portfolio: DV01 = 5.2 × $500M × 0.0001 = $260,000/bp
          <br />
          Benchmark DV01 = 6.2 × $500M × 0.0001 = $310,000/bp
          <br />
          Active DV01 short = $50,000/bp → earn $50k per basis point of yield rise
        </div>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          A portfolio manager who is short 1yr vs the index gains $50k per basis point of yield rise, but underperforms the index benchmark by the same amount if yields fall. Duration positioning is the single largest source of active return (and risk) in most fixed income funds.
        </p>
      </div>

      <SectionHeader title="Flight to Quality" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          In risk-off episodes — equity selloffs, credit events, geopolitical shocks — capital flows aggressively into US Treasuries, driving yields sharply lower. This is the <strong style={{ color: 'var(--text-h)' }}>flight-to-quality</strong> effect. Historically:
        </p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {[
            { event: 'GFC (2008–09)', move: '10yr yield: 4.5% → 2.1%; 30yr +40% total return' },
            { event: 'COVID Panic (March 2020)', move: '10yr yield: 1.6% → 0.54% in weeks' },
            { event: 'SVB Collapse (March 2023)', move: '2yr yield: 5.05% → 3.77% in 3 days' },
          ].map(({ event, move }) => (
            <div key={event} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
              <span style={{ color: '#10b981', fontWeight: 700, width: 180, flexShrink: 0 }}>{event}:</span>
              <span style={{ color: 'var(--text)', lineHeight: 1.5 }}>{move}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The negative correlation between Treasuries and equities (−0.5 to −0.7 historically) is the core of the 60/40 portfolio construction rationale. When equities fall, Treasuries rally, dampening portfolio drawdowns. This correlation flipped positive briefly in the 2022 inflation shock — when both equities AND bonds fell — highlighting that this diversification benefit is conditional on the inflation regime.
        </p>
      </div>

      <SectionHeader title="G10 Sovereign Spread Relationships" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          US Treasuries are the global risk-free benchmark. Other G10 sovereign spreads to Treasuries reflect currency and rate differential expectations:
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { pair: 'Bund vs UST (10yr)', desc: 'The 10yr Bund-UST spread is the primary driver of EUR/USD. When the spread widens in favor of UST (US rates rise relative to EUR), the USD typically strengthens. ECB and Fed policy divergence is the key driver.' },
            { pair: 'JGB vs UST (10yr)', desc: 'Japan\'s yield curve control (YCC) policy historically held JGB yields near zero while UST yields rose, creating a historically wide spread. The resulting USD/JPY carry trade was enormous — unwinding it (when BOJ exits YCC) causes JPY appreciation and global market volatility.' },
            { pair: 'Gilts vs UST (10yr)', desc: 'UK government bond yields reflect BOE policy, UK fiscal position, and UK inflation. The 2022 mini-budget crisis showed how fiscal credibility risk can blow out sovereign spreads rapidly, even for developed market issuers.' },
          ].map(({ pair, desc }) => (
            <div key={pair} style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>{pair}</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
