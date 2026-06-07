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

// Compute bond price for a 4% coupon, 10-year, semi-annual bond at various yields
function bondPrice(yieldAnnual: number): number {
  const n = 20; // 10 years × 2 periods
  const coupon = 2; // 4% / 2 × $100 face
  const y = yieldAnnual / 2;
  let price = 0;
  for (let t = 1; t <= n; t++) {
    price += coupon / Math.pow(1 + y, t);
  }
  price += 100 / Math.pow(1 + y, n);
  return price;
}

// Generate price/yield data
const priceYieldData = Array.from({ length: 19 }, (_, i) => {
  const yld = 0.01 + i * 0.005; // 1% to 10%
  return {
    yield: +(yld * 100).toFixed(2),
    price: +bondPrice(yld).toFixed(2),
  };
});

export function BondPricing() {
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
          Bond Pricing &amp; Duration
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          Bond prices are the present value of future cash flows. Duration and convexity measure how sensitive that price is to changes in interest rates — the core risk management metrics for any fixed income portfolio.
        </p>
      </div>

      <SectionHeader title="The Fundamental Pricing Equation" />
      <div style={card()}>
        <p style={{ margin: '0 0 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          A bond's fair value is the sum of all future cash flows discounted at the yield to maturity (y). For a bond paying semi-annual coupons of C/2 with face value FV and n periods to maturity:
        </p>
        <Formula>
          P = Σ [C/2 / (1 + y/2)^t] + FV / (1 + y/2)^(2n)
          {'\n'}
          where t runs from 1 to 2n (semi-annual periods)
        </Formula>
        <p style={{ margin: '14px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          This is simply the present value of an annuity (coupons) plus the present value of a lump sum (par). The key insight: there is a <strong style={{ color: 'var(--text-h)' }}>one-to-one, inverse</strong> relationship between price and yield — every bond has exactly one YTM consistent with its current price.
        </p>
      </div>

      <SectionHeader title="Price/Yield Relationship — The Convex Curve" />
      <div style={card({ padding: '16px 8px 8px' })}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 16, marginBottom: 8 }}>
          4% coupon, 10-year bond (semi-annual) — Price per $100 face vs Yield
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={priceYieldData} margin={{ top: 4, right: 20, bottom: 8, left: 0 }}>
            <CartesianGrid {...CHART.grid} />
            <XAxis dataKey="yield" {...CHART.xAxis} tickFormatter={(v) => `${v}%`} label={{ value: 'Yield (%)', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis {...CHART.yAxis} tickFormatter={(v) => `$${v}`} domain={['auto', 'auto']} />
            <Tooltip {...CHART.tooltip} formatter={(v) => [`$${v}`, 'Price']} labelFormatter={(l) => `Yield: ${l}%`} />
            <Line type="monotone" dataKey="price" name="Bond Price" stroke={ACCENT} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ margin: '12px 16px 4px', padding: '10px 14px', background: ACCENT + '18', borderRadius: 8, fontSize: 13, color: ACCENT }}>
          The curve is <strong>convex</strong> — it bows toward the origin. This means gains from yield drops exceed losses from equal yield rises, all else equal. This convexity is valuable to bondholders.
        </div>
      </div>

      <div className="g-3" style={{ gap: 12, marginTop: 16 }}>
        {[
          { label: 'Discount Bond', condition: 'Coupon < YTM', price: 'Price < Par', color: '#ef4444', note: 'Market demands more yield than coupon rate; price falls below par to compensate.' },
          { label: 'Par Bond', condition: 'Coupon = YTM', price: 'Price = Par', color: '#10b981', note: 'Coupon rate exactly matches market yield; bond prices at 100.' },
          { label: 'Premium Bond', condition: 'Coupon > YTM', price: 'Price > Par', color: '#6366f1', note: 'Coupon rate exceeds market yield; bond is worth more than par, prices above 100.' },
        ].map(({ label, condition, price, color, note }) => (
          <div key={label} style={card({ borderTop: `3px solid ${color}` })}>
            <div style={{ fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{condition}</div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>{price}</div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{note}</p>
          </div>
        ))}
      </div>

      <SectionHeader title="Macaulay Duration" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Macaulay Duration is the <strong style={{ color: 'var(--text-h)' }}>weighted average time</strong> to receive all cash flows, where each weight is the present value of that cash flow divided by the total bond price. Intuition: a zero-coupon bond's MacDur equals its maturity; a coupon bond's MacDur is shorter than maturity because you receive early coupons.
        </p>
        <Formula>
          MacDur = Σ [t × PV(CF_t)] / Price
          {'\n'}
          where PV(CF_t) = CF_t / (1 + y/m)^t
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Macaulay duration is measured in <em>years</em>. A bond with MacDur = 8.5 years means the average cash flow arrives in 8.5 years. Higher coupon → lower duration. Higher yield → lower duration. Longer maturity → higher duration.
        </p>
      </div>

      <SectionHeader title="Modified Duration & DV01" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Modified Duration converts Macaulay Duration into a direct price sensitivity measure: the <strong style={{ color: 'var(--text-h)' }}>approximate percentage price change per 1% (100bp) change in yield</strong>.
        </p>
        <Formula>
          ModDur = MacDur / (1 + y/m)
          {'\n'}
          ΔP/P ≈ -ModDur × Δy
        </Formula>
        <p style={{ margin: '12px 0 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-h)' }}>DV01</strong> (Dollar Value of a Basis Point, also called PV01) is the dollar P&amp;L from a 1 basis point (0.01%) move in yield. It's the practitioner's workhorse for risk management and hedging.
        </p>
        <Formula>
          DV01 = ModDur × Price × 0.0001
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          If a portfolio has DV01 = $50,000, a 1bp rise in rates costs $50,000. A 100bp (1%) rise costs ~$5 million. Traders express bond risk as DV01 rather than notional — a $10M face of short-duration bonds can have similar DV01 to $2M of long-duration bonds.
        </p>
      </div>

      <SectionHeader title="Convexity" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Duration is a linear approximation of price sensitivity. <strong style={{ color: 'var(--text-h)' }}>Convexity</strong> is the second-order term — it captures the curvature in the price/yield relationship. Positive convexity means the bond gains more from yield drops than it loses from yield rises of equal magnitude.
        </p>
        <Formula>
          Convexity ≈ Σ [t(t+1) × PV(CF_t)] / [Price × (1 + y/m)²]
        </Formula>
        <Formula>
          Full ΔP ≈ (-ModDur × Δy + ½ × Convexity × (Δy)²) × P
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          For small yield moves, the duration term dominates. For large moves (e.g., ±200bp), convexity becomes material. Investors <em>pay</em> for convexity — two bonds with identical duration but different convexity will price differently. Higher convexity → higher price (lower yield) all else equal. This is why callable bonds, which exhibit <strong style={{ color: '#ef4444' }}>negative convexity</strong> (the issuer takes away upside when rates fall), must offer higher yields to compensate.
        </p>
      </div>

      <SectionHeader title="Key Rate Duration (KRD)" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Modified duration assumes a <strong style={{ color: 'var(--text-h)' }}>parallel shift</strong> in the yield curve — all yields move by the same amount. In practice, the curve twists and reshapes. Key Rate Duration (KRD) measures sensitivity to a yield move at a <em>specific maturity point</em> on the curve — the 2yr, 5yr, 10yr, 30yr — holding other points fixed.
        </p>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          A portfolio's KRD profile reveals where it is exposed. A barbell (long 2s and 30s) will show large KRDs at the wings but small KRD at the 10yr. A bullet around the 10yr will show the opposite. Mortgage portfolios often have large negative convexity in the 5–10yr key rates. KRD hedging allows precise hedging of non-parallel curve moves.
        </p>
      </div>

      <SectionHeader title="Worked Example: 10-Year 4% Bond at $95" />
      <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontWeight: 700, color: ACCENT, fontSize: 15, marginBottom: 16 }}>
          4% semi-annual coupon, 10-year bond, current price = $95 per $100 face
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>Step 1 — Find YTM</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', lineHeight: 1.8 }}>
              Solving: 95 = Σ(t=1 to 20) [2/(1+y)^t] + 100/(1+y)^20{'\n'}
              YTM (semi-annual) ≈ 2.275% → Annual YTM ≈ 4.55%
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>Step 2 — Approximate Modified Duration</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', lineHeight: 1.8 }}>
              MacDur ≈ 8.22 years (weighted avg cash flow timing){'\n'}
              ModDur = 8.22 / (1 + 0.0455/2) = 8.22 / 1.02275 ≈ 8.04 years
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>Step 3 — DV01 per $1,000 face</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', lineHeight: 1.8 }}>
              Price per $1,000 face = $950{'\n'}
              DV01 = 8.04 × $950 × 0.0001 = $0.764 per $1,000 face{'\n'}
              On $10M face: DV01 = $7,638 per basis point
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>Step 4 — Price impact of +50bp yield move</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', lineHeight: 1.8 }}>
              Duration-only: ΔP ≈ -8.04 × 0.005 × $950 = -$38.19 (-4.02%){'\n'}
              Convexity correction (approx Convexity = 80):{'\n'}
              +½ × 80 × (0.005)² × $950 = +$0.95{'\n'}
              Full estimate: -$38.19 + $0.95 = -$37.24 per $1,000 face
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: ACCENT + '18', borderRadius: 8, fontSize: 13, color: ACCENT }}>
            Interpretation: A 50bp rise in yield drops the bond price by ~$37.24 per $1,000 face (3.92%). Convexity adds back $0.95 — modest at 50bp but grows with the square of the yield move.
          </div>
        </div>
      </div>
    </div>
  );
}
