interface Term {
  term: string;
  abbr?: string;
  definition: string;
  example?: string;
  tag: string;
}

const terms: Term[] = [
  // Basics
  {
    term: 'Option Contract',
    definition:
      'A financial derivative giving the buyer the right — but not the obligation — to buy (call) or sell (put) 100 shares of an underlying asset at a specified price before a specified date.',
    example: 'One SPY 500 call contract controls 100 shares of SPY.',
    tag: 'basics',
  },
  {
    term: 'Call Option',
    definition:
      'An option that gives the buyer the right to buy the underlying stock at the strike price. Calls rise in value when the stock goes up.',
    example: 'Buy a TSLA 250 call — you have the right to buy 100 shares of TSLA at $250.',
    tag: 'basics',
  },
  {
    term: 'Put Option',
    definition:
      'An option that gives the buyer the right to sell the underlying stock at the strike price. Puts rise in value when the stock falls.',
    example: 'Buy a TSLA 200 put — you have the right to sell 100 shares of TSLA at $200.',
    tag: 'basics',
  },
  {
    term: 'Strike Price',
    abbr: 'K',
    definition:
      'The fixed price at which the option holder can buy (call) or sell (put) the underlying stock if they exercise the option.',
    example: 'If a stock trades at $100 and you buy a $105 call, the strike is $105.',
    tag: 'basics',
  },
  {
    term: 'Premium',
    definition:
      'The price paid by the option buyer to the seller (writer) to acquire the option contract. It is the market price of the option.',
    example: 'An AAPL 180 call might cost $3.50 per share = $350 for one contract (100 shares).',
    tag: 'basics',
  },
  {
    term: 'Expiration Date',
    definition:
      'The date on which the option contract expires and ceases to exist. If not exercised, it expires worthless.',
    example: 'A "June 20" option expires at market close on June 20th.',
    tag: 'basics',
  },
  {
    term: 'Days to Expiration',
    abbr: 'DTE',
    definition:
      'The number of calendar days remaining until the option expires. Options lose time value faster as DTE approaches zero, especially in the final 30 days.',
    example: 'An option expiring in 2 weeks has ~14 DTE.',
    tag: 'basics',
  },
  {
    term: 'In the Money',
    abbr: 'ITM',
    definition:
      'A call is ITM when the stock price is above the strike. A put is ITM when the stock price is below the strike. ITM options have intrinsic value.',
    example: 'Stock at $105, call strike $100 → ITM by $5.',
    tag: 'basics',
  },
  {
    term: 'Out of the Money',
    abbr: 'OTM',
    definition:
      'A call is OTM when the stock price is below the strike. A put is OTM when the stock price is above the strike. OTM options have zero intrinsic value — only time value.',
    example: 'Stock at $95, call strike $100 → OTM by $5.',
    tag: 'basics',
  },
  {
    term: 'At the Money',
    abbr: 'ATM',
    definition:
      'An option whose strike price is equal (or very close) to the current stock price. ATM options have the highest time value and the most sensitivity to small price moves.',
    example: 'Stock at $100, call strike $100 → ATM.',
    tag: 'basics',
  },
  {
    term: 'Intrinsic Value',
    definition:
      'The real, in-the-money portion of an option\'s premium — what you\'d get if you exercised right now. OTM options have zero intrinsic value.',
    example: 'Stock at $108, call strike $100 → intrinsic value = $8.',
    tag: 'basics',
  },
  {
    term: 'Extrinsic Value',
    definition:
      'Also called "time value" — the portion of premium above intrinsic value. It reflects time remaining, volatility, and interest rates. All options lose extrinsic value over time.',
    example: 'If that $8 ITM call is priced at $10, the extrinsic value is $2.',
    tag: 'basics',
  },
  {
    term: 'Exercise & Assignment',
    definition:
      'Exercise: the buyer uses their right to buy/sell shares. Assignment: the seller (writer) is obligated to fulfill that transaction. American-style options can be exercised any time; European-style only at expiry.',
    tag: 'basics',
  },

  // Volatility
  {
    term: 'Implied Volatility',
    abbr: 'IV',
    definition:
      'The market\'s forward-looking estimate of how much the stock will move, derived from option prices. Higher IV = more expensive options. IV rises before events (earnings, FOMC) and collapses after ("IV crush").',
    example: 'NVDA IV at 60% means the market implies a ~±34% move over the next year (annualized 1σ).',
    tag: 'volatility',
  },
  {
    term: 'Historical Volatility',
    abbr: 'HV',
    definition:
      'The actual realized volatility of the stock measured over a past period (e.g. 30-day HV). Comparing IV to HV tells you if options are "cheap" or "expensive."',
    example: 'If 30-day HV is 25% but IV is 40%, options are richly priced — consider selling.',
    tag: 'volatility',
  },
  {
    term: 'IV Rank',
    abbr: 'IVR',
    definition:
      'Where current IV sits relative to its 52-week range, expressed as a percentile. IVR of 80 means IV is in the top 20% of its yearly range — typically a good time to sell premium.',
    example: 'IVR 80 → sell premium. IVR 10 → consider buying options.',
    tag: 'volatility',
  },
  {
    term: 'IV Crush',
    definition:
      'The sharp drop in IV immediately after a binary event (earnings, FDA) resolves. Options bought before the event often lose value even if the stock moves in the right direction, because the IV component collapses.',
    example: 'AAPL earnings: IV 55% before, drops to 28% after — your long call loses time value even if AAPL beats.',
    tag: 'volatility',
  },
  {
    term: 'Volatility Skew',
    abbr: 'Skew',
    definition:
      'The phenomenon where OTM puts typically trade at higher IV than OTM calls of the same expiry (equity skew). Reflects market demand for downside protection. Skew steepens in fear-driven environments.',
    example: 'SPY 5% OTM put IV: 22%. 5% OTM call IV: 15% → negative skew (put skew).',
    tag: 'volatility',
  },
  {
    term: 'Term Structure',
    definition:
      'How IV varies across different expiration dates. Normally IV is higher for longer-dated options (contango). In stressed markets it inverts — near-term IV spikes above long-dated IV (backwardation).',
    tag: 'volatility',
  },

  // Greeks
  {
    term: 'Delta',
    abbr: 'Δ',
    definition:
      'Rate of change in option price per $1 move in the stock. Calls have positive delta (0 to +1); puts have negative delta (0 to −1). ATM options have ~0.50 delta.',
    example: 'A call with Δ 0.40 gains ~$0.40 for every $1 the stock rises.',
    tag: 'greeks',
  },
  {
    term: 'Gamma',
    abbr: 'Γ',
    definition:
      'Rate of change of delta per $1 stock move — the "acceleration" of delta. High near ATM and near expiration. Long options have positive gamma (delta grows in your favor); short options have negative gamma (works against you).',
    example: 'High gamma near expiry means your delta can swing violently on small price moves.',
    tag: 'greeks',
  },
  {
    term: 'Theta',
    abbr: 'Θ',
    definition:
      'Time decay — the daily dollar erosion of an option\'s extrinsic value as time passes. Long options have negative theta (lose value daily); short options have positive theta (earn daily).',
    example: 'An option with Θ −0.05 loses $5 per day per contract in time value.',
    tag: 'greeks',
  },
  {
    term: 'Vega',
    abbr: 'ν',
    definition:
      'Sensitivity to a 1% change in implied volatility. Long options have positive vega (benefit from rising IV); short options have negative vega (hurt by rising IV).',
    example: 'A call with vega 0.10 gains $10 if IV rises 1%.',
    tag: 'greeks',
  },
  {
    term: 'Rho',
    abbr: 'ρ',
    definition:
      'Sensitivity to a 1% change in interest rates. Generally small for short-dated options but matters for LEAPS. Calls have positive rho; puts have negative rho.',
    tag: 'greeks',
  },
  {
    term: 'Charm',
    definition:
      'Second-order greek: the rate at which delta changes over time (delta decay). Important for delta-hedging strategies near expiry when gamma spikes.',
    tag: 'greeks',
  },

  // Structure
  {
    term: 'Open Interest',
    abbr: 'OI',
    definition:
      'Total number of outstanding option contracts that have not been settled. High OI at a particular strike often acts as a magnet for price ("max pain" theory) and indicates institutional activity.',
    tag: 'structure',
  },
  {
    term: 'Volume',
    definition:
      'Number of contracts traded in a session. High volume relative to OI on a strike can signal a new directional bet (opening position) vs closing/rolling.',
    tag: 'structure',
  },
  {
    term: 'Bid-Ask Spread',
    definition:
      'The difference between the price a market maker will pay (bid) and the price they\'ll sell at (ask). Wide spreads increase your slippage. Always compare the mid-price to fair value.',
    example: 'Bid $2.00, Ask $2.40 → spread of $0.40. Trade near the mid ($2.20) to minimize cost.',
    tag: 'structure',
  },
  {
    term: 'Max Pain',
    definition:
      'The strike price at which the total value of all expiring options (calls + puts) is minimized — in theory causing maximum loss for option buyers. Some traders believe market makers exert "pin" pressure toward this level near expiry.',
    tag: 'structure',
  },
  {
    term: 'Put/Call Ratio',
    abbr: 'P/C',
    definition:
      'Ratio of put volume to call volume. A high P/C ratio indicates bearish sentiment or heavy hedging; a low ratio suggests bullish/complacent sentiment. Often used as a contrarian indicator.',
    tag: 'structure',
  },
  {
    term: 'Options Chain',
    definition:
      'A table showing all available calls and puts for an underlying across all strikes and expiration dates. Lists bid, ask, last, IV, volume, OI, and the greeks for each contract.',
    tag: 'structure',
  },

  // Execution
  {
    term: 'Credit Spread',
    definition:
      'Any spread where you receive more premium than you pay — you start with a credit in your account. Examples: bull put spread, bear call spread. Max gain is the credit; max loss is the spread width minus the credit.',
    tag: 'execution',
  },
  {
    term: 'Debit Spread',
    definition:
      'Any spread where you pay more premium than you receive — you have a net debit. Examples: bull call spread, bear put spread. Max loss is the debit paid; max gain is the spread width minus the debit.',
    tag: 'execution',
  },
  {
    term: 'Rolling',
    definition:
      'Closing an existing position and opening a similar one at a different strike or expiration. Used to extend duration, adjust strikes, or collect additional credit on a tested position.',
    example: 'Roll a short put from this Friday to next Friday to avoid assignment and collect more premium.',
    tag: 'execution',
  },
  {
    term: 'Assignment Risk',
    definition:
      'The risk that a short option is exercised against you, requiring you to buy or sell shares. Short ITM options near expiry — especially with little extrinsic value — have high assignment risk.',
    tag: 'execution',
  },
  {
    term: 'Early Exercise',
    definition:
      'Exercising an American-style option before expiration. Rarely optimal for calls (you give up remaining time value) except just before an ex-dividend date for deep ITM calls.',
    tag: 'execution',
  },
  {
    term: 'Leg In / Leg Out',
    definition:
      'Opening or closing one leg of a multi-leg strategy separately. Legging can improve fill prices but introduces "leg risk" — the market can move between your two orders.',
    tag: 'execution',
  },
  {
    term: 'LEAPS',
    definition:
      'Long-Term Equity Anticipation Securities — options with expiration dates more than one year out. Used as stock replacements (high-delta long calls) or long-duration premium sales.',
    tag: 'execution',
  },
];

const tags = [
  { key: 'basics', label: 'Basics', color: '#6366f1' },
  { key: 'volatility', label: 'Volatility', color: '#8b5cf6' },
  { key: 'greeks', label: 'Greeks', color: '#10b981' },
  { key: 'structure', label: 'Market Structure', color: '#3b82f6' },
  { key: 'execution', label: 'Execution', color: '#f59e0b' },
];

export function Glossary() {
  return (
    <div className="page-wrap">
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
          Options Glossary
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>
          Every term you need to navigate an options chain, understand risk, and talk to your broker.
        </p>
      </div>

      {/* Sections */}
      {tags.map((tag) => (
        <section key={tag.key} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div
              style={{
                width: 4,
                height: 22,
                borderRadius: 2,
                background: tag.color,
              }}
            />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>
              {tag.label}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {terms
              .filter((t) => t.tag === tag.key)
              .map((t) => (
                <div
                  key={t.term}
                  style={{
                    background: '#1a1d27',
                    border: '1px solid #2a2d3e',
                    borderRadius: 10,
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
                      {t.term}
                    </span>
                    {t.abbr && (
                      <span
                        style={{
                          fontSize: 12,
                          color: tag.color,
                          background: `${tag.color}18`,
                          border: `1px solid ${tag.color}40`,
                          borderRadius: 4,
                          padding: '1px 6px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {t.abbr}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 14, color: '#94a3b8', lineHeight: 1.65 }}>
                    {t.definition}
                  </p>
                  {t.example && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 12px',
                        background: '#0f1117',
                        borderRadius: 6,
                        borderLeft: `3px solid ${tag.color}`,
                        fontSize: 13,
                        color: '#64748b',
                        fontStyle: 'italic',
                      }}
                    >
                      {t.example}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
