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

const RATING_TABLE = [
  { moodys: 'Aaa', sp: 'AAA', fitch: 'AAA', category: 'Investment Grade', spreadRange: '20–50bp', examples: 'US Treasury (reference), top-tier govts' },
  { moodys: 'Aa1/Aa2/Aa3', sp: 'AA+/AA/AA−', fitch: 'AA+/AA/AA−', category: 'Investment Grade', spreadRange: '40–80bp', examples: 'Microsoft, J&J, top European banks' },
  { moodys: 'A1/A2/A3', sp: 'A+/A/A−', fitch: 'A+/A/A−', category: 'Investment Grade', spreadRange: '70–130bp', examples: 'Apple, Toyota, large industrials' },
  { moodys: 'Baa1/Baa2/Baa3', sp: 'BBB+/BBB/BBB−', fitch: 'BBB+/BBB/BBB−', category: 'Investment Grade', spreadRange: '120–250bp', examples: 'Ford IG debt, airlines, retail' },
  { moodys: 'Ba1/Ba2/Ba3', sp: 'BB+/BB/BB−', fitch: 'BB+/BB/BB−', category: 'High Yield', spreadRange: '300–500bp', examples: 'BB-rated LBO issuers, crossover names' },
  { moodys: 'B1/B2/B3', sp: 'B+/B/B−', fitch: 'B+/B/B−', category: 'High Yield', spreadRange: '500–800bp', examples: 'Leveraged buyout debt, growth cos' },
  { moodys: 'Caa/Ca', sp: 'CCC/CC/C', fitch: 'CCC/CC/C', category: 'Distressed', spreadRange: '800bp+', examples: 'Distressed, near-default issuers' },
  { moodys: 'C', sp: 'D', fitch: 'D', category: 'Default', spreadRange: 'Recovery-based', examples: 'Post-default, trading on recovery value' },
];

export function CreditAnalysis() {
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
          Credit Analysis
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          Corporate bond investors are paid for bearing credit risk — the risk an issuer fails to pay coupons or principal. Understanding rating methodologies, spread measures, and credit derivatives is essential for navigating the $10+ trillion corporate bond market.
        </p>
      </div>

      <SectionHeader title="Credit Rating Scales" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {("Moody's,S&P / Fitch,Fitch,Category,Typical Spread,Examples").split(',').map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: ACCENT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATING_TABLE.map((row, i) => {
              const isIG = row.category === 'Investment Grade';
              const isDistressed = row.category === 'Distressed' || row.category === 'Default';
              const rowBg = i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)';
              const catColor = isIG ? '#10b981' : isDistressed ? '#ef4444' : ACCENT;
              return (
                <tr key={row.moodys} style={{ background: rowBg }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-h)', fontWeight: 600 }}>{row.moodys}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-h)', fontWeight: 600 }}>{row.sp}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-h)', fontWeight: 600 }}>{row.fitch}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: catColor + '20', color: catColor, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{row.category}</span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>{row.spreadRange}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{row.examples}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
        The IG/HY boundary falls at BBB−/Baa3. Crossing this line triggers forced selling by IG-only mandates and inclusion/exclusion from major indices — often causing significant price dislocations.
      </p>

      <SectionHeader title="Rating Committee Process & Notching" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Rating agencies assign a corporate family rating (CFR) to the issuer, then <strong style={{ color: 'var(--text-h)' }}>notch</strong> individual instruments up or down based on seniority in the capital structure. Senior secured debt (first lien) is typically notched 1–2 above the CFR; unsecured debt at or near the CFR; subordinated debt 1–2 below; equity effectively has no floor.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {[
            { level: 'Senior Secured (1st Lien)', note: 'CFR +1 to +2', color: '#10b981' },
            { level: 'Senior Unsecured', note: 'At CFR', color: ACCENT },
            { level: 'Senior Sub', note: 'CFR −1', color: '#f97316' },
            { level: 'Subordinated', note: 'CFR −1 to −2', color: '#ef4444' },
            { level: 'PIK / Junior Sub', note: 'CFR −2 to −3', color: '#dc2626' },
          ].map(({ level, note, color }) => (
            <div key={level} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>{level}</div>
              <div style={{ fontSize: 11, color, fontFamily: 'monospace' }}>{note}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader title="Spread Measures" />
      <div style={{ display: 'grid', gap: 12 }}>
        {[
          {
            name: 'G-Spread (Government Spread)',
            formula: 'Bond Yield − Interpolated Treasury Yield at same maturity',
            desc: 'The simplest spread measure. Useful for quick comparisons but ignores the shape of the spot curve — it uses par yields rather than zero-coupon rates. Good for high-level screening.',
            color: '#6366f1',
          },
          {
            name: 'I-Spread (Interpolated Swap Spread)',
            formula: 'Bond Yield − Interpolated Swap Rate at same maturity',
            desc: 'Uses the SOFR swap curve instead of Treasuries. Removes the Treasury-specific liquidity premium and is more comparable across currencies. Widely used in European credit markets.',
            color: '#3b82f6',
          },
          {
            name: 'Z-Spread (Zero-Volatility Spread)',
            formula: 'Constant spread σ: Price = Σ [CF_t / (1 + s_t + σ)^t]',
            desc: 'The constant spread added to every point on the Treasury spot curve such that the discounted cash flows equal the market price. More accurate than G-spread because it uses the full zero-coupon curve. The Z in "zero-volatility" means no interest rate volatility is assumed — suitable for non-callable bonds.',
            color: ACCENT,
          },
          {
            name: 'OAS (Option-Adjusted Spread)',
            formula: 'Z-Spread − Value of Embedded Options',
            desc: 'For callable bonds, the call option has value to the issuer (they\'ll call if rates fall). OAS strips out the option value using a rate volatility model, leaving the "pure" credit and liquidity spread. For non-callable bonds, OAS ≈ Z-spread. For MBS, OAS accounts for prepayment optionality — the primary spread metric for mortgage bonds.',
            color: '#10b981',
          },
        ].map(({ name, formula, desc, color }) => (
          <div key={name} style={card()}>
            <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 6 }}>{name}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>{formula}</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      <SectionHeader title="Credit Default Swaps (CDS)" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          A CDS is a bilateral OTC contract that transfers credit risk. The <strong style={{ color: 'var(--text-h)' }}>protection buyer</strong> pays a periodic running premium (e.g., 150bp/yr on notional) to the <strong style={{ color: 'var(--text-h)' }}>protection seller</strong>. If a credit event (default, restructuring, failure to pay) occurs, the seller delivers par and receives the defaulted bond (physical settlement) or pays the loss (cash settlement).
        </p>
        <Formula>
          CDS-Bond Basis = CDS Spread − Bond Z-Spread
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          In theory, the CDS spread should equal the bond Z-spread (both transfer the same credit risk). In practice, the basis deviates due to funding costs, counterparty risk, cheapest-to-deliver optionality, and market segmentation. A <strong style={{ color: '#10b981' }}>negative basis</strong> (bond Z-spread &gt; CDS spread) suggests the bond is cheap relative to the CDS — a classic relative value trade for hedge funds (buy bond, buy CDS protection).
        </p>
      </div>

      <SectionHeader title="Key Credit Metrics by Sector" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card)' }}>
              {['Sector', 'Net Leverage', 'Interest Coverage', 'FCF / Debt', 'Notes'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: ACCENT, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { sector: 'IG Industrial', lev: '1.5–2.5×', cov: '>8×', fcf: '>10%', notes: 'Stable cash flows; focus on EBITDA margins' },
              { sector: 'IG Utility', lev: '3–5×', cov: '4–6×', fcf: 'Low (capex-heavy)', notes: 'Regulated cash flows; rate base growth drives credit' },
              { sector: 'IG Financials', lev: 'CET1 ratio focus', cov: 'Net interest margin', fcf: 'N/A', notes: 'Capital ratios and liquidity coverage ratio (LCR) are key' },
              { sector: 'HY Leveraged', lev: '4–7×', cov: '2–4×', fcf: '5–15%', notes: 'LBO targets; covenant analysis critical; maturity wall risk' },
              { sector: 'HY Energy', lev: '2–4×', cov: '3–5×', fcf: 'Variable', notes: 'Commodity price sensitivity; reserve replacement ratio matters' },
              { sector: 'Distressed', lev: '>7×', cov: '<2×', fcf: 'Negative', notes: 'Focus on enterprise value, recovery rate, capital structure' },
            ].map((row, i) => (
              <tr key={row.sector} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}>
                <td style={{ padding: '9px 14px', color: 'var(--text-h)', fontWeight: 600 }}>{row.sector}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>{row.lev}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>{row.cov}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 12 }}>{row.fcf}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionHeader title="Fallen Angels & Rising Stars" />
      <div style={card()}>
        <div className="g-2" style={{ gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 14, marginBottom: 8 }}>Fallen Angels — IG to HY</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              When an issuer is downgraded below BBB−/Baa3, it falls from investment grade to high yield. IG-only mandates are <em>forced sellers</em> regardless of fundamental value. HY indices add the bond at the same time. This creates a predictable supply/demand dislocation — fallen angel bonds often overshoot cheap on downgrade day and then recover over subsequent weeks as HY buyers absorb the supply. The ICE BofA US Fallen Angel index has historically outperformed the broader HY index.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14, marginBottom: 8 }}>Rising Stars — HY to IG</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              An upgrade from HY to IG is a rising star event. IG mandates become natural buyers, HY funds may be forced sellers. Bonds typically re-price tighter (lower yield) well in advance as the upgrade becomes anticipated. Identifying pre-upgrade credits is a key alpha source for crossover investors running both IG and HY mandates. Key triggers: deleveraging events, M&amp;A divestitures, or sustained FCF improvement.
            </p>
          </div>
        </div>
      </div>

      <SectionHeader title="Distressed Debt" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Bonds trading below 70 cents on the dollar are conventionally considered <strong style={{ color: 'var(--text-h)' }}>distressed</strong>. At this level, yield measures lose meaning — what matters is <strong style={{ color: ACCENT }}>recovery value</strong>: how much will the bondholders receive in restructuring or bankruptcy?
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { point: 'Capital Structure Seniority', desc: 'In US Chapter 11, absolute priority rule governs: secured creditors paid first, then unsecured, then subordinated, then equity. Analysis focuses on where the "fulcrum security" sits — the instrument most likely to receive equity in a reorganization plan.' },
            { point: 'Recovery Rate Analysis', desc: 'Historical average recovery for senior secured = ~65%; senior unsecured = ~40%; subordinated = ~15%. Recovery varies enormously by asset intensity, jurisdiction, and liquidity of collateral.' },
            { point: 'Loan-to-Value (LTV)', desc: 'For asset-rich companies, the implied LTV (enterprise value / debt) determines whether debt is covered. Below 100% LTV at a given tranche, that debt is out-of-the-money on liquidation value.' },
          ].map(({ point, desc }) => (
            <div key={point} style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-h)', fontSize: 13, marginBottom: 4 }}>{point}</div>
              <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
