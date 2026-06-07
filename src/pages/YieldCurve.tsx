import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ACCENT = '#f59e0b';

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '20px 24px',
  ...style,
});

const CHART = {
  tooltip: {
    contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-h)' },
  },
  grid: { strokeDasharray: '3 3', stroke: 'var(--border)' },
  xAxis: { tick: { fill: 'var(--text-muted)', fontSize: 11 }, tickLine: false, axisLine: { stroke: 'var(--border)' } },
  yAxis: { tick: { fill: 'var(--text-muted)', fontSize: 11 }, tickLine: false, axisLine: false },
};

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

// Representative normal US Treasury yield curve data
const yieldCurveData = [
  { tenor: '3m', yield: 5.27 },
  { tenor: '6m', yield: 5.22 },
  { tenor: '1y', yield: 5.05 },
  { tenor: '2y', yield: 4.62 },
  { tenor: '3y', yield: 4.39 },
  { tenor: '5y', yield: 4.25 },
  { tenor: '7y', yield: 4.29 },
  { tenor: '10y', yield: 4.35 },
  { tenor: '20y', yield: 4.65 },
  { tenor: '30y', yield: 4.52 },
];

const TERM_THEORIES = [
  {
    name: 'Expectations Hypothesis',
    summary: 'Long-term rates = geometric average of expected future short-term rates. An upward sloping curve implies the market expects short rates to rise. Empirically, forward rates tend to overestimate future spot rates — the "forward premium puzzle."',
    color: '#6366f1',
  },
  {
    name: 'Liquidity Preference Theory',
    summary: 'Investors prefer short-term instruments (lower interest rate risk) and demand a liquidity premium for holding longer maturities. This explains why the curve is typically upward sloping even when rates are expected to stay flat.',
    color: '#3b82f6',
  },
  {
    name: 'Market Segmentation',
    summary: 'Different investor clienteles (pension funds, insurers, money market funds) have preferred habitats for specific maturities driven by liability matching. Supply/demand imbalances in each maturity bucket independently drive yields in that segment.',
    color: '#10b981',
  },
  {
    name: 'Preferred Habitat',
    summary: 'A hybrid: investors have preferred maturity ranges but will venture outside for sufficient yield premium. Term premium varies over time — the Fed\'s ACM model estimates it was negative post-QE and has since risen toward historical norms.',
    color: ACCENT,
  },
];

export function YieldCurve() {
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
          The Yield Curve
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          The yield curve — yields plotted against maturity — is the most important single chart in global finance. It reflects monetary policy expectations, growth and inflation outlook, liquidity premia, and the demand/supply dynamics of the world's deepest market.
        </p>
      </div>

      {/* Key spreads */}
      <div className="g-4" style={{ gap: 12, margin: '28px 0' }}>
        {[
          { value: '2s10s', label: '2yr vs 10yr — Primary curve slope signal', color: ACCENT },
          { value: '2s5s30s', label: 'Butterfly — belly vs wings trade', color: '#8b5cf6' },
          { value: 'OTR', label: 'On-the-run liquidity premium: ~5–10bp', color: '#10b981' },
          { value: 'Swap', label: 'Swap spread = swap rate − Treasury yield', color: '#6366f1' },
        ].map(({ value, label, color }) => (
          <div key={label} style={card({ textAlign: 'center' })}>
            <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{label}</div>
          </div>
        ))}
      </div>

      <SectionHeader title="Spot Rates, Forward Rates & Par Yields" />
      <div style={card()}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Spot Rate (Zero Rate)</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>The yield on a zero-coupon instrument of a given maturity. It is the "pure" interest rate for that horizon, with no reinvestment risk. STRIPS (Treasury zero-coupons) reveal spot rates directly. The spot curve is the foundation for all fixed income valuation.</p>
          </div>
          <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Forward Rate</div>
            <p style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>The implied interest rate for a future period derived from current spot rates. The 1yr-into-1yr forward rate is the rate the market implies for a 1-year loan starting 1 year from now.</p>
            <Formula>f(t₁,t₂) = [(1 + s_t₂)^t₂ / (1 + s_t₁)^t₁]^[1/(t₂-t₁)] − 1</Formula>
          </div>
          <div style={{ borderLeft: '3px solid #10b981', paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Par Yield</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>The coupon rate that would make a new bond (with coupon payments) price exactly at par (100). Par yields are what you see quoted for benchmark on-the-run Treasuries. The par curve is interpolated from market prices of recently-issued bonds and used as the reference for corporate spread calculations.</p>
          </div>
        </div>
      </div>

      <SectionHeader title="Current US Treasury Yield Curve" />
      <div style={card({ padding: '16px 8px 8px' })}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 16, marginBottom: 8 }}>
          Representative US Treasury yields by tenor — normal (inverted front end) shape
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={yieldCurveData} margin={{ top: 4, right: 20, bottom: 24, left: 0 }}>
            <CartesianGrid {...CHART.grid} />
            <XAxis dataKey="tenor" {...CHART.xAxis} label={{ value: 'Maturity', position: 'insideBottom', offset: -12, fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis {...CHART.yAxis} tickFormatter={(v) => `${v}%`} domain={[4.0, 5.5]} />
            <Tooltip {...CHART.tooltip} formatter={(v) => [`${v}%`, 'Yield']} />
            <Line type="monotone" dataKey="yield" name="Treasury Yield" stroke={ACCENT} strokeWidth={2.5} dot={{ fill: ACCENT, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <SectionHeader title="Curve Shapes & What They Signal" />
      <div style={{ display: 'grid', gap: 12 }}>
        {[
          { shape: 'Normal (Upward Sloping)', signal: 'Healthy economy; investors demand yield premium for longer maturities (time/inflation risk). Standard baseline.', example: '2yr at 4.0%, 10yr at 4.5%', color: '#10b981' },
          { shape: 'Inverted (Downward Sloping)', signal: 'Market pricing rate cuts ahead; often recession signal. 2s10s spread turns negative. Historically most reliable recession predictor with 6–18 month lead.', example: '2yr at 5.2%, 10yr at 4.3%', color: '#ef4444' },
          { shape: 'Flat', signal: 'Transition period — often mid-hiking cycle when short end rises toward long end. Uncertainty about growth direction.', example: '2yr at 4.5%, 10yr at 4.6%', color: ACCENT },
          { shape: 'Humped', signal: 'Belly of the curve yields more than both wings. Intermediate uncertainty — can occur when market expects rates to peak at medium term then fall.', example: '2yr at 4.0%, 5yr at 5.0%, 30yr at 4.5%', color: '#8b5cf6' },
        ].map(({ shape, signal, example, color }) => (
          <div key={shape} style={card({ borderLeft: `3px solid ${color}` })}>
            <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 6 }}>{shape}</div>
            <p style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{signal}</p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>{example}</div>
          </div>
        ))}
      </div>

      <SectionHeader title="Term Structure Theories" />
      <div style={{ display: 'grid', gap: 12 }}>
        {TERM_THEORIES.map(({ name, summary, color }) => (
          <div key={name} style={card()}>
            <div style={{ fontWeight: 600, color, marginBottom: 8 }}>{name}</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{summary}</p>
          </div>
        ))}
      </div>

      <SectionHeader title="On-the-Run vs Off-the-Run" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          When the Treasury issues a new 10-year note, it becomes the <strong style={{ color: 'var(--text-h)' }}>on-the-run (OTR)</strong> benchmark — the most actively traded, tightest bid-ask, and most liquid version. The previous 10yr becomes <strong style={{ color: 'var(--text-h)' }}>off-the-run (OFR)</strong>. OFR Treasuries typically yield 3–10bp more than OTR Treasuries of similar maturity — a pure liquidity premium.
        </p>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The OTR/OFR spread widens during risk-off periods as demand for the liquid benchmark spikes (flight to the most liquid instrument). Long/short OTR vs OFR is a classic relative value trade — the LTCM portfolio famously held large OTR/OFR convergence positions that blew up in 1998 when spreads widened further than model expectations.
        </p>
      </div>

      <SectionHeader title="Curve Trades" />
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={card()}>
          <div style={{ fontWeight: 700, color: ACCENT, fontSize: 15, marginBottom: 10 }}>2s10s Spread Trade</div>
          <div className="g-2" style={{ gap: 12 }}>
            <div style={{ borderLeft: '3px solid #10b981', paddingLeft: 12 }}>
              <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 4 }}>Steepener</div>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>Long 10yr + short 2yr (DV01-neutral). Profits when 10s yield rises relative to 2s — i.e., curve steepens. Expressed as a view that the Fed will cut (2s falls) or long-end inflation risk rises (10s rises).</p>
            </div>
            <div style={{ borderLeft: '3px solid #ef4444', paddingLeft: 12 }}>
              <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Flattener</div>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.5 }}>Long 2yr + short 10yr (DV01-neutral). Profits when curve flattens — 2s rises relative to 10s. Classic during Fed hiking cycles. "Bear flattener" = front end rises faster; "bull flattener" = long end falls faster.</p>
            </div>
          </div>
        </div>
        <div style={card()}>
          <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 15, marginBottom: 10 }}>Butterfly (Fly) Trade</div>
          <p style={{ margin: '0 0 10px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
            A three-legged DV01-neutral trade expressing a view on belly richness/cheapness vs wings. The classic construction:
          </p>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#8b5cf6', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
            Long wings (2yr + 30yr), Short belly (10yr)
          </div>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
            Profits when the 10yr yield rises relative to the wings (belly cheapens). Constructed DV01-neutral: the short DV01 of the belly equals the combined long DV01 of the wings. The position has zero sensitivity to parallel shifts — only to curvature changes.
          </p>
        </div>
      </div>

      <SectionHeader title="Swap Curve & Roll-Down" />
      <div style={card()}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Swap Spread</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>Swap spread = SOFR/LIBOR swap rate minus Treasury yield at the same maturity. Reflects bank credit risk, repo funding conditions, and regulatory capital costs. Negative swap spreads (swap rate below Treasury) occurred post-GFC due to balance sheet constraints forcing dealer hedges at unfavorable prices — a structural market distortion. Positive swap spreads reflect normal bank credit premium over risk-free Treasuries.</p>
          </div>
          <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Roll-Down Return</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>As time passes, a bond "rolls down" the yield curve — a 7-year bond becomes a 6-year bond, etc. In a normal (upward-sloping) curve, this means the bond's yield falls as it shortens in maturity, generating price appreciation. This "roll-down" return is separate from coupon income and provides free carry as long as the curve doesn't shift. Portfolio managers often buy bonds in the steepest part of the curve (5–7yr) specifically to harvest roll-down.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
