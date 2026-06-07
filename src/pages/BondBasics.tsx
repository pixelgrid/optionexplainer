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

const BOND_TYPES = [
  { type: 'T-Bills', issuer: 'US Treasury', maturity: '4–52 weeks', coupon: 'Discount (zero-coupon)', notes: 'Backed by full faith of US govt; most liquid instrument on Earth' },
  { type: 'T-Notes', issuer: 'US Treasury', maturity: '2, 3, 5, 7, 10yr', coupon: 'Semi-annual fixed', notes: 'Benchmark for mortgage rates, corporate spreads' },
  { type: 'T-Bonds', issuer: 'US Treasury', maturity: '20, 30yr', coupon: 'Semi-annual fixed', notes: '"The long bond" — sensitive to inflation & term premium' },
  { type: 'TIPS', issuer: 'US Treasury', maturity: '5, 10, 30yr', coupon: 'Fixed % on inflation-adjusted principal', notes: 'Real yield instrument; principal accretes with CPI' },
  { type: 'Agency / GSE', issuer: 'Fannie Mae, Freddie Mac', maturity: '2–30yr', coupon: 'Fixed or floating', notes: 'Implicit govt backing; slightly higher yield than Treasuries' },
  { type: 'Inv-Grade Corp', issuer: 'Rated BBB-/Baa3 or above', maturity: '3–30yr', coupon: 'Fixed (mostly)', notes: 'G-spread of ~50–200bp over Treasuries; IG index constituents' },
  { type: 'High-Yield', issuer: 'Rated BB+/Ba1 or below', maturity: '5–10yr', coupon: 'Fixed; higher coupon', notes: '"Junk bonds" — G-spread of 300–800bp+; default risk material' },
  { type: 'Municipal', issuer: 'State & local govts', maturity: '1–30yr', coupon: 'Fixed or variable', notes: 'Federally tax-exempt; compare after-tax yield vs Treasuries' },
  { type: 'Covered Bonds', issuer: 'European banks', maturity: '2–10yr', coupon: 'Fixed', notes: 'Dual recourse: issuer + cover pool; AAA-rated typically' },
  { type: 'ABS / MBS', issuer: 'SPV trusts', maturity: 'Variable (prepayment risk)', coupon: 'Fixed or floating', notes: 'Pass-through of mortgage/loan cash flows; OAS is key spread measure' },
];

export function BondBasics() {
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
          Bond Basics
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          The global bond market (~$130 trillion) is larger than equities. Understanding bond anatomy, pricing conventions, yield measures, and settlement mechanics is the foundation of fixed income investing.
        </p>
      </div>

      {/* Key stats */}
      <div className="g-4" style={{ gap: 12, margin: '28px 0' }}>
        {[
          { value: '$130T', label: 'Global bond market size', color: ACCENT },
          { value: '~$700B', label: 'Average daily Treasury volume', color: '#10b981' },
          { value: 'T+1', label: 'Treasury settlement', color: '#6366f1' },
          { value: 'T+2', label: 'Corporate bond settlement', color: '#3b82f6' },
        ].map(({ value, label, color }) => (
          <div key={label} style={card({ textAlign: 'center' })}>
            <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{label}</div>
          </div>
        ))}
      </div>

      <SectionHeader title="Bond Anatomy" />
      <div style={card()}>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { term: 'Face / Par Value', def: 'The principal amount repaid at maturity. Conventionally $1,000 for US corporate bonds, $100 for Treasuries (quoted per $100 face). This is the base for coupon calculations.' },
            { term: 'Coupon Rate', def: 'The stated annual interest rate paid on face value. A 5% coupon on $1,000 par pays $50/year, typically in two semi-annual installments of $25 each. Fixed-rate bonds lock this in; floating-rate notes (FRNs) reset periodically off SOFR or another reference rate.' },
            { term: 'Maturity Date', def: 'The date the issuer repays par value. Bills: ≤1yr; notes: 2–10yr; bonds: >10yr. The time remaining to maturity drives interest-rate sensitivity (duration).' },
            { term: 'Settlement', def: 'US Treasuries and agencies settle T+1 (next business day). Investment-grade and high-yield corporate bonds settle T+2. Municipal bonds T+2. Mismatches in settlement create funding risk on cross-asset hedges.' },
            { term: 'CUSIP', def: 'Committee on Uniform Securities Identification Procedures — the 9-character alphanumeric identifier for every US security. First 6 digits identify the issuer; next 2 identify the instrument; final digit is a check digit. DTC holds bonds in nominee form and settles electronically.' },
          ].map(({ term, def }) => (
            <div key={term} style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14, marginBottom: 4 }}>{term}</div>
              <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{def}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader title="Clean Price vs Dirty Price & Accrued Interest" />
      <div style={card()}>
        <p style={{ margin: '0 0 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Bonds trade at two prices simultaneously. The <strong style={{ color: 'var(--text-h)' }}>clean price</strong> (or flat price) is what's quoted on screens — it excludes interest that has accumulated since the last coupon payment. The <strong style={{ color: 'var(--text-h)' }}>dirty price</strong> (full price or invoice price) is what the buyer actually pays, and equals the clean price plus accrued interest (AI).
        </p>
        <Formula>
          AI = Coupon × (Days since last payment / Days in coupon period)
          <br />
          Dirty Price = Clean Price + AI
        </Formula>
        <p style={{ margin: '14px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Day count conventions matter: US Treasuries use <strong style={{ color: 'var(--text-h)' }}>Actual/Actual</strong>; most corporate bonds use <strong style={{ color: 'var(--text-h)' }}>30/360</strong>; money market instruments use Actual/360. Getting day counts wrong is a classic settlement error in back-office systems.
        </p>
      </div>

      <SectionHeader title="Yield Measures" />
      <div style={{ display: 'grid', gap: 12 }}>
        {[
          {
            name: 'Current Yield',
            formula: 'Annual Coupon / Market Price',
            desc: 'A quick but incomplete yield measure. Ignores capital gains/losses from price-to-par convergence at maturity, and ignores the time value of intermediate coupon payments.',
            color: '#3b82f6',
          },
          {
            name: 'Yield to Maturity (YTM)',
            formula: 'IRR solving: Price = Σ[C/(1+y)^t] + FV/(1+y)^n',
            desc: 'The single discount rate that makes the present value of all future cash flows (coupons + par) equal to the current market price. YTM is the most important yield measure — it assumes all coupons are reinvested at the same rate, which is a theoretical simplification but practically useful for comparison.',
            color: ACCENT,
          },
          {
            name: 'Yield to Call (YTC)',
            formula: 'IRR using first call date as "maturity" and call price as "par"',
            desc: 'For callable bonds, YTC calculates yield assuming the issuer calls the bond on the first call date at the call price. High-grade callable bonds often trade to the call date when trading above par (likely to be called).',
            color: '#10b981',
          },
          {
            name: 'Yield to Worst (YTW)',
            formula: 'min(YTM, YTC for each call date)',
            desc: 'The lowest of YTM and all YTC calculations across all call dates. YTW is the correct yield to use when valuing callable bonds — it represents the worst-case yield the investor can earn if the issuer acts in its own best interest.',
            color: '#8b5cf6',
          },
        ].map(({ name, formula, desc, color }) => (
          <div key={name} style={card()}>
            <div style={{ fontWeight: 700, color, fontSize: 15, marginBottom: 6 }}>{name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>{formula}</div>
            <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      <SectionHeader title="Price Quoting Conventions" />
      <div style={card()}>
        <div className="g-2" style={{ gap: 12 }}>
          <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14, marginBottom: 6 }}>US Treasuries — Quoted in 32nds</div>
            <p style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              Treasury prices are quoted as whole points plus 32nds of a point. A quote of <strong style={{ color: ACCENT }}>99-16</strong> means 99 and 16/32 = 99.500 per $100 face. A quote of <strong style={{ color: ACCENT }}>99-16+</strong> means 99-16.5/32 = 99.515625. T-bill quotes are in discount rate, not price.
            </p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px' }}>
              99-08 = 99.250 | 99-16 = 99.500 | 99-24 = 99.750 | 100-00 = 100.000
            </div>
          </div>
          <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 14, marginBottom: 6 }}>Corporates &amp; Munis — Decimal</div>
            <p style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              Corporate bonds are quoted in decimal dollars per $100 face value. A price of <strong style={{ color: '#6366f1' }}>98.75</strong> means $987.50 per $1,000 face. Institutional trades are quoted with a spread to Treasuries (e.g., "+185bp" to the 10yr). Munis are often quoted in yield.
            </p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px' }}>
              Bid: 98.500 / Ask: 98.625 → bid-ask spread = 12.5 cents per $100
            </div>
          </div>
        </div>
      </div>

      <SectionHeader title="Bond Types" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {['Type', 'Issuer', 'Maturity', 'Coupon', 'Key Notes'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: ACCENT, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOND_TYPES.map((row, i) => (
              <tr key={row.type} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                <td style={{ padding: '9px 14px', color: 'var(--text-h)', fontWeight: 600 }}>{row.type}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)' }}>{row.issuer}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)' }}>{row.maturity}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)' }}>{row.coupon}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader title="Primary vs Secondary Market" />
      <div style={card()}>
        <div className="g-2" style={{ gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>Primary Market</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              New bonds are issued via <strong style={{ color: 'var(--text-h)' }}>auction</strong> (Treasuries) or <strong style={{ color: 'var(--text-h)' }}>underwritten book-build</strong> (corporates/munis). Treasury auctions occur weekly for bills, monthly for notes/bonds. Primary dealers (banks like JPMorgan, Goldman) must participate. Corporate issuers hire bookrunning banks to price and allocate bonds to institutional investors during a roadshow.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>Secondary Market</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              Post-issuance trading occurs OTC (over-the-counter) via dealer-to-client and dealer-to-dealer markets. Bloomberg terminals and MarketAxess/Tradeweb provide electronic execution. <strong style={{ color: 'var(--text-h)' }}>On-the-run</strong> Treasuries (most recently issued) are the most liquid; <strong style={{ color: 'var(--text-h)' }}>off-the-run</strong> issues trade at slightly higher yields due to lower liquidity.
            </p>
          </div>
        </div>
      </div>

      <SectionHeader title="Worked Example: Calculating Yield Measures" />
      <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontWeight: 700, color: ACCENT, fontSize: 15, marginBottom: 12 }}>
          5% coupon, $1,000 par bond trading at $980, 5 years to maturity
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Step 1 — Current Yield</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px' }}>
              Current Yield = $50 / $980 = 5.10%
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Step 2 — Approximate YTM (short-cut formula)</div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', borderRadius: 6, padding: '8px 12px' }}>
              Approx YTM ≈ [C + (FV - P)/n] / [(FV + P)/2]
              <br />
              = [$50 + ($1,000 - $980)/5] / [($1,000 + $980)/2]
              <br />
              = [$50 + $4] / [$990]
              <br />
              = $54 / $990 ≈ 5.45%
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Interpretation</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              The bond trades at a <strong style={{ color: ACCENT }}>discount</strong> ($980 &lt; $1,000 par), so the YTM (5.45%) exceeds the coupon rate (5.0%) — the investor earns not just the coupon but also a pull-to-par gain of $20 spread over 5 years. The YTM is the "true" yield accounting for all cash flows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
