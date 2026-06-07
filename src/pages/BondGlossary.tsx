import { useState } from 'react';

const ACCENT = '#f59e0b';

const TERMS = [
  { term: 'Accrued Interest', def: 'The interest that has accumulated on a bond since the last coupon payment date. Buyers pay accrued interest to sellers at settlement; the dirty price equals the clean price plus accrued interest. Formula: Coupon × (days since last payment / days in coupon period).' },
  { term: 'Agency Bond', def: 'Debt issued by government-sponsored enterprises (GSEs) such as Fannie Mae, Freddie Mac, or Federal Home Loan Banks. Carries an implicit (but not explicit) US government guarantee and yields slightly above Treasuries.' },
  { term: 'Asset Swap (ASW)', def: 'A package combining a fixed-rate bond with a fixed-for-floating interest rate swap. The asset swap spread (SOFR + X bp) represents the credit and liquidity premium over risk-free floating rates. Used widely for European credit valuation.' },
  { term: 'At-Par', def: 'A bond trading at exactly its face value (typically $100 or $1,000). Occurs when the coupon rate equals the yield to maturity. New issue bonds are typically priced at or near par.' },
  { term: 'Barbell', def: 'A portfolio strategy concentrating bond holdings at two maturity extremes (e.g., 2yr and 30yr) with little or no exposure to intermediate maturities. Achieves higher convexity than a bullet at equivalent duration, outperforming in parallel yield shifts.' },
  { term: 'Bear Flattener', def: 'A yield curve movement where short-term rates rise faster than long-term rates, causing the curve to flatten on a rising-rate (bear) backdrop. Typical during Fed hiking cycles when the front end prices in aggressive tightening.' },
  { term: 'Benchmark Bond', def: 'The most recently issued (on-the-run) Treasury of a given maturity, serving as the reference rate for corporate spread calculations and market pricing. Corporate bonds are quoted as a spread "over the benchmark."' },
  { term: 'Breakeven Inflation', def: 'The inflation rate implied by the spread between a nominal Treasury yield and the equivalent-maturity TIPS yield. Breakeven = Nominal Yield − TIPS Yield. If actual inflation exceeds breakeven, TIPS outperforms; if below, nominals outperform.' },
  { term: 'Bull Steepener', def: 'A yield curve movement where long-term rates fall faster than short-term rates, causing the curve to steepen on a falling-rate (bull) backdrop. Often signals the beginning of Fed easing cycles.' },
  { term: 'Bullet', def: 'A portfolio structure concentrating bonds around a single target maturity. Ideal for liability matching (known future payments). Lower convexity than a barbell at equivalent duration.' },
  { term: 'Callable Bond', def: 'A bond the issuer can redeem before maturity at a specified call price (typically at or above par). The call option benefits the issuer when rates fall. Callable bonds must offer higher yields to compensate investors for the embedded call option.' },
  { term: 'Carry', def: 'The income earned from holding a bond position relative to its funding cost. Positive carry = coupon income exceeds repo/funding rate. Negative carry = funding rate exceeds coupon income. Carry is the baseline expected return before any capital gain or loss.' },
  { term: 'Cash Bond', def: 'A physical bond instrument (as opposed to a bond futures contract, CDS, or synthetic exposure). The "cash bond market" refers to the market for actual bonds, with physical or electronic settlement.' },
  { term: 'CDO (Collateralized Debt Obligation)', def: 'A structured credit product backed by a pool of debt instruments (loans, bonds, ABS). Tranched into senior, mezzanine, and equity slices with different risk/return profiles. Infamous role in the 2008 financial crisis through CDO-squared structures on subprime MBS.' },
  { term: 'CDS (Credit Default Swap)', def: 'An OTC derivative contract that transfers credit risk. The protection buyer pays a periodic premium; the protection seller pays par minus recovery value upon a credit event (default, restructuring). CDS spread reflects the market-implied default probability and recovery rate.' },
  { term: 'Clean Price', def: 'The quoted price of a bond excluding accrued interest. Also called the flat price. Screens and Bloomberg display clean prices; the actual invoice amount (dirty price) is clean price plus accrued interest. Facilitates comparison across bonds with different coupon payment dates.' },
  { term: 'Convertible Bond', def: 'A corporate bond that can be converted into a specified number of the issuer\'s equity shares at the investor\'s option. Hybrid instrument with both fixed income (floor value) and equity option (upside). Typically issued with below-market coupon rates due to the embedded conversion option.' },
  { term: 'Convexity', def: 'The second derivative of a bond\'s price with respect to yield — it measures the rate of change of duration. Positive convexity means the bond benefits asymmetrically from yield moves (gains more from decreases than loses from equal increases). Full price change = Duration effect + ½ × Convexity × (Δy)².' },
  { term: 'Coupon', def: 'The periodic interest payment made by a bond issuer to holders. Expressed as an annual percentage of face value. A 5% coupon on a $1,000 par bond pays $50/year, typically as two $25 semi-annual payments.' },
  { term: 'Cross-Currency Basis', def: 'The spread between the interest rate implied by an FX swap and the direct money market rate in the same currency. A negative EUR/USD basis means EUR investors pay above SOFR to access USD funding via FX swaps, reflecting structural USD demand.' },
  { term: 'CTD (Cheapest-to-Deliver)', def: 'In Treasury futures, the specific bond among eligible deliverables that the short position will find most economical to deliver into the futures contract. The CTD is determined by the highest net basis or lowest cost adjusted for the conversion factor. The short holds a delivery option to choose the CTD.' },
  { term: 'CUSIP', def: 'Committee on Uniform Securities Identification Procedures — the 9-character alphanumeric identifier assigned to every US security. The first 6 digits identify the issuer, the next 2 identify the specific issue, and the final digit is a check digit. Used for settlement, trading, and record-keeping.' },
  { term: 'DV01', def: 'Dollar Value of a Basis Point — the change in a bond\'s price for a 1 basis point (0.01%) change in yield. DV01 = Modified Duration × Price × 0.0001. The primary risk metric for bond traders and portfolio managers. Also called PV01 or PVBP.' },
  { term: 'Dirty Price', def: 'The full invoice price of a bond, including accrued interest. What the buyer actually pays and the seller actually receives. Dirty Price = Clean Price + Accrued Interest. Used for settlement calculations; not typically displayed in market quotes.' },
  { term: 'Discount Bond', def: 'A bond trading below its face value (par). This occurs when the bond\'s coupon rate is below the prevailing market yield. The investor earns both the coupon income and a capital gain as the price converges to par at maturity.' },
  { term: 'Duration (Macaulay)', def: 'The weighted average time to receive all of a bond\'s cash flows, where weights are the present values of each cash flow divided by the bond\'s price. Measured in years. A zero-coupon bond\'s Macaulay duration equals its maturity; a coupon bond\'s is shorter.' },
  { term: 'Duration (Modified)', def: 'The percentage price change of a bond for a 1% (100bp) change in yield. Modified Duration = Macaulay Duration / (1 + y/m). The primary linear approximation of interest rate risk. A 7yr modified duration bond loses ~7% in price for a 1% yield rise.' },
  { term: 'Duration (Effective)', def: 'A duration measure computed by shocking the yield curve up and down, repricing the bond (including any embedded option adjustment), and observing the price change. Used for bonds with embedded options (callable bonds, MBS) where Macaulay/Modified duration misrepresents true rate sensitivity.' },
  { term: 'Duration (Key Rate)', def: 'Sensitivity of a bond\'s price to a yield change at a specific maturity point on the curve (e.g., 2yr, 5yr, 10yr, 30yr) while holding other points constant. Used to identify non-parallel curve exposure and to hedge specific maturity buckets.' },
  { term: 'Fallen Angel', def: 'A bond (or issuer) downgraded from investment grade (BBB−/Baa3) to high yield. IG-only mandates are forced sellers; HY indices add the bond simultaneously. Fallen angels historically overshoot cheap on downgrade and subsequently recover, offering buying opportunities.' },
  { term: 'Fixed Income', def: 'Asset class encompassing debt instruments that provide a defined stream of payments — typically fixed coupons and return of principal at maturity. Includes government bonds, corporate bonds, mortgage-backed securities, and municipal bonds.' },
  { term: 'FRN (Floating Rate Note)', def: 'A bond with a variable coupon that resets periodically based on a benchmark rate (SOFR, EURIBOR) plus a fixed spread. FRNs have near-zero duration since coupons adjust with rates, making them useful for capital preservation in rising-rate environments.' },
  { term: 'Forward Rate', def: 'The implied interest rate for a future period derived from current spot rates. The 1yr-into-1yr forward rate is the rate implied for a 1-year loan starting one year from now. Formula: f(t₁,t₂) = [(1+s_t₂)^t₂ / (1+s_t₁)^t₁]^[1/(t₂-t₁)] − 1.' },
  { term: 'G-Spread', def: 'The yield difference between a bond and an interpolated on-the-run Treasury yield of the same maturity. The simplest spread measure; useful for quick comparisons but does not account for the shape of the spot curve. Common for initial screening of corporate bond value.' },
  { term: 'High-Yield (HY)', def: 'Bonds rated below investment grade (below BBB−/Baa3 — rated BB+ or lower). Also called "junk bonds." Offer higher yields to compensate for greater default risk. HY spreads (typically 300–800bp+ over Treasuries) widen in recessions and tighten in growth environments.' },
  { term: 'I-Spread', def: 'Interpolated spread — the yield difference between a bond and the SOFR/LIBOR interest rate swap curve at the same maturity. Removes the Treasury-specific liquidity premium present in G-spreads. Widely used in European credit markets and for cross-currency comparisons.' },
  { term: 'Immunization', def: 'A portfolio strategy matching the duration (and ideally convexity) of an asset portfolio to a liability stream. Eliminates sensitivity to parallel yield shifts (Redington conditions). Used by pension funds and insurers for liability-driven investing (LDI). Requires regular rebalancing as duration drifts.' },
  { term: 'Investment Grade (IG)', def: 'Bonds rated BBB−/Baa3 or above by S&P/Fitch or Moody\'s, respectively. Eligible for purchase by most institutional mandates, insurance companies, and pension funds. Lower yields and lower default rates than high-yield bonds.' },
  { term: 'ISDA', def: 'International Swaps and Derivatives Association — the industry body that publishes standard documentation (ISDA Master Agreement) for OTC derivatives including interest rate swaps, CDS, and cross-currency swaps. ISDA protocols govern netting, close-out, and collateral procedures.' },
  { term: 'Laddering', def: 'A bond portfolio strategy allocating equal amounts across a range of maturities (e.g., 1, 2, 3, 4, 5yr). As each bond matures, proceeds are reinvested at the long end. Smooths reinvestment risk and provides regular liquidity. Suitable for retail buy-and-hold investors.' },
  { term: 'Leverage Ratio', def: 'A key credit metric: typically Net Debt / EBITDA (Net Debt = Total Debt − Cash). Measures how many years of earnings would be required to repay debt. IG firms typically maintain leverage below 2–3×; HY firms often carry 4–7× at issuance.' },
  { term: 'LIBOR', def: 'London Interbank Offered Rate — the historical benchmark floating rate for global credit markets. Phased out December 2021 due to manipulation scandals and lack of transaction support. Replaced by SOFR (Secured Overnight Financing Rate) for USD instruments.' },
  { term: 'Liquidity Premium', def: 'The extra yield demanded by investors for holding less liquid securities. Off-the-run Treasuries carry a 3–10bp liquidity premium over on-the-run equivalents. In credit, illiquid bonds yield more than equivalent-risk liquid ones — the illiquidity premium.' },
  { term: 'MBS (Mortgage-Backed Security)', def: 'A bond backed by a pool of residential or commercial mortgages. Pass-through structures distribute monthly principal and interest to holders. Subject to prepayment risk — homeowners refinancing creates uncertain cash flow timing. OAS is the primary spread measure, adjusting for prepayment optionality.' },
  { term: 'Municipal Bond (Muni)', def: 'Debt issued by state, county, or local government entities. Interest is generally exempt from federal income tax (and often state tax for in-state residents). After-tax yield comparison: Tax-equivalent yield = Muni yield / (1 − marginal tax rate).' },
  { term: 'OAS (Option-Adjusted Spread)', def: 'The spread over the risk-free rate after removing the value of embedded options using an interest rate model. OAS = Z-spread − option value. For callable bonds, OAS < Z-spread. For MBS, OAS adjusts for prepayment optionality. Enables apples-to-apples comparison across callable and non-callable bonds.' },
  { term: 'Off-the-Run', def: 'A previously issued Treasury (or other benchmark bond) that has been superseded by a newer on-the-run issue. Off-the-run Treasuries typically yield 3–10bp more than on-the-run equivalents due to lower liquidity and reduced use as hedge instruments.' },
  { term: 'On-the-Run', def: 'The most recently issued Treasury of a given maturity — the current benchmark. On-the-run bonds carry a liquidity premium (lower yield) due to their role as market benchmarks, highest repo eligibility, and use in derivatives hedging.' },
  { term: 'Par Value', def: 'The face value of a bond — the principal amount repaid at maturity. Typically $1,000 for US corporate bonds; Treasuries are quoted per $100 face. The coupon rate is applied to par value to calculate periodic coupon payments.' },
  { term: 'Premium Bond', def: 'A bond trading above its face value (par). Occurs when the coupon rate exceeds the prevailing market yield. The investor earns coupons above market rates but experiences a capital loss as the price converges to par at maturity.' },
  { term: 'PV01 / PVBP', def: 'Present Value of a Basis Point — equivalent to DV01. The monetary change in a bond\'s price for a 1bp change in yield. Used interchangeably with DV01 across different trading desks. PV01 = Modified Duration × Price × 0.0001.' },
  { term: 'Putable Bond', def: 'A bond where the investor holds the right to sell the bond back to the issuer at par before maturity. The put option benefits investors when rates rise (they can put the bond at par and reinvest at higher rates). Putable bonds offer lower yields than equivalent straight bonds.' },
  { term: 'Repo (Repurchase Agreement)', def: 'A short-term borrowing mechanism where securities are sold with an agreement to repurchase at a slightly higher price. The repo rate is the implied interest cost. Repos fund leveraged bond positions; general collateral (GC) repo rate tracks Fed funds; specific collateral (special) repo rates can trade much lower for on-the-run Treasuries.' },
  { term: 'Rising Star', def: 'A bond (or issuer) upgraded from high yield to investment grade. IG mandates become natural buyers; HY funds may be forced sellers. Bonds typically rally well before the official upgrade as the market anticipates the rating change. Key alpha source for crossover investors.' },
  { term: 'Roll-Down', def: 'The price appreciation earned as a bond shortens in maturity and rolls down a normally sloped yield curve. In a stable curve environment, a 7yr bond becoming a 6yr bond benefits from the lower 6yr yield. Roll-down is "free carry" in a normal curve without any yield change required.' },
  { term: 'Settlement', def: 'The process of exchanging bonds for cash between buyer and seller. US Treasuries settle T+1 (next business day); corporate bonds T+2; municipal bonds T+2. Settlement mismatches between cash bonds and futures/swaps create funding risk on hedged positions.' },
  { term: 'Sovereign Bond', def: 'Debt issued by a national government. US Treasuries are the global benchmark "risk-free" asset. European sovereigns (Bunds, OATs, BTPs) carry varying credit risk. Emerging market sovereign bonds carry FX risk in addition to credit risk if issued in local currency.' },
  { term: 'Spread Duration', def: 'The sensitivity of a bond\'s price to a 1% (100bp) change in its spread (not the risk-free rate). For non-callable bonds, spread duration ≈ interest rate duration. Spread duration is used for managing credit and liquidity risk separately from interest rate risk.' },
  { term: 'STRIPS', def: 'Separate Trading of Registered Interest and Principal Securities — US Treasury zero-coupon bonds created by "stripping" the coupons and principal from a Treasury note or bond. Each payment becomes a separate zero-coupon security. STRIPS directly reveal Treasury spot rates at each maturity.' },
  { term: 'Swap Spread', def: 'The difference between the fixed rate on an interest rate swap and the same-maturity Treasury yield. Reflects bank credit risk and balance sheet costs. Historically positive; turned negative in US for long maturities post-GFC due to regulatory capital constraints on dealer balance sheets.' },
  { term: 'T+1 / T+2', def: 'Settlement timing conventions. T+1 means trades settle the next business day after the trade date. T+2 means two business days after. US equities moved from T+2 to T+1 in 2024. Treasuries settle T+1; most corporate bonds T+2.' },
  { term: 'Term Premium', def: 'The extra yield investors demand for holding long-duration bonds rather than rolling short-term instruments. Compensates for duration risk, inflation uncertainty, and liquidity. The NY Fed ACM model measures the 10yr term premium, which turned negative post-QE and has since risen.' },
  { term: 'TIPS (Treasury Inflation-Protected Securities)', def: 'US Treasury bonds whose principal adjusts daily with CPI. The fixed coupon is applied to the inflation-adjusted principal, so income grows with inflation. TIPS yield = real yield (inflation already accounted for). Breakeven inflation = nominal Treasury yield − TIPS yield.' },
  { term: 'Treasury', def: 'Debt securities issued by the US Department of the Treasury: T-bills (discount, ≤52 weeks), T-notes (2–10yr semi-annual coupon), T-bonds (20–30yr semi-annual coupon), and TIPS. Backed by the full faith and credit of the US government; the global risk-free benchmark.' },
  { term: 'Yield Curve', def: 'A graph showing the yields of bonds of the same credit quality (typically Treasuries) plotted against their maturities. The curve\'s shape (normal, inverted, flat, humped) conveys information about interest rate expectations, monetary policy, and economic outlook.' },
  { term: 'Yield Spread', def: 'The difference in yield between two bonds, typically expressed in basis points. Corporate bonds are quoted as a spread over the equivalent-maturity Treasury. Wider spreads indicate greater perceived risk; tighter spreads indicate lower risk or higher demand.' },
  { term: 'Yield to Call (YTC)', def: 'The yield of a callable bond assuming it is called on the first call date at the call price. Calculated as the IRR using the call date as maturity and the call price as par. Used alongside YTM to determine yield to worst (YTW).' },
  { term: 'Yield to Maturity (YTM)', def: 'The single discount rate that equates the present value of all future cash flows (coupons + par) with the current market price. The most widely used yield measure. Assumes all coupons are reinvested at the YTM rate. Bonds at discount have YTM > coupon rate; premium bonds have YTM < coupon rate.' },
  { term: 'Yield to Worst (YTW)', def: 'The lowest of YTM and all yield to call calculations across every call date and price. The most conservative yield measure for callable bonds — represents the minimum yield the investor will earn if the issuer always acts in its own best interest.' },
  { term: 'Z-Spread', def: 'Zero-volatility spread — the constant spread added to every point on the Treasury spot (zero-coupon) curve such that the present value of all cash flows equals the market price. More accurate than G-spread because it uses zero-coupon rates. For non-callable bonds, Z-spread ≈ OAS.' },
  { term: 'Zero-Coupon Bond', def: 'A bond that pays no periodic coupons, issued at a discount to par and redeemed at face value at maturity. The investor\'s entire return comes from price appreciation. Macaulay duration equals maturity. US Treasury STRIPS are the most common zero-coupon bond market.' },
];

export function BondGlossary() {
  const [search, setSearch] = useState('');

  const filtered = TERMS.filter(
    t =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.def.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped: Record<string, typeof TERMS> = {};
  filtered.forEach(t => {
    const letter = t.term[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(t);
  });

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      {/* Hero */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT, background: ACCENT + '18', border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: '3px 10px' }}>
            Reference
          </span>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
          Bond Market Glossary
        </h1>
        <p style={{ margin: '0 0 20px', color: 'var(--text)', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          {TERMS.length} professional definitions covering bond anatomy, yield measures, spread metrics, structured products, derivatives, and portfolio strategies.
        </p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search terms or definitions..."
          style={{
            width: '100%',
            maxWidth: 500,
            padding: '10px 16px',
            borderRadius: 10,
            border: `1px solid ${search ? ACCENT : 'var(--border)'}`,
            background: 'var(--bg-card)',
            color: 'var(--text-h)',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
        />
        {search && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
          </div>
        )}
      </div>

      {Object.keys(grouped).sort().map(letter => (
        <div key={letter} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: ACCENT, marginBottom: 12, borderBottom: `2px solid ${ACCENT}30`, paddingBottom: 6 }}>
            {letter}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {grouped[letter].map(({ term, def }) => (
              <div
                key={term}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: 14, marginBottom: 6 }}>{term}</div>
                <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.65 }}>{def}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 15 }}>
          No terms found for "{search}". Try a different search.
        </div>
      )}
    </div>
  );
}
