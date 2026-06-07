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

export function RelativeValue() {
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
          Relative Value Analysis
        </h1>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          Relative value (RV) analysis focuses on identifying mispricings between related instruments rather than directional bets on rates or spreads. RV traders exploit structural dislocations, technical supply/demand imbalances, and optionality mispricing across Treasuries, swaps, and credit instruments.
        </p>
      </div>

      <SectionHeader title="Carry & Roll-Down Decomposition" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Total return for a bond held over a horizon is decomposed into three components:
        </p>
        <Formula>
          Total Return = Coupon Income + Price Change (capital gain/loss) + Reinvestment
          {'\n'}
          Price Change = Yield Change Effect + Roll-Down Effect
        </Formula>
        <p style={{ margin: '12px 0 14px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The <strong style={{ color: 'var(--text-h)' }}>roll-down return</strong> is the price appreciation earned simply from the passage of time (yield falling as the bond shortens) assuming the curve stays unchanged. It is "free carry" in a stable rate environment.
        </p>
        <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 12 }}>Worked Example: 6-Month Carry + Roll</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', lineHeight: 2 }}>
            Bond: 5yr Treasury, yield = 4.25%, coupon = 4.25%, price = 100
            <br />
            In 6 months: bond becomes 4.5yr; if 4.5yr yield = 4.15% (normal curve)
            <br />
            Roll-down gain: ModDur × Δy ≈ 4.0 × 0.10% × 100 = $0.40 per $100 face
            <br />
            Coupon income: 4.25% × (6/12) = $2.125 per $100 face
            <br />
            6-month total return ≈ $2.125 + $0.40 = $2.525 (annualized ≈ 5.05%)
          </div>
        </div>
      </div>

      <SectionHeader title="Asset Swap Spread (ASW)" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          An asset swap converts a fixed-rate bond into a floating-rate instrument by pairing it with a fixed-for-floating interest rate swap. In the <strong style={{ color: 'var(--text-h)' }}>par-par asset swap</strong> structure:
        </p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {[
            'Investor buys the bond at par (pays 100 regardless of market price)',
            'Investor pays the bond\'s fixed coupon on the swap',
            'Investor receives SOFR + ASW spread on the swap',
            'Net: investor holds bond risk, earns floating rate = SOFR + ASW spread',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              <span style={{ color: ACCENT, fontWeight: 700, width: 20, flexShrink: 0 }}>{i + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The ASW spread reflects both credit risk and liquidity premium over risk-free SOFR. A widening ASW spread signals deteriorating credit quality or liquidity conditions. ASW is the primary spread measure for Covered Bonds and European investment-grade credit. For distressed credits, ASW becomes less meaningful as par-value assumptions break down.
        </p>
      </div>

      <SectionHeader title="Z-Spread vs OAS" />
      <div style={card()}>
        <div className="g-2" style={{ gap: 16 }}>
          <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>Z-Spread</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              Static spread added to every point on the Treasury spot curve to match market price. Assumes no interest rate volatility. Suitable for vanilla non-callable bonds — for these, Z-spread ≈ OAS. Becomes meaningfully different from OAS when the bond has embedded optionality.
            </p>
          </div>
          <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: 14 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-h)', marginBottom: 6 }}>OAS</div>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>
              Option-adjusted spread removes the value of embedded options using a term structure model with rate volatility. For a callable bond: OAS = Z-spread − call option value. For MBS: OAS = Z-spread − prepayment option value. Comparing OAS across callable and non-callable bonds gives an apples-to-apples spread measure.
            </p>
          </div>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, fontSize: 13 }}>
          <strong style={{ color: ACCENT }}>Key rule:</strong> <span style={{ color: 'var(--text)' }}>Z-spread ≥ OAS for callable bonds (issuer option has positive value). Z-spread ≤ OAS for putable bonds (investor option has positive value). For agency MBS, Z-spread &gt;&gt; OAS due to large prepayment option.</span>
        </div>
      </div>

      <SectionHeader title="Swap Spreads" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The <strong style={{ color: 'var(--text-h)' }}>swap spread</strong> = fixed rate on an SOFR interest rate swap minus the same-maturity Treasury yield. It theoretically reflects the credit risk premium of the interbank market over risk-free Treasuries.
        </p>
        <Formula>
          10yr Swap Spread = 10yr SOFR Swap Rate − 10yr Treasury Yield
        </Formula>
        <p style={{ margin: '12px 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          In normal conditions, swap spreads are modestly positive (+10–30bp for 10yr). Periods of banking stress push spreads wider (2008). Post-GFC balance sheet constraints led to historically anomalous <strong style={{ color: '#ef4444' }}>negative swap spreads</strong> in the US 10yr+ tenors — the Treasury yield exceeded the swap rate — due to limited bank dealer capacity to hold offsetting positions.
        </p>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Swap spread wideners and tighteners are active trades — institutional fixed income managers use swap spread positions to express views on bank credit conditions, regulatory balance sheet costs, and Treasury supply technicals.
        </p>
      </div>

      <SectionHeader title="On/Off-the-Run Spread" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The most recently auctioned Treasury (on-the-run, OTR) trades at a <strong style={{ color: 'var(--text-h)' }}>liquidity premium</strong> of roughly 3–10bp yield discount vs older issues (off-the-run, OFR) of similar maturity. OTR bonds are repo-able at the lowest haircuts (highest liquidity), accepted as collateral in derivatives margin, and used as hedging benchmarks.
        </p>
        <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The OTR/OFR trade is a classic convergence trade: buy OFR (cheap), short OTR (rich), wait for convergence when the next auction makes the current OTR into OFR. The trade earns the spread but requires repo funding for both legs. LTCM's failure in 1998 included large OTR/OFR positions that widened dramatically in the Russian crisis — a warning that even "riskless" arbitrage has significant liquidity and funding risk.
        </p>
      </div>

      <SectionHeader title="Cheapest-to-Deliver (CTD)" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          Treasury futures contracts specify a notional 6% coupon 10-year bond but allow the short (seller) to deliver any of a range of eligible Treasury notes. The short uses a <strong style={{ color: 'var(--text-h)' }}>conversion factor (CF)</strong> to normalize prices, but the CF system is approximate — some bonds are systematically cheaper to deliver than others.
        </p>
        <Formula>
          Invoice Price = Futures Price × CF + Accrued Interest
          {'\n'}
          Net Basis = Bond Price − Futures Price × CF
          {'\n'}
          CTD = Bond with highest delivery profit (lowest net basis)
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          The CTD bond changes as yields move: at low yields, high-duration bonds become CTD; at high yields, low-duration bonds become CTD. The short futures position holds a <strong style={{ color: ACCENT }}>delivery option</strong> — the right to choose which bond to deliver. This option has value (reduces the futures price relative to the forward price of any individual bond). Understanding CTD is essential for hedging bond portfolios with futures.
        </p>
      </div>

      <SectionHeader title="Cross-Currency Basis" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          When a non-US investor buys USD assets and hedges the FX risk via a cross-currency swap (CCS), the implied USD interest rate they earn differs from actual USD SOFR. This difference is the <strong style={{ color: 'var(--text-h)' }}>cross-currency basis</strong>:
        </p>
        <Formula>
          Cross-Ccy Basis = Implied USD rate from FX swap − USD SOFR
        </Formula>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          A negative EUR/USD basis (EUR investors pay above SOFR to access USD funding) reflects excess demand for USD. Typically driven by: (1) Japanese and European investors buying USD assets hedged; (2) US corporations issuing in EUR and swapping to USD; (3) quarter-end regulatory balance sheet compression. Basis widening = USD funding premium rising; common in year-end, quarter-end, and risk-off episodes. Cross-currency basis swaps allow direct trading of this premium.
        </p>
      </div>

      <SectionHeader title="Butterfly (RV Fly)" />
      <div style={card()}>
        <p style={{ margin: '0 0 12px', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          An RV butterfly expresses a view on the <strong style={{ color: 'var(--text-h)' }}>relative richness or cheapness of the belly</strong> vs the wings of the curve. The fly is constructed DV01-neutral across all three legs:
        </p>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: ACCENT, background: 'var(--bg)', borderRadius: 8, padding: '12px 18px', margin: '12px 0' }}>
          Fly = +DV01_wing1 (short/long) − DV01_belly (long/short) + DV01_wing2 (short/long)
          <br />
          where: w1 × DV01_2yr + w2 × DV01_30yr = DV01_10yr
        </div>
        <p style={{ margin: '12px 0 0', color: 'var(--text)', fontSize: 14, lineHeight: 1.7 }}>
          A long fly (long wings, short belly) profits when the belly cheapens (10yr yield rises relative to wings). It has zero DV01 in parallel shifts, only curvature sensitivity. Flies are commonly run as RV expression of supply/demand in specific maturities — e.g., heavy Treasury supply at 10yr auctions cheapens the belly; corporate issuers hedging in 5-10yr swaps can create technicals.
        </p>
      </div>
    </div>
  );
}
