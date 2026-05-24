export type Category = 'bullish' | 'bearish' | 'neutral' | 'volatile' | 'synthetic';

export interface Strategy {
  id: string;
  name: string;
  category: Category;
  description: string;
  whenToUse: string;
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
  spot: number;
  chartRange: [number, number];
  payoff: (s: number) => number;
}

const c = (k: number) => (s: number) => Math.max(s - k, 0);
const p = (k: number) => (s: number) => Math.max(k - s, 0);

export const strategies: Strategy[] = [
  // ══════════════════════════════════════════════════════════════
  // BULLISH
  // ══════════════════════════════════════════════════════════════
  {
    id: 'long-call',
    name: 'Long Call',
    category: 'bullish',
    description:
      'Buy a call option giving you the right to purchase shares at the strike price. Profit is unlimited to the upside; maximum loss is the premium paid.',
    whenToUse:
      'When you have strong bullish conviction and want leveraged upside with defined risk. Best entered when IV is relatively low (you pay a fair premium). Works well ahead of expected catalysts when the IV hasn\'t spiked yet.',
    maxProfit: 'Unlimited',
    maxLoss: 'Premium paid ($5)',
    breakeven: 'Strike + premium = $105',
    spot: 100,
    chartRange: [60, 145],
    payoff: (s) => c(100)(s) - 5,
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    category: 'bullish',
    description:
      'Own 100 shares and sell an OTM call against them. You collect premium income upfront and give up appreciation above the short strike. The long stock "covers" your obligation.',
    whenToUse:
      'When you own stock and want to generate monthly income in a sideways or mildly bullish environment. Also reduces your cost basis on a long position. Avoid when you expect a strong rally above the short strike.',
    maxProfit: 'Strike − entry + premium = $14',
    maxLoss: 'Entry − premium = $96 (stock → 0)',
    breakeven: 'Entry − premium = $96',
    spot: 100,
    chartRange: [60, 145],
    payoff: (s) => (s - 100) + 4 - c(110)(s),
  },
  {
    id: 'bull-call-spread',
    name: 'Bull Call Spread',
    category: 'bullish',
    description:
      'Buy a lower-strike call and sell a higher-strike call at the same expiry. The short call caps gains but significantly reduces the net debit compared to a plain long call.',
    whenToUse:
      'When moderately bullish with a defined price target near the short strike. Works well when IV is elevated — the expensive long call is partially funded by the short call you sell. Size it so the spread width matches your price target.',
    maxProfit: 'Spread width − net debit = $6',
    maxLoss: 'Net debit paid = $4',
    breakeven: 'Long strike + net debit = $104',
    spot: 100,
    chartRange: [80, 130],
    payoff: (s) => c(100)(s) - c(110)(s) - 4,
  },
  {
    id: 'bull-put-spread',
    name: 'Bull Put Spread',
    category: 'bullish',
    description:
      'Sell a higher-strike OTM put and buy a lower-strike put for protection. Receive a net credit; profit if the stock stays above the short put strike at expiry.',
    whenToUse:
      'When mildly bullish or neutral on a stock. High-IV environments yield fatter credits. Great for income generation on a stock you\'d be happy owning at the short strike level. Defined risk makes it straightforward to size.',
    maxProfit: 'Net credit received = $3.50',
    maxLoss: 'Spread width − credit = $6.50',
    breakeven: 'Short put strike − net credit = $96.50',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) => 3.5 - p(100)(s) + p(90)(s),
  },
  {
    id: 'cash-secured-put',
    name: 'Cash-Secured Put',
    category: 'bullish',
    description:
      'Sell a put while holding enough cash to buy the shares if assigned. Collect the premium upfront; if assigned, you acquire the stock at an effective discount to the strike.',
    whenToUse:
      'When you want to own a stock but only at a lower price — think of it as getting paid to wait for your buy price. Best in neutral-to-bullish, elevated-IV environments. Used extensively by value investors to build positions.',
    maxProfit: 'Premium received = $4',
    maxLoss: 'Strike − premium = $96 (stock → 0)',
    breakeven: 'Strike − premium = $96',
    spot: 100,
    chartRange: [70, 125],
    payoff: (s) => 4 - p(100)(s),
  },
  {
    id: 'collar',
    name: 'Collar',
    category: 'bullish',
    description:
      'Own 100 shares, buy a protective put below the market, and sell an OTM call above. The short call funds the put cost. Caps upside but floors downside — a "fence" around the stock.',
    whenToUse:
      'When you hold a large stock position and want to protect gains without selling (e.g., pre-earnings, concentrated position, approaching a lock-up expiry). Often used by insiders. The width between strikes defines your acceptable range.',
    maxProfit: 'Short call strike − entry − net debit = $4',
    maxLoss: 'Entry − long put strike + net debit = $6',
    breakeven: 'Entry + net debit = $101',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) => (s - 100) - 1 + p(95)(s) - c(105)(s),
  },
  {
    id: 'call-ratio-backspread',
    name: 'Call Ratio Backspread',
    category: 'bullish',
    description:
      'Sell 1 ATM call and buy 2 OTM calls. Net position: long 1 extra call with limited or zero cost. The trade profits from a big bullish move and has a small profit floor if the stock falls entirely.',
    whenToUse:
      'When strongly bullish and expecting a volatile upside move. You want unlimited upside but are willing to accept a zone of maximum loss if the stock only moves moderately (just above the short strike). Best in low-IV environments.',
    maxProfit: 'Unlimited (above upper breakeven)',
    maxLoss: 'Spread width + net debit = $12 (at short strike)',
    breakeven: 'Short strike − credit (lower) / Upper strike + max loss / width (upper)',
    spot: 100,
    chartRange: [70, 145],
    payoff: (s) => -c(100)(s) + 2 * c(110)(s) - 2,
  },

  // ══════════════════════════════════════════════════════════════
  // BEARISH
  // ══════════════════════════════════════════════════════════════
  {
    id: 'long-put',
    name: 'Long Put',
    category: 'bearish',
    description:
      'Buy a put option giving you the right to sell shares at the strike. Profit rises as the stock falls; maximum loss is the premium paid.',
    whenToUse:
      'When strongly bearish or hedging a portfolio. Best when IV is low (cheap premium). Common ahead of negative catalysts (earnings misses, FDA rejections, macro deterioration) or as portfolio insurance before a sell-off.',
    maxProfit: 'Strike − premium = $95 (stock → 0)',
    maxLoss: 'Premium paid = $5',
    breakeven: 'Strike − premium = $95',
    spot: 100,
    chartRange: [55, 140],
    payoff: (s) => p(100)(s) - 5,
  },
  {
    id: 'bear-put-spread',
    name: 'Bear Put Spread',
    category: 'bearish',
    description:
      'Buy a higher-strike put and sell a lower-strike put. The short put reduces cost but caps profit at the lower strike — a defined-risk bearish bet with a specific target.',
    whenToUse:
      'When moderately bearish with a defined downside target. Reduces the premium outlay versus a plain long put. Useful when IV is high and long puts are expensive — the short put offsets some cost.',
    maxProfit: 'Spread width − net debit = $6',
    maxLoss: 'Net debit paid = $4',
    breakeven: 'Long put strike − net debit = $96',
    spot: 100,
    chartRange: [75, 130],
    payoff: (s) => p(100)(s) - p(90)(s) - 4,
  },
  {
    id: 'bear-call-spread',
    name: 'Bear Call Spread',
    category: 'bearish',
    description:
      'Sell an OTM call and buy a higher-strike call for protection. Receive a net credit; profit if the stock stays below the short call strike at expiry.',
    whenToUse:
      'When mildly bearish or expecting the stock to stall below a resistance level. High-IV environments improve the credit. Defined risk protects against a gap-up. Often used as a hedge against short stock or long put positions.',
    maxProfit: 'Net credit received = $3.50',
    maxLoss: 'Spread width − net credit = $6.50',
    breakeven: 'Short call strike + net credit = $103.50',
    spot: 100,
    chartRange: [80, 135],
    payoff: (s) => 3.5 - c(100)(s) + c(110)(s),
  },
  {
    id: 'protective-put',
    name: 'Protective Put',
    category: 'bearish',
    description:
      'Own 100 shares and buy a put option as insurance. Losses below the put strike are capped while upside remains unlimited. Also called "portfolio insurance" or a "married put."',
    whenToUse:
      'When protecting a long equity position from a severe drawdown without selling shares — useful for tax reasons, lockup constraints, or when you want to keep upside intact. Acts like a stop-loss with no slippage risk.',
    maxProfit: 'Unlimited (stock keeps rising)',
    maxLoss: 'Entry − put strike + premium = $10',
    breakeven: 'Entry + premium = $105',
    spot: 100,
    chartRange: [60, 145],
    payoff: (s) => (s - 100) - 5 + p(95)(s),
  },
  {
    id: 'put-ratio-backspread',
    name: 'Put Ratio Backspread',
    category: 'bearish',
    description:
      'Sell 1 ATM put and buy 2 OTM puts. Net position: long 1 extra put, often entered at zero or small cost. Profits from a large downside move; limited loss if the stock rallies or only drops moderately.',
    whenToUse:
      'When strongly bearish and expecting a big downside move (e.g., ahead of a potential crash or large earnings miss). You want leveraged downside profit at low cost, accepting that a moderate decline hits your maximum loss zone.',
    maxProfit: 'Strike − 2× lower strike + net debit (large, stock → 0)',
    maxLoss: 'Spread width + net debit = $11 (at lower strike)',
    breakeven: 'Lower strike × 2 − upper strike (approx $79)',
    spot: 100,
    chartRange: [60, 130],
    payoff: (s) => -p(100)(s) + 2 * p(90)(s) - 1,
  },

  // ══════════════════════════════════════════════════════════════
  // NEUTRAL
  // ══════════════════════════════════════════════════════════════
  {
    id: 'short-straddle',
    name: 'Short Straddle',
    category: 'neutral',
    description:
      'Sell an ATM call and put at the same strike. Collect maximum premium; profit if the stock pins near the strike at expiry. Unlimited loss if the stock makes a large move either way.',
    whenToUse:
      'When IV is very high (premium is expensive) and you expect the stock to barely move. A classic earnings play when you believe the implied move overstates the actual move. Requires active management — set stop losses.',
    maxProfit: 'Total premium collected = $10',
    maxLoss: 'Unlimited',
    breakeven: 'Strike ± total premium  ($90 / $110)',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) => 10 - c(100)(s) - p(100)(s),
  },
  {
    id: 'short-strangle',
    name: 'Short Strangle',
    category: 'neutral',
    description:
      'Sell an OTM call and an OTM put at different strikes. More forgiving than a short straddle — the stock can move a moderate amount without losing money — but less total premium collected.',
    whenToUse:
      'When IV is elevated and you expect the stock to stay in a defined range between your strikes. The most popular strategy among professional premium sellers; widely used with weekly or monthly options.',
    maxProfit: 'Net credit received = $7',
    maxLoss: 'Unlimited',
    breakeven: 'Put strike − credit / Call strike + credit  ($85 / $115)',
    spot: 100,
    chartRange: [70, 130],
    payoff: (s) => 7 - c(108)(s) - p(92)(s),
  },
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    category: 'neutral',
    description:
      'Combine a bull put spread below the market and a bear call spread above. Collect a net credit; profit if the stock expires between the two inner (short) strikes.',
    whenToUse:
      'The bread-and-butter of premium selling. Use when IV rank is high and you expect a calm, range-bound market. Fully defined risk and reward — ideal for systematic, mechanical premium collection strategies.',
    maxProfit: 'Net credit received = $6',
    maxLoss: 'Spread width − net credit = $4',
    breakeven: 'Short put − credit / Short call + credit  ($89 / $111)',
    spot: 100,
    chartRange: [70, 135],
    payoff: (s) => 6 - p(95)(s) + p(85)(s) - c(105)(s) + c(115)(s),
  },
  {
    id: 'iron-butterfly',
    name: 'Iron Butterfly',
    category: 'neutral',
    description:
      'Sell an ATM straddle and buy OTM wings for protection. Like an iron condor but the inner strikes converge to the same point — collects more premium but needs a tighter pin at expiry.',
    whenToUse:
      'When you have a precise price target and expect the stock to settle very close to the short strike at expiry. Think of it as a defined-risk short straddle. Best when IV is rich.',
    maxProfit: 'Net credit received = $8',
    maxLoss: 'Wing width − net credit = $2',
    breakeven: 'Short strike ± net credit  ($92 / $108)',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) => 8 - c(100)(s) - p(100)(s) + c(110)(s) + p(90)(s),
  },
  {
    id: 'jade-lizard',
    name: 'Jade Lizard',
    category: 'neutral',
    description:
      'Sell an OTM put and sell an OTM call spread (bear call spread). The total credit collected exceeds the width of the call spread, eliminating all upside risk — you can\'t lose on the upside no matter how high the stock goes.',
    whenToUse:
      'When neutral-to-slightly bullish with high IV. The genius of the jade lizard: zero upside risk means you only need to worry about a downside move. Used when you want more premium than a strangle provides but with a capped upside exposure.',
    maxProfit: 'Net credit received = $4 (in the profit zone)',
    maxLoss: 'Short put strike − net credit = $91 (stock → 0)',
    breakeven: 'Short put strike − net credit = $91 (downside only)',
    spot: 100,
    chartRange: [70, 130],
    payoff: (s) => 4 - p(95)(s) - c(105)(s) + c(115)(s),
  },
  {
    id: 'broken-wing-butterfly',
    name: 'Broken Wing Butterfly',
    category: 'neutral',
    description:
      'A standard butterfly spread with one wing extended further than the other, creating a net credit entry. Profit zone is the same as a normal butterfly but the skewed wing eliminates upside risk entirely (for calls) while generating a credit.',
    whenToUse:
      'When you expect the stock to stay near or below the ATM short strikes. The net credit means you profit even if the stock rallies strongly. Used as an income strategy that also benefits from a precise pin.',
    maxProfit: 'Net credit + spread width = $12 (at short strike)',
    maxLoss: 'Capped loss above upper long strike = $3',
    breakeven: 'Lower long strike + net credit (lower) / Upper long + spread − credit (upper)',
    spot: 100,
    chartRange: [75, 130],
    payoff: (s) => c(90)(s) - 2 * c(100)(s) + c(115)(s) + 2,
  },
  {
    id: 'double-calendar',
    name: 'Double Calendar',
    category: 'neutral',
    description:
      'Sell near-term calls and puts at OTM strikes and buy the same strikes in a later expiry. Profit from rapid time decay of the near-term options while the long back-month options hold value. Profits in a range; loses on large moves.',
    whenToUse:
      'When you expect the stock to stay range-bound through near-term expiry but want exposure on both sides. Benefits from a rise in IV. Lower cost and wider breakevens compared to a double diagonal.',
    maxProfit: 'Difference in time value (at near strikes)',
    maxLoss: 'Net debit paid = $5',
    breakeven: 'Approximately short strikes ± a few points',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) => {
      const bell = 5 * Math.exp(-((s - 100) ** 2) / 250);
      return bell - 5;
    },
  },

  // ══════════════════════════════════════════════════════════════
  // VOLATILE
  // ══════════════════════════════════════════════════════════════
  {
    id: 'long-straddle',
    name: 'Long Straddle',
    category: 'volatile',
    description:
      'Buy an ATM call and put at the same strike. Profit from a large move in either direction. Time decay (theta) and IV crush are your main enemies.',
    whenToUse:
      'Before binary events — earnings, FDA decisions, FOMC — when you expect a large move but don\'t know the direction. Buy when IV is still low before it spikes into the event. Close before expiry to avoid rapid theta decay.',
    maxProfit: 'Unlimited',
    maxLoss: 'Total premium paid = $10',
    breakeven: 'Strike ± total premium  ($90 / $110)',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) => c(100)(s) + p(100)(s) - 10,
  },
  {
    id: 'long-strangle',
    name: 'Long Strangle',
    category: 'volatile',
    description:
      'Buy an OTM call and an OTM put at different strikes. Cheaper than a straddle but requires a larger move to reach breakeven. Good risk/reward when a very large move is expected.',
    whenToUse:
      'Similar to a straddle but used when you want to pay less premium and expect a very large move — major macro events, speculative biotech catalysts. The OTM strikes mean you need a bigger move but spend less to get there.',
    maxProfit: 'Unlimited',
    maxLoss: 'Total premium paid = $6',
    breakeven: 'Put strike − debit / Call strike + debit  ($86 / $114)',
    spot: 100,
    chartRange: [70, 135],
    payoff: (s) => c(108)(s) + p(92)(s) - 6,
  },
  {
    id: 'long-butterfly',
    name: 'Long Butterfly',
    category: 'volatile',
    description:
      'Buy a lower-strike call, sell two ATM calls, buy a higher-strike call — equidistant wings. Profits maximally if the stock pins exactly at the middle strike at expiry.',
    whenToUse:
      'When you have a precise price target and expect low volatility into expiry. Very cheap to enter; excellent reward-to-risk ratio if you\'re right about where the stock settles. A "price target trade."',
    maxProfit: 'Wing width − net debit = $8',
    maxLoss: 'Net debit paid = $2',
    breakeven: 'Lower + debit / Upper − debit  ($92 / $108)',
    spot: 100,
    chartRange: [80, 125],
    payoff: (s) => c(90)(s) - 2 * c(100)(s) + c(110)(s) - 2,
  },
  {
    id: 'calendar-spread',
    name: 'Calendar Spread',
    category: 'volatile',
    description:
      'Sell a near-term ATM option and buy the same strike in a later expiry. The near-term short decays faster than the long; rising IV benefits the long back-month option (positive vega).',
    whenToUse:
      'When IV is low and expected to rise, or when the stock is likely to stay near the strike through near-term expiry. A theta-positive trade that also benefits from a vega expansion (IV crush recovery).',
    maxProfit: 'Difference in time value (variable)',
    maxLoss: 'Net debit paid = $2',
    breakeven: 'Approximately strike ± a few points',
    spot: 100,
    chartRange: [80, 120],
    payoff: (s) => {
      const bell = 3.5 * Math.exp(-((s - 100) ** 2) / 150);
      return bell - 2;
    },
  },
  {
    id: 'strip',
    name: 'Strip',
    category: 'volatile',
    description:
      'Buy 1 call and 2 puts at the same ATM strike. A straddle with a bearish bias — double the downside exposure vs the single call. Profits from a large move in either direction but with more weight on a decline.',
    whenToUse:
      'When expecting a large move and leaning bearish. Common before earnings when downside beats are historically more severe than upside beats. Pays more than a straddle if the stock crashes, less on a rally.',
    maxProfit: 'Unlimited (large move either way; more on downside)',
    maxLoss: 'Total premium paid = $15',
    breakeven: 'Strike + premium (up) / Strike − premium/2 (down)  ($115 / $92.50)',
    spot: 100,
    chartRange: [70, 130],
    payoff: (s) => c(100)(s) + 2 * p(100)(s) - 15,
  },
  {
    id: 'strap',
    name: 'Strap',
    category: 'volatile',
    description:
      'Buy 2 calls and 1 put at the same ATM strike. A straddle with a bullish bias — double the upside exposure vs the single put. Profits from a large move in either direction but with more weight on a rally.',
    whenToUse:
      'When expecting a large move and leaning bullish. Common before earnings when you think a beat is likely but can\'t rule out a miss. Pays more than a straddle on a strong rally, less if the stock crashes.',
    maxProfit: 'Unlimited (large move either way; more on upside)',
    maxLoss: 'Total premium paid = $15',
    breakeven: 'Strike + premium/2 (up) / Strike − premium (down)  ($107.50 / $85)',
    spot: 100,
    chartRange: [70, 130],
    payoff: (s) => 2 * c(100)(s) + p(100)(s) - 15,
  },
  {
    id: 'reverse-iron-condor',
    name: 'Reverse Iron Condor',
    category: 'volatile',
    description:
      'Buy the inner strikes (bull put spread + bear call spread) and sell the outer strikes. The inverse of an iron condor — pay a net debit and profit from a large move in either direction out of the inner range.',
    whenToUse:
      'When expecting high volatility and a large move but with defined risk and cost. Cheaper than a straddle or strangle but caps maximum profit. Good when you expect a binary event but want to limit premium spent.',
    maxProfit: 'Spread width − net debit = $6 (either wing)',
    maxLoss: 'Net debit paid = $4 (stock stays between inner strikes)',
    breakeven: 'Inner strike ± net debit  ($91 / $109)',
    spot: 100,
    chartRange: [70, 135],
    payoff: (s) => p(95)(s) - p(85)(s) + c(105)(s) - c(115)(s) - 4,
  },
  {
    id: 'long-guts',
    name: 'Long Guts',
    category: 'volatile',
    description:
      'Buy a deep ITM call and a deep ITM put. Functionally identical to a long straddle in payoff shape, but entered with ITM options. The intrinsic value overlap means you "pay more" upfront but the effective risk is the same as a straddle.',
    whenToUse:
      'When you want straddle-like exposure but prefer trading ITM options for liquidity reasons. Used occasionally when a particular strike has wide ATM spreads and the ITM options are tighter. Educational value: demonstrates that ITM combos = ATM combos economically.',
    maxProfit: 'Unlimited (large move either way)',
    maxLoss: 'Total premium − intrinsic value = $4 (same as ATM straddle time value)',
    breakeven: 'Lower strike − time value / Upper strike + time value  ($86 / $114)',
    spot: 100,
    chartRange: [70, 135],
    payoff: (s) => c(90)(s) + p(110)(s) - 24,
  },

  // ══════════════════════════════════════════════════════════════
  // SYNTHETIC
  // ══════════════════════════════════════════════════════════════
  {
    id: 'synthetic-long-stock',
    name: 'Synthetic Long Stock',
    category: 'synthetic',
    description:
      'Buy a call and sell a put at the same strike and expiry. The combined payoff exactly replicates owning 100 shares — unlimited upside, unlimited downside — but with no capital tied up in the stock itself.',
    whenToUse:
      'When you want stock-equivalent exposure in a margin or futures account with less capital outlay. Also used in arbitrage (conversion/reversal). The put-call parity relationship guarantees this equivalence at fair pricing.',
    maxProfit: 'Unlimited (identical to long stock)',
    maxLoss: 'Unlimited (identical to long stock)',
    breakeven: 'Strike price = $100',
    spot: 100,
    chartRange: [60, 145],
    payoff: (s) => c(100)(s) - p(100)(s),
  },
  {
    id: 'synthetic-short-stock',
    name: 'Synthetic Short Stock',
    category: 'synthetic',
    description:
      'Sell a call and buy a put at the same strike and expiry. The combined payoff exactly replicates shorting 100 shares — unlimited upside risk, profit from a decline — but without borrowing shares.',
    whenToUse:
      'When you want short-stock exposure but can\'t borrow shares (hard-to-borrow names) or when margin requirements for synthetics are more favorable. Also the core of a reversal arbitrage when mispriced vs actual shares.',
    maxProfit: 'Strike price (stock → 0)',
    maxLoss: 'Unlimited (stock rallies)',
    breakeven: 'Strike price = $100',
    spot: 100,
    chartRange: [60, 145],
    payoff: (s) => p(100)(s) - c(100)(s),
  },
  {
    id: 'risk-reversal',
    name: 'Risk Reversal',
    category: 'synthetic',
    description:
      'Sell an OTM put and buy an OTM call at different strikes, typically for zero or small net cost. Creates a synthetic long that "kicks in" outside the two strikes, with a flat (no P&L) zone in between.',
    whenToUse:
      'When bullish but want to define a range of "I don\'t care" around the current price. Used extensively by commodity traders for zero-cost directional exposure. Also a key skew trade — you monetize expensive puts vs cheap calls.',
    maxProfit: 'Unlimited above long call strike',
    maxLoss: 'Unlimited below short put strike',
    breakeven: 'Long call strike (up) / Short put strike (down)',
    spot: 100,
    chartRange: [65, 140],
    payoff: (s) => c(110)(s) - p(90)(s),
  },
  {
    id: 'reverse-risk-reversal',
    name: 'Reverse Risk Reversal',
    category: 'synthetic',
    description:
      'Buy an OTM put and sell an OTM call. The mirror image of the risk reversal — creates a synthetic short exposure outside the strikes with a flat zone in the middle. Often zero-cost using volatility skew.',
    whenToUse:
      'When bearish or wanting downside protection cheaply by funding the put with a short call. Common as a portfolio hedge when you expect a broad market decline. The skew means OTM puts are rich relative to OTM calls, making this cheap or free.',
    maxProfit: 'Strike price to zero below short put level',
    maxLoss: 'Unlimited above long call strike',
    breakeven: 'Short call strike (up) / Long put strike (down)',
    spot: 100,
    chartRange: [65, 140],
    payoff: (s) => p(90)(s) - c(110)(s),
  },
  {
    id: 'conversion',
    name: 'Conversion',
    category: 'synthetic',
    description:
      'Long stock + long put + short call at the same strike. Creates a locked, riskless position — regardless of where the stock goes, the P&L is essentially flat (or a small locked profit). An arbitrage structure exploiting put-call parity violations.',
    whenToUse:
      'Pure arbitrage — used by market makers and prop traders when put-call parity is violated. If the synthetic short stock (short call + long put) is cheaper than the actual short stock proceeds, locking in the spread is riskless profit. The flat chart demonstrates put-call parity visually.',
    maxProfit: 'Small locked profit ≈ $0.50 (carry cost difference)',
    maxLoss: 'Essentially zero (locked position)',
    breakeven: 'N/A — position is delta-neutral and riskless',
    spot: 100,
    chartRange: [65, 135],
    payoff: (s) => (s - 100) + p(100)(s) - c(100)(s) + 0.5,
  },
  {
    id: 'box-spread',
    name: 'Box Spread',
    category: 'synthetic',
    description:
      'Combine a bull call spread and a bear put spread at the same two strikes. The combined payoff is always equal to the spread width — it replicates a zero-coupon bond. Used to borrow or lend at implied rates.',
    whenToUse:
      'Pure arbitrage / financing. If you can buy the box for less than its intrinsic value (the spread width discounted), you\'ve created a synthetic loan at below-market rates. Market makers use it to lock in riskless spread profits when mispricing occurs. The completely flat P&L chart illustrates that no directional risk exists.',
    maxProfit: 'Spread width − debit = $0.50 (always)',
    maxLoss: 'Essentially zero (locked to spread width)',
    breakeven: 'N/A — always worth spread width at expiry',
    spot: 100,
    chartRange: [75, 125],
    payoff: (s) =>
      c(95)(s) - c(105)(s) + p(105)(s) - p(95)(s) - 9.5,
  },

  // ══════════════════════════════════════════════════════════════
  // BEARISH — SINGLE LEG
  // ══════════════════════════════════════════════════════════════
  {
    id: 'naked-short-call',
    name: 'Naked Short Call',
    category: 'bearish',
    description:
      'Sell a call option without owning the underlying stock. You collect the premium upfront and keep it if the stock stays below the strike. Because there is no stock to deliver, your loss is theoretically unlimited if the stock surges.',
    whenToUse:
      'When strongly bearish or expecting the stock to stay flat, and you have a high-conviction view backed by margin capacity. Requires significant margin and active risk management. Often used by professional traders who hedge with delta-neutral adjustments rather than buying stock.',
    maxProfit: 'Premium received = $5',
    maxLoss: 'Unlimited (stock rallies)',
    breakeven: 'Strike + premium = $105',
    spot: 100,
    chartRange: [65, 140],
    payoff: (s) => 5 - c(100)(s),
  },

  // ══════════════════════════════════════════════════════════════
  // NEUTRAL — RATIO SPREADS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'call-front-ratio-spread',
    name: 'Call Front Ratio Spread',
    category: 'neutral',
    description:
      'Buy 1 ATM call and sell 2 OTM calls at a higher strike (1×2 ratio). You are net short gamma above the short strike. Maximum profit occurs at the short strike at expiry; unlimited loss if the stock rips significantly above it.',
    whenToUse:
      'When neutral-to-mildly-bullish and expecting the stock to drift up to, but not past, the short strike. Often entered for a net credit, giving you a profit floor if the stock stays flat or falls. Requires a close stop-loss if the stock breaks above the short strikes.',
    maxProfit: 'Spread width + net credit = $11 (at short strike)',
    maxLoss: 'Unlimited above upper breakeven',
    breakeven: 'Short strike + max profit / 1 (upper) ≈ $121 / floor on downside',
    spot: 100,
    chartRange: [75, 140],
    payoff: (s) => c(100)(s) - 2 * c(110)(s) + 1,
  },
  {
    id: 'put-front-ratio-spread',
    name: 'Put Front Ratio Spread',
    category: 'neutral',
    description:
      'Buy 1 ATM put and sell 2 OTM puts at a lower strike (1×2 ratio). Mirror image of the call front ratio. Maximum profit at the short strike; unlimited loss if the stock collapses far below the short puts.',
    whenToUse:
      'When neutral-to-mildly-bearish and expecting the stock to drift down to, but not past, the short strike. Best entered in high-IV environments for a net credit. Requires hard stops if the stock breaks below the short strikes — the naked short put tail is dangerous.',
    maxProfit: 'Spread width + net credit = $11 (at short strike)',
    maxLoss: 'Unlimited below lower breakeven',
    breakeven: 'Short strike − max profit (lower) ≈ $79 / floor on upside',
    spot: 100,
    chartRange: [60, 125],
    payoff: (s) => p(100)(s) - 2 * p(90)(s) + 1,
  },

  // ══════════════════════════════════════════════════════════════
  // NEUTRAL — FOUR-LEG
  // ══════════════════════════════════════════════════════════════
  {
    id: 'short-butterfly',
    name: 'Short Butterfly',
    category: 'volatile',
    description:
      'Sell a lower-strike call, buy two ATM calls, sell a higher-strike call. The inverse of the long butterfly — you collect net credit and profit if the stock makes a significant move in either direction away from the center.',
    whenToUse:
      'When expecting volatility to expand or the stock to move away from the center strike — essentially a low-cost way to be long volatility. Best used when IV is low (cheap to buy the body) and you have a binary event catalyst expected.',
    maxProfit: 'Net credit received = $2 (at either wing)',
    maxLoss: 'Wing width − net credit = $8 (at center strike)',
    breakeven: 'Center strike ± (wing width − credit)  ($92 / $108)',
    spot: 100,
    chartRange: [80, 120],
    payoff: (s) => -c(90)(s) + 2 * c(100)(s) - c(110)(s) + 2,
  },
  {
    id: 'long-call-condor',
    name: 'Long Call Condor',
    category: 'neutral',
    description:
      'Buy a lower-strike call, sell two inner calls at different strikes, buy a higher-strike call — four strikes total. Like a butterfly but with a wider flat profit zone between the two inner short strikes.',
    whenToUse:
      'When expecting the stock to remain between the two inner strikes at expiry, but you want a wider target zone than a butterfly. Lower maximum profit but higher probability of landing in the profit range. Useful when IV is rich enough to fund the outer wings cheaply.',
    maxProfit: 'Inner spread width − net debit = $2',
    maxLoss: 'Net debit paid = $3',
    breakeven: 'Lower inner strike − debit / Upper inner strike + debit  ($92 / $108)',
    spot: 100,
    chartRange: [78, 122],
    payoff: (s) => c(90)(s) - c(95)(s) - c(105)(s) + c(110)(s) - 3,
  },
  {
    id: 'short-guts',
    name: 'Short Guts',
    category: 'neutral',
    description:
      'Sell a deep ITM call and a deep ITM put. Economically equivalent to a short straddle but built with ITM options. Collects a large gross premium; the effective risk premium (time value) is the same as selling the ATM straddle.',
    whenToUse:
      'When you want short-straddle exposure but prefer the liquidity profile of ITM options, or when specific strikes offer better bid-ask dynamics than the ATM. The payoff and risk characteristics are identical to a short straddle at the equivalent intrinsic-adjusted level.',
    maxProfit: 'Collected time value = $4 (stock between strikes)',
    maxLoss: 'Unlimited (large move either direction)',
    breakeven: 'Lower strike − time value / Upper strike + time value  ($86 / $114)',
    spot: 100,
    chartRange: [65, 135],
    payoff: (s) => -c(90)(s) - p(110)(s) + 24,
  },

  // ══════════════════════════════════════════════════════════════
  // BULLISH — DIAGONAL / PMCC
  // ══════════════════════════════════════════════════════════════
  {
    id: 'diagonal-spread',
    name: 'Diagonal Spread',
    category: 'bullish',
    description:
      'Buy a longer-dated call at a lower strike and sell a shorter-dated call at a higher strike. Combines features of a calendar spread (different expiries) and a vertical spread (different strikes). Profit from near-term time decay and directional move.',
    whenToUse:
      'When moderately bullish and expecting a gradual move toward the short strike by near-term expiry. The long far-dated option is cheap relative to the near-term short. Allows you to "roll" the short call repeatedly, collecting premium each cycle.',
    maxProfit: 'Difference in time values (near upper strike)',
    maxLoss: 'Net debit paid = $5',
    breakeven: 'Approximately long strike + net debit',
    spot: 100,
    chartRange: [80, 125],
    payoff: (s) => {
      const shortLeg = c(105)(s);
      const longLeg = c(100)(s) + 2.5 * Math.exp(-((s - 100) ** 2) / 200);
      return longLeg - shortLeg - 5;
    },
  },
  {
    id: 'pmcc',
    name: 'Poor Man\'s Covered Call',
    category: 'bullish',
    description:
      'Buy a deep ITM long-dated LEAPS call and sell a near-term OTM call against it. Replicates a covered call at a fraction of the capital outlay — the LEAPS acts as a "poor man\'s stock" substitute.',
    whenToUse:
      'When you want covered-call income but don\'t want to (or can\'t afford to) buy 100 shares. The LEAPS has a high delta (0.80+) and mimics stock, while the short calls generate recurring premium. Roll the short call monthly. Works best in moderate-IV environments.',
    maxProfit: 'Short call strike − LEAPS strike − net debit = $10',
    maxLoss: 'Net debit paid = $20 (LEAPS goes to zero)',
    breakeven: 'LEAPS strike + net debit = $100',
    spot: 100,
    chartRange: [65, 130],
    payoff: (s) => c(80)(s) - c(110)(s) - 20,
  },

  // ══════════════════════════════════════════════════════════════
  // THREE-LEG STRATEGIES
  // ══════════════════════════════════════════════════════════════
  {
    id: 'bull-call-ladder',
    name: 'Bull Call Ladder',
    category: 'bullish',
    description:
      'Buy a lower-strike call, sell a middle-strike call, sell a higher-strike call. Like a bull call spread but with an extra short call above — extends the profit zone but creates unlimited loss if the stock rallies sharply above the top strike.',
    whenToUse:
      'When moderately bullish with a specific range target — you expect the stock to move to the middle strikes but not far beyond. The extra short call brings in more credit, lowering the entry cost, but you must manage the uncapped upside risk.',
    maxProfit: 'Difference in strikes − net debit ≈ $5 (between inner strikes)',
    maxLoss: 'Unlimited above upper short strike',
    breakeven: 'Lower strike + net debit (lower) / Upper breakeven ≈ $113',
    spot: 100,
    chartRange: [78, 130],
    payoff: (s) => c(95)(s) - c(100)(s) - c(107)(s) + 0.5,
  },
  {
    id: 'bear-put-ladder',
    name: 'Bear Put Ladder',
    category: 'bearish',
    description:
      'Buy a higher-strike put, sell a middle-strike put, sell a lower-strike put. Mirror image of the bull call ladder. Extended profit zone to the downside, but unlimited loss if the stock crashes far below the bottom strike.',
    whenToUse:
      'When moderately bearish with a specific downside target range. The extra short put reduces cost but adds unlimited downside risk below the lowest strike. Requires a stop-loss plan if the stock collapses past the bottom short put.',
    maxProfit: 'Difference in strikes − net debit ≈ $5 (between inner strikes)',
    maxLoss: 'Unlimited below lower short strike',
    breakeven: 'Upper strike − net debit (upper) / Lower breakeven ≈ $87',
    spot: 100,
    chartRange: [70, 122],
    payoff: (s) => p(105)(s) - p(100)(s) - p(93)(s) + 0.5,
  },
  {
    id: 'seagull',
    name: 'Seagull',
    category: 'bullish',
    description:
      'Buy a call spread (buy lower call, sell upper call) and sell an OTM put below the market — typically structured for zero net cost. The sold put funds the call spread; profit if the stock rises, limited loss if it falls below the put strike.',
    whenToUse:
      'When bullish but want to participate in upside at zero cost — the put premium finances the call spread. Common in FX and commodity options. Accepts downside risk below the short put in exchange for free upside participation. Best in skewed markets where OTM puts are richly priced.',
    maxProfit: 'Call spread width = $10 (above upper call strike)',
    maxLoss: 'Unlimited below short put strike (stock → 0)',
    breakeven: 'Long call strike (up) / Short put strike (down)  ($100 / $90)',
    spot: 100,
    chartRange: [65, 130],
    payoff: (s) => c(100)(s) - c(110)(s) - p(90)(s),
  },

  // ══════════════════════════════════════════════════════════════
  // SYNTHETIC — PUT-CALL PARITY COMPLEMENTS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'synthetic-long-call',
    name: 'Synthetic Long Call',
    category: 'synthetic',
    description:
      'Long stock + long put at the same strike. By put-call parity this position has the same payoff as owning a call: unlimited upside, loss capped at the put premium. Also known as a "married put" or "protective put" viewed through a synthetic lens.',
    whenToUse:
      'Demonstrates put-call parity: long stock + long put = long call. Used when the call is overpriced relative to the put + stock combination, allowing arbitrage. Also practical when you own stock and want to synthetically convert your position into a defined-risk call equivalent.',
    maxProfit: 'Unlimited (identical to long call)',
    maxLoss: 'Put premium = $5 (floor: entry − strike + premium)',
    breakeven: 'Stock entry + premium = $105',
    spot: 100,
    chartRange: [60, 140],
    payoff: (s) => (s - 100) + p(100)(s) - 5,
  },
  {
    id: 'synthetic-short-put',
    name: 'Synthetic Short Put',
    category: 'synthetic',
    description:
      'Long stock + short call at the same strike. By put-call parity this position has the same payoff as selling a put: capped upside at the premium collected, unlimited downside below breakeven. The same risk profile as a covered call.',
    whenToUse:
      'Demonstrates that a covered call and a short put are economically identical. Useful for arbitrage when a short put is offered at better terms than buying stock + selling call. Also helps traders understand why covered calls don\'t reduce downside risk.',
    maxProfit: 'Premium received = $5 (capped above strike)',
    maxLoss: 'Entry − premium (stock falls to zero)',
    breakeven: 'Entry − premium = $95',
    spot: 100,
    chartRange: [60, 140],
    payoff: (s) => (s - 100) + 5 - c(100)(s),
  },
  {
    id: 'synthetic-long-put',
    name: 'Synthetic Long Put',
    category: 'synthetic',
    description:
      'Short stock + long call at the same strike. By put-call parity this replicates owning a put: profits from a decline, loss capped at the call premium if the stock rallies. Avoids having to borrow shares while achieving identical downside exposure.',
    whenToUse:
      'When you want put-like bearish exposure but can\'t buy puts directly (unavailable, overpriced, or tax reasons). Also used in arbitrage when a put is mispriced relative to the short stock + call combination. Demonstrates that short stock + long call = long put.',
    maxProfit: 'Strike − call premium (stock → 0) = $95',
    maxLoss: 'Call premium = $5 (stock rallies above strike)',
    breakeven: 'Strike − call premium = $95',
    spot: 100,
    chartRange: [60, 140],
    payoff: (s) => -(s - 100) - 5 + c(100)(s),
  },
];
