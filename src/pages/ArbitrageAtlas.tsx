import { useState, useMemo } from 'react';

// ── Category accent palette (hue-only – works on any bg) ──────────────────

const CAT_COLORS: Record<string, { accent: string; bg: string }> = {
  'Pure Arbitrage':      { accent: '#00D4B4', bg: 'rgba(0,212,180,0.10)'   },
  'Quasi-Arbitrage':     { accent: '#34D399', bg: 'rgba(52,211,153,0.10)'   },
  'Event-Driven':        { accent: '#60A5FA', bg: 'rgba(96,165,250,0.10)'   },
  'Volatility Arb':      { accent: '#A78BFA', bg: 'rgba(167,139,250,0.10)'  },
  'Capital Structure':   { accent: '#F472B6', bg: 'rgba(244,114,182,0.10)'  },
  'Statistical / Pairs': { accent: '#FB923C', bg: 'rgba(251,146,60,0.10)'   },
  'Yield / Carry':       { accent: '#FBBF24', bg: 'rgba(251,191,36,0.10)'   },
};

// ── Strategy data ─────────────────────────────────────────────────────────

interface Strategy {
  id: number;
  name: string;
  cat: string;
  instruments: string[];
  regime: string[];
  risk: number;
  capital: string;
  ret: string;
  zeroLoss: boolean;
  summary: string;
  how: string;
  impl: string;
  risks: string;
  edge: string;
}

const STRATS: Strategy[] = [
  // ── PURE ARBITRAGE ───────────────────────────────────────────────────────
  {
    id:1, name:'Box Spread', cat:'Pure Arbitrage',
    instruments:['Options (SPX/XSP)'], regime:['Any'],
    risk:1, capital:'$200K–$500K', ret:'Rf + 0.1–0.5% α', zeroLoss:true,
    summary:'Buy bull call spread + bear put spread (same strikes/expiry). Payoff at expiry = spread width, guaranteed. Purchase below PV(width) = locked profit.',
    how:'Long C(A) + Short C(B) + Long P(B) + Short P(A). Today\'s cost < (B−A)×e^(−rT) = locked alpha. Use SPX/XSP (European-style) to eliminate early-assignment risk.',
    impl:'$200–500K in SPX boxes. Post-2023 boxes frequently priced 5.2–5.5% vs T-bills at ~5%. Zero execution risk if filled simultaneously. Best cash-management alternative to T-bills.',
    risks:'Bid/ask slippage eating the spread. Margin requirements on legs. Pin risk at expiry. Simultaneous fill required.',
    edge:'Exploits any mispricing between the options market and the risk-free rate. No directional or volatility assumption needed.',
  },
  {
    id:2, name:'Put-Call Parity Violation', cat:'Pure Arbitrage',
    instruments:['Options','Stock'], regime:['Any'],
    risk:1, capital:'$50K–$200K', ret:'Locked spread on violation', zeroLoss:true,
    summary:'C − P = S − PV(K) − PV(Div). When violated, buy the cheap combination and sell the expensive one for a guaranteed profit.',
    how:'If call is cheap: buy call, sell put, short stock, invest K at Rf. All cash flows net to positive at expiry. Opposite when put is cheap.',
    impl:'Requires real-time options scanner on IBKR TWS. Most viable in single stocks with liquid options and high dividends. Sub-0.5% opportunities but near-zero risk.',
    risks:'American-style early exercise complicates strategy (use European options only). Short stock borrow cost. 4-leg simultaneous execution required.',
    edge:'No-arbitrage identity. Any violation is free money — hence fleeting. Monitor around dividend dates and index rebalances.',
  },
  {
    id:3, name:'Cash-and-Carry (Futures Basis)', cat:'Pure Arbitrage',
    instruments:['Index ETF','Futures (ES/NQ)'], regime:['Any'],
    risk:1, capital:'$200K–$500K', ret:'Excess basis above Rf, locked', zeroLoss:true,
    summary:'Buy underlying, short overpriced futures. Futures fair value = Spot × (1+r)^T − PV(Div). If futures > fair value, lock in risk-free profit.',
    how:'Long SPY/SXR8, short equivalent ES futures. Hold to expiry. Profit = actual futures price − fair value. Convergence at expiry is guaranteed.',
    impl:'On $300K: requires margin account. ES futures are T+1 margin; SPY is T+2 settle — manage the gap. Institutional-scale version runs in microseconds; retail finds opportunities in sector ETF futures.',
    risks:'Dividend surprise. Interim margin calls on futures. Financing rate changes. Basis can widen before converging.',
    edge:'Deterministic payoff if held to expiry. Best when futures carry speculative premium above fair value.',
  },
  {
    id:4, name:'Reverse Cash-and-Carry', cat:'Pure Arbitrage',
    instruments:['Stock (Short)','Futures (Long)'], regime:['Any'],
    risk:2, capital:'$100K–$300K', ret:'Discount capture when futures below FV', zeroLoss:false,
    summary:'When futures trade below fair value: short underlying, long cheap futures. Capture the discount at expiry.',
    how:'Short stock at spot S, buy futures at F < FV. At expiry, futures deliver shares. Profit = FV − F, minus borrow cost.',
    impl:'Most viable in ETFs with cheap borrow. Single stocks have high/unpredictable borrow costs. $100K net exposure. Keep position under 5% of open interest.',
    risks:'Hard-to-borrow stock costs. Short squeeze risk. Dividend payment obligation on short leg. Futures margin calls.',
    edge:'Mirror of cash-and-carry. Backwardation in dividend payers or ETFs undergoing heavy short interest creates the opportunity.',
  },
  {
    id:5, name:'ETF / CEF NAV Discount Arb', cat:'Pure Arbitrage',
    instruments:['CEF','ETF (Hedge)'], regime:['Any'],
    risk:2, capital:'$100K–$300K', ret:'3–15% discount convergence', zeroLoss:false,
    summary:'Buy closed-end fund (CEF) at steep discount to NAV; short nearest-matching ETF as hedge. Profit when discount narrows or fund converts.',
    how:'CEF trades at $88 vs $100 NAV (12% discount). Buy CEF, short ETF equivalent. If discount narrows to 5%, capture ~7% net of hedge costs.',
    impl:'Screen for CEFs at >8% discount with activist history or pending liquidation. Bond CEFs (PDI, PTY), equity CEFs. $100K per position, 2–3 concurrent.',
    risks:'Discount can widen further (no catalyst = no convergence). Basis risk between CEF holdings and ETF hedge. Illiquid CEF bid/ask.',
    edge:'CEF structure prevents ETF-style arbitrage redemption. Discounts are structural — but shareholder activism and fund conversions are reliable catalysts.',
  },

  // ── QUASI-ARBITRAGE ──────────────────────────────────────────────────────
  {
    id:6, name:'SPAC Trust Arbitrage', cat:'Quasi-Arbitrage',
    instruments:['SPAC Shares','Warrants'], regime:['Any'],
    risk:1, capital:'$100K–$300K', ret:'T-bill + 0.5–2% + free warrants', zeroLoss:true,
    summary:'Buy SPAC units at/below NAV ($10 + accrued interest). If deal is bad, redeem at NAV. Warrants = free optionality on deal upside. Downside is floored.',
    how:'Trust holds cash (≈$10.x/share). Buy at $9.90 = guaranteed ≥$0.10 gain on redemption + warrant lottery. Buy at $10.00 = T-bill yield with free warrants.',
    impl:'Diversify across 10–20 SPACs at/below NAV. Total $200K. Redeem any bad deals. Hold warrants for deals with genuine quality. Best when rates are high (trust yield matters).',
    risks:'Trust yield below market rates. Illiquid SPAC market. Sponsor dilution post-deal. Complex multi-step redemption process.',
    edge:'Asymmetric payoff. Downside floored at trust NAV, upside unlimited if deal is transformative. No macro dependence on the downside protection.',
  },
  {
    id:7, name:'Tender Offer Arbitrage', cat:'Quasi-Arbitrage',
    instruments:['Stock (Target)'], regime:['Any'],
    risk:2, capital:'$50K–$150K per deal', ret:'1–5% per deal (15–40% annualized)', zeroLoss:false,
    summary:'After a tender offer announcement, buy target stock at discount to tender price. Capture the spread at deal close in 30–90 days.',
    how:'Company announces $50 tender for stock at $48. Buy at $48, tender at $50. $2 profit in 45 days = ~16% annualized.',
    impl:'Run 3–5 concurrent tenders. $75K each. Monitor deal conditions daily. Avoid cross-border tenders with regulatory uncertainty. IBKR has tender offer participation automation.',
    risks:'Deal withdrawn or price cut. Proration in partial tenders. Conditions not met. Material adverse change clause.',
    edge:'High probability, defined timeline, known exit price. Expected value positive when diversified across multiple independent deals.',
  },
  {
    id:8, name:'Rights Offering Arbitrage', cat:'Quasi-Arbitrage',
    instruments:['Stock','Rights'], regime:['Any'],
    risk:2, capital:'$50K–$150K', ret:'1–5% on mispricing vs theoretical', zeroLoss:false,
    summary:'When a company issues rights to subscribe at a discount, trade the mispricing between actual rights price and theoretical value (stock price − exercise price).',
    how:'Stock at $50, rights exercise price $40 → theoretical right value = $10. Rights trading at $8? Buy rights, exercise/sell for $10+ profit.',
    impl:'Monitor IBKR corporate action announcements. Rights mispricing is short-lived — act within hours. $50K per opportunity. Also: hold stock through rights offering and sell rights if overpriced.',
    risks:'Dilution effect on stock price. Exercise capital required on short notice. Rights expire worthless if not acted on.',
    edge:'Retail investors frequently misprice rights (sell too cheap, or let them expire). Informational and action speed advantage.',
  },
  {
    id:9, name:'Dividend Capture + Put Protection', cat:'Quasi-Arbitrage',
    instruments:['Dividend Stock','Put Options'], regime:['Bull','Sideways'],
    risk:2, capital:'$100K–$200K', ret:'Net dividend above put cost, per cycle', zeroLoss:false,
    summary:'Buy dividend stock before ex-date + buy protective put for same period. If put cost < dividend, net gain is locked regardless of stock direction.',
    how:'Stock $100, dividend $3. Buy stock + ATM put for $2.50. Stock drops $3 on ex-date. Put gains ~$3. Net: +$3 div − $2.50 put = +$0.50 locked.',
    impl:'Target high-yield stocks (REITs, MLPs, covered call ETFs) with liquid put options. Scan for put/dividend mispricing. Run 4–6 cycles/year per name. $100K.',
    risks:'Puts are often priced near dividend amount (no free lunch). Tax treatment: short-term div if holding period < 61 days. Execution timing risk.',
    edge:'Real when implied vol is suppressed (puts cheap) and dividend is large. Works best on high-yield REITs with deep, liquid options.',
  },

  // ── EVENT-DRIVEN ─────────────────────────────────────────────────────────
  {
    id:10, name:'Merger Arb – Cash Deal', cat:'Event-Driven',
    instruments:['Target Stock'], regime:['Any'],
    risk:2, capital:'$50K–$150K per deal', ret:'2–8% per deal (15–40% ann.)', zeroLoss:false,
    summary:'After all-cash acquisition announcement, buy target at discount to deal price. Capture remaining spread at close in 30–180 days.',
    how:'Acquirer bids $80 cash. Target at $77. Buy at $77, receive $80 at close = 3.9% in ~90 days (~16% annualized).',
    impl:'Run 5–8 concurrent deals. $75–100K each. Expected deal-break rate ~5–10%; spread compensates. Focus on strategic (not financial) acquirers — lower break risk.',
    risks:'Deal break sends stock back 20–40%. Regulatory block. Competing bid (positive). Financing failure in leveraged buyouts.',
    edge:'Compensation for deal-break risk premium. Consistent, diversifiable source of return. Works in any macro regime.',
  },
  {
    id:11, name:'Merger Arb – Stock Deal (Long/Short)', cat:'Event-Driven',
    instruments:['Target (Long)','Acquirer (Short)'], regime:['Any'],
    risk:3, capital:'$100K–$200K per deal', ret:'2–6% on exchange ratio spread', zeroLoss:false,
    summary:'In stock-for-stock mergers, buy target and short acquirer at announced exchange ratio. Lock in the current valuation gap.',
    how:'Acquirer offers 0.5 shares per target share. Acquirer at $100, target at $48. Buy target, short 0.5× acquirer. Locked $2 profit per target share.',
    impl:'$100K in target + short equivalent in acquirer. Net market exposure ≈ 0. Monitor exchange ratio and hedge ratio daily. 2–3 concurrent deals max.',
    risks:'Deal break unwinds both legs (usually painful: target −30%, acquirer +10% = double loss). Exchange ratio renegotiation. Acquirer move shifts net exposure.',
    edge:'Market-neutral return. Captures deal premium while hedging macro via the short acquirer leg.',
  },
  {
    id:12, name:'Spinoff Arbitrage', cat:'Event-Driven',
    instruments:['Parent Stock','Spinco Shares'], regime:['Any'],
    risk:2, capital:'$100K–$200K', ret:'5–20% over 6–18 months', zeroLoss:false,
    summary:'Buy parent before spinoff record date. Receive spinco shares. Exploit forced selling by passive/index funds that can\'t hold the new entity.',
    how:'Spinco distributed at $15 implied but trades down to $11 on day-1 forced selling. Hold spinco, sell parent. Gap typically closes in 6–18 months.',
    impl:'$100K in parent ahead of record date. After spin, evaluate which piece is stronger. Spinoffs historically outperform market in years 1–3 (Joel Greenblatt research).',
    risks:'Spinco continues underperforming. Parent declines post-split. Timing of forced-sell pressure uncertain.',
    edge:'Structural: many passive/institutional holders must sell non-index spinco shares immediately, creating a temporary mispriced entry point.',
  },
  {
    id:13, name:'Index Reconstitution Front-Run', cat:'Event-Driven',
    instruments:['Stock (Add/Remove)'], regime:['Any'],
    risk:3, capital:'$50K–$150K', ret:'2–10% around effective date', zeroLoss:false,
    summary:'Front-run forced buying/selling by $10T+ of passive index funds at S&P 500 reconstitution events. Buy adds before effective date; short removes.',
    how:'S&P announces new addition. $300B+ of passive AUM must buy on effective date. Stock rises 3–8% from announcement to effective. Buy announcement day, sell effective day.',
    impl:'Monitor S&P index methodology committee announcements. Also valid for Russell 2000 (annual June rebalance). $50–100K per event. Sell into the forced buying.',
    risks:'Price run-up already fully priced at announcement (arb capital competes). Post-effective reversal. Shrinking edge over time.',
    edge:'Forced, price-insensitive buyers and sellers at known dates. Real but shrinking as more capital chases it.',
  },
  {
    id:14, name:'Bankruptcy / Distressed Claims Arb', cat:'Event-Driven',
    instruments:['Distressed Bonds','Equity'], regime:['Bear','High Volatility'],
    risk:4, capital:'$50K–$100K', ret:'20–100%+ if recovery thesis correct', zeroLoss:false,
    summary:'Buy distressed bonds at discount to estimated recovery value. Or buy equity with embedded optionality when reorganization may leave it in-the-money.',
    how:'Company in Ch.11 with $500M senior secured debt trading at 40¢. Analysis suggests 70¢ recovery → 75% return if thesis holds.',
    impl:'Small allocation ($50K). Focus on senior secured debt — cleaner recovery math. Avoid equity in distressed situations (often zero). Use IBKR bond desk for access.',
    risks:'Recovery lower than expected. Legal delays. Liquidation value wrong. DIP financing priority can impair existing debt holders.',
    edge:'Complexity premium + illiquidity premium. Most capital avoids distressed. Your forensic balance sheet skills are directly applicable.',
  },

  // ── VOLATILITY ARBITRAGE ─────────────────────────────────────────────────
  {
    id:15, name:'Volatility Risk Premium (VRP) Capture', cat:'Volatility Arb',
    instruments:['Short Options (SPX Strangles)'], regime:['Sideways','Bull','Low Vol'],
    risk:3, capital:'$200K–$400K', ret:'10–25% annualized, negative skew', zeroLoss:false,
    summary:'Systematically sell index options to capture the persistent spread where implied vol (VIX ~19%) > realized vol (~15%). Edge exists ~75–80% of the time.',
    how:'Sell 30–45 DTE SPX strangles at 1–2σ OTM. Collect IV premium. Close at 50% profit. Roll monthly. Profit = IV − RV × Vega exposure.',
    impl:'$250K in SPX/XSP options. Size at 5% max risk/trade. Target 1.5–2.5% monthly premium. Fits your ORATS backtesting work. Use IBKR TWS for mechanical execution.',
    risks:'Tail events (2020: −35%, 2022: −25%) create outsized drawdowns. Short gamma in crises. Negative P&L skew — steady gains interrupted by large losses.',
    edge:'Structural: implied vol includes a risk premium above expected realized vol. 25+ years of SPX options data confirm consistent positive carry.',
  },
  {
    id:16, name:'Dispersion Trading', cat:'Volatility Arb',
    instruments:['Index Options (Short)','Single Stock Options (Long)'], regime:['Bull','Low Vol'],
    risk:3, capital:'$150K–$300K', ret:'15–25% ann. when correlations fall', zeroLoss:false,
    summary:'Short index variance (sell SPX straddle), long variance on top components (buy stock straddles). Profit from correlation risk premium when stocks diverge.',
    how:'Sell SPX straddle ($A premium). Buy vega-weighted straddles on top 10 SPX components. Correlation risk premium: SPX IV embeds an over-priced correlation assumption you collect.',
    impl:'Simplified: sell 1× SPX ATM straddle, buy NVDA/AAPL/AMZN straddles at net vega-neutral weighting. $150K. Best in post-earnings windows when dispersion spikes.',
    risks:'Correlation spike (crisis/flight-to-quality) kills both legs simultaneously. Complex dynamic hedging. Expensive retail transaction costs.',
    edge:'Correlation risk premium is structural. Index vol is systematically overstated vs component vol in normal regimes (well-documented academic literature).',
  },
  {
    id:17, name:'Calendar Spread (IV Term Structure Arb)', cat:'Volatility Arb',
    instruments:['Near-term Short Option','Far-term Long Option'], regime:['High Vol','Pre-Event'],
    risk:2, capital:'$50K–$100K', ret:'3–10% per setup', zeroLoss:false,
    summary:'Sell elevated near-term IV (pre-earnings), buy cheaper longer-dated IV. Profit from term-structure normalization as event-vol collapses.',
    how:'Stock has earnings next week. Front-week IV = 80%, 60-day IV = 35%. Sell 1-week straddle, buy 60-day straddle at same strike. Post-earnings: near IV collapses, far IV steady.',
    impl:'Run on liquid earnings names (NVDA, AAPL, GOOGL, MRVL) into each earnings cycle. Sell 1-week straddle, buy 30–45 DTE straddle as far-leg. $50–100K. Target 3–5% net premium.',
    risks:'Massive gap move wipes theta gains. Far-leg IV also collapses post-event. Requires delta management throughout.',
    edge:'Near-term IV is structurally overstated around events (fear premium). Mean-reverts faster than long-term vol. Sell-the-event is statistically robust.',
  },
  {
    id:18, name:'Gamma Scalping (Long Realized Vol)', cat:'Volatility Arb',
    instruments:['Long Options (Straddle)','Stock (Delta Hedge)'], regime:['High Vol','Trending'],
    risk:2, capital:'$50K–$100K', ret:'Positive when RV > IV; theta cost otherwise', zeroLoss:false,
    summary:'Buy ATM straddle, continuously delta-hedge. Gamma P&L accumulates as: ½ × Γ × (ΔS² − σ²_IV × S² × Δt). Profit when realized vol exceeds implied vol.',
    how:'Buy $5K NVDA straddle. Delta-hedge every $2 move. Each rebalance captures realized variance. Cost = theta decay. Win when actual daily moves > implied.',
    impl:'Use post-catalyst or high-uncertainty periods. Target RV/IV entry ratio >1.1×. NVDA, MRVL around earnings. $50–100K. Track daily realized vol vs IV daily.',
    risks:'Realized vol comes in below implied vol (common in calm markets). Theta decay destroys position in quiet markets. Transaction costs eat gamma gains.',
    edge:'Explicit bet on market underestimating future moves. Opposite of VRP capture. Run alongside VRP strategies to identify regime shifts.',
  },
  {
    id:19, name:'VIX Futures Contango Roll', cat:'Volatility Arb',
    instruments:['VIX Futures','SVXY (Short VIX ETF)'], regime:['Bull','Low Vol','Sideways'],
    risk:4, capital:'$25K–$50K (max!)', ret:'20–40% ann. in calm; −80%+ in spikes', zeroLoss:false,
    summary:'VIX futures almost always in contango (futures > spot VIX). Short front-month VIX futures. Capture negative roll yield as futures decay toward spot over 30 days.',
    how:'VIX spot = 15, M1 futures = 18. Short M1 at 18. Expires at spot ~15 = $3 profit per unit. Collect this monthly roll yield via SVXY or direct VIX futures.',
    impl:'CRITICAL: max $25–50K (2.5–5% of portfolio). Treat as yield enhancement only. Hard stop at −30%. Reduce when VIX < 13 (extreme complacency). Never size up during extended calm.',
    risks:'VIX spikes 100%+ in crashes (Feb 2018, March 2020 = catastrophic). Short VIX = short crash insurance. Existential risk if oversized.',
    edge:'Structural: VIX ETP buyers pay for fear protection, generating a negative roll yield collected by the short side.',
  },
  {
    id:20, name:'Volatility Surface Butterfly Arb', cat:'Volatility Arb',
    instruments:['Options (Multi-Strike Butterfly)'], regime:['Any'],
    risk:1, capital:'$50K–$150K', ret:'Small locked profit on violations', zeroLoss:true,
    summary:'Butterfly spreads must cost ≥ 0 (no-arb condition). If market prices a butterfly negatively — you receive premium with a guaranteed non-negative payoff at expiry.',
    how:'Buy 90P + buy 110P + sell 2× 100P. Cost must be ≥ 0. If market prices it at −$0.50 (you receive $0.50), that\'s free money with a guaranteed non-negative payoff.',
    impl:'Requires real-time options surface scanner. Violations are milliseconds-to-seconds long. IBKR options scanner can flag convexity violations. $50K when found. More academic than practical at retail.',
    risks:'Virtually zero if executed simultaneously. Slippage on 3-leg entry destroys edge. Extremely rare in liquid markets.',
    edge:'True no-arbitrage condition. Violations are fleeting and mainly exploited by HFT. Any violation equals guaranteed free payoff.',
  },

  // ── CAPITAL STRUCTURE ────────────────────────────────────────────────────
  {
    id:21, name:'Convertible Bond Arbitrage', cat:'Capital Structure',
    instruments:['Convertible Bond (Long)','Stock (Short, Delta-hedged)'], regime:['Any','High Vol'],
    risk:3, capital:'$100K–$200K', ret:'8–15% annualized (theoretical)', zeroLoss:false,
    summary:'Buy convertible bond, short delta of underlying equity. Extract cheap embedded optionality + credit carry + gamma. Delta-hedge dynamically.',
    how:'Convert bond: $100 face, 5% coupon, converts at $50. Stock at $40 → delta ≈ 0.4. Short 0.4× shares per bond. Earn: 5% coupon + vol expansion (long gamma) + credit carry.',
    impl:'Access via IBKR bond desk. Focus on investment-grade converts with meaningful embedded gamma. $100–150K. Requires daily delta rehedging. Most practical in high-IV regimes.',
    risks:'Credit deterioration (bond and stock both fall). Liquidity crunch (converts were brutal in 2008/2020). Hard to short small-cap stocks. Hedge ratio drift.',
    edge:'Embedded optionality in convertibles is historically underpriced vs equivalent standard options. Issuer pays for conversion via below-market coupon.',
  },
  {
    id:22, name:'Capital Structure Arb (CDS vs Equity Vol)', cat:'Capital Structure',
    instruments:['Put Options','CDS (proxy via HY ETF)'], regime:['High Vol','Bear'],
    risk:4, capital:'$50K–$100K', ret:'15–30% when thesis realizes', zeroLoss:false,
    summary:'When CDS-implied default probability diverges from equity put-implied default probability, trade the mispricing across the capital structure.',
    how:'CDS on XYZ implies 15% 1-year default probability. ATM puts imply only 5%. Puts are cheap on default-adjusted basis → buy OTM puts + hedge equity beta via short underlying.',
    impl:'Simplified retail version: buy deep OTM puts when HYG/credit spreads diverge from equity vol. $50K. Full CDS access requires institutional ISDA agreement.',
    risks:'Divergence can persist for extended periods. Credit and equity markets can both be wrong simultaneously. CDS basis adds complexity.',
    edge:'Credit and equity investor bases have different risk preferences and horizons. Structural mispricing across capital layers is well-documented in academic finance.',
  },
  {
    id:23, name:'Senior vs Junior Debt vs Equity Arb', cat:'Capital Structure',
    instruments:['Senior Bonds (Long)','Equity (Short)'], regime:['High Vol','Bear'],
    risk:3, capital:'$50K–$150K', ret:'10–20% when capital structure rights realized', zeroLoss:false,
    summary:'When relative pricing of senior debt, junior debt, and equity implies inconsistent recovery scenarios — long the mispriced layer, short the overpriced one.',
    how:'Senior bonds at 85¢ imply 90% recovery. Yet equity market cap = $2B (implies healthy company). Go long senior bonds, short equity. If stress occurs, bonds protected; equity impaired.',
    impl:'Focus on B/BB-rated high-yield issuers with complex structures. Corporate bonds accessible via IBKR. $100K. Pair with short equity to hedge market exposure.',
    risks:'Courts and creditor groups unpredictable in bankruptcy. Seniority doesn\'t always prevail (DIP financing). Illiquid bond market. Long time horizon (12–36 months).',
    edge:'Different pricing mechanisms and investor bases across debt and equity layers create persistent mispricing in stressed companies.',
  },

  // ── STATISTICAL / PAIRS ──────────────────────────────────────────────────
  {
    id:24, name:'Classic Pairs Trading', cat:'Statistical / Pairs',
    instruments:['Stock A (Long)','Stock B (Short)'], regime:['Sideways','Any'],
    risk:3, capital:'$150K–$300K', ret:'10–20% ann. when mean-reversion holds', zeroLoss:false,
    summary:'Identify co-integrated stocks. When spread > 2σ from mean, long cheap / short expensive. Exit at mean. Market-neutral, regime-independent.',
    how:'NVDA/AMD: compute spread Z-score on 60-day rolling window. Z > +2.5 → short NVDA, long AMD. Z → 0 → close. P&L = spread move × position size.',
    impl:'Top sector pairs: NVDA/AMD, JPM/BAC, MSFT/GOOGL, FCX/SCCO (copper!), FRO/INSW (tankers). $75K each side ($150K gross). Z-score entry/exit. Automate via IBKR API.',
    risks:'Cointegration breaks permanently (regime change). Short squeeze on short leg. Beta estimation error. Transaction costs in volatile spreads.',
    edge:'Statistical edge, not deterministic. Robust in mean-reverting regimes. Sector fundamentals reinforce the reversion tendency.',
  },
  {
    id:25, name:'ADR / Ordinary Share Arbitrage', cat:'Statistical / Pairs',
    instruments:['ADR (US)','Ordinary Shares (Foreign Exchange)'], regime:['Any'],
    risk:2, capital:'$100K–$200K', ret:'0.5–3% per round trip', zeroLoss:false,
    summary:'Same company, two markets. ADR price = Foreign ordinary × FX rate × conversion ratio. When they diverge, buy cheap listing, short expensive.',
    how:'ASML US ADR at $950 vs AMS listing at €870 × 1.08 FX = $939.60 implied. $10.40 mispricing. Buy Amsterdam, short US ADR. Convergence typically in hours to days.',
    impl:'Multi-currency IBKR account. Target large ADRs: ASML, Novo Nordisk (NVO), Shell (SHEL), HSBC, Unilever. Execute simultaneously in both markets. $100K. Watch FX hedge cost.',
    risks:'Settlement timing mismatches (T+2 across time zones). FX execution cost. ADR conversion fees. Different trading hours create execution gaps.',
    edge:'Different investor bases in different time zones create pricing gaps at market open/close overlaps and around macro data releases.',
  },
  {
    id:26, name:'Dual-Listed Company Arbitrage', cat:'Statistical / Pairs',
    instruments:['Stock (Exchange A)','Stock (Exchange B, Short)'], regime:['Any'],
    risk:2, capital:'$100K–$200K', ret:'1–5% per spread cycle', zeroLoss:false,
    summary:'Same economic entity listed on two exchanges at different prices (adjusted for FX). Long cheap listing, short expensive. Convergence guaranteed in theory.',
    how:'RIO listed on NYSE (RIO) and London (RIO.L). FX-adjusted price diverges by 1.5%. Long NYSE, short LSE (or vice versa). Hold until gap closes.',
    impl:'Requires simultaneous execution in 2 markets. Hedge FX separately with a forward or EUR/USD future. $100K per pair. Few large opportunities remain post-unifications.',
    risks:'FX movements widen arb against you. Structural premium for primary listing (index inclusion, liquidity). Settlement mismatch.',
    edge:'Different investor bases and liquidity profiles create pricing inefficiencies around macro events and index rebalances.',
  },
  {
    id:27, name:'ETF Rebalance / Tracking Error Arb', cat:'Statistical / Pairs',
    instruments:['Index ETF','Individual Stocks'], regime:['Any'],
    risk:2, capital:'$100K–$200K', ret:'1–3% annualized above passive', zeroLoss:false,
    summary:'Exploit predictable ETF portfolio rebalancing (equal-weight ETFs rebalance monthly; S&P adds/removes quarterly). Front-run the scheduled, price-insensitive flow.',
    how:'Equal-weight RSP rebalances monthly — sells prior month winners, buys losers. Buy losers just before rebalance, sell to ETF on rebalance day. Systematic, calendar-driven.',
    impl:'Monitor ETF rebalance schedules: RSP (monthly), QQQE, DJD, sector ETFs. $50K per trade. Multiple trades per quarter compound the edge. Use IBKR scanners.',
    risks:'Predictability invites competition. Small edge per trade. Flow prediction is inexact.',
    edge:'ETF market structure creates predictable, price-insensitive scheduled demand. Sell-side flow is known in advance.',
  },

  // ── YIELD / CARRY ────────────────────────────────────────────────────────
  {
    id:28, name:'Wheel Strategy (CSP + Covered Call)', cat:'Yield / Carry',
    instruments:['Stock','Cash-Secured Puts','Covered Calls'], regime:['Sideways','Bull'],
    risk:3, capital:'$200K–$400K', ret:'15–30% annualized on deployed capital', zeroLoss:false,
    summary:'Systematically sell cash-secured puts on target stocks. If assigned, sell covered calls. Collect premium in both legs. Requires willingness to own the underlying.',
    how:'RDDT at $120. Sell 30-DTE $110 CSP at $3.50 (3.2% return). If not assigned: pocket $3.50, repeat. If assigned: own at $110, immediately sell $115 CC for $3.00.',
    impl:'Run on 3–4 names: RDDT, NVDA, MSFT, AVGO. $100K per name. Target 30–45 DTE, 15–20 delta puts. Aligns directly with your existing IBKR/ORATS workflow and backtesting.',
    risks:'Stock declining sharply (stuck holding above market). Caps upside in strong bull run. Assignment forces capital deployment into declining asset.',
    edge:'Combines VRP capture with equity ownership. Works well on high-IV stocks you\'d be happy to own. Premium income compresses break-even and softens downside.',
  },
  {
    id:29, name:"Poor Man's Covered Call (PMCC/LEAP)", cat:'Yield / Carry',
    instruments:['Long LEAP Call','Short Near-term Call'], regime:['Bull','Sideways'],
    risk:3, capital:'$100K–$200K', ret:'20–35% theoretical on LEAP cost', zeroLoss:false,
    summary:'Buy deep ITM LEAP instead of 100 shares. Sell near-term OTM calls against it. Capital-efficient covered call with leverage. Profit from short call decay.',
    how:'NVDA $140. Buy 12-month $100 LEAP (δ=0.80) at $52. Sell 30-DTE $150 call at $3.50 monthly. Annual income: $42. On $52 cost = 80% gross, ~30–35% after LEAP decay.',
    impl:'NVDA, MSFT, AVGO. Target 70+ delta LEAPs (>12 months out). Dynamic strike management as stock moves. $100K per position. Note: you ran a 5-year backtest showing this underperforms buy-and-hold in bull markets.',
    risks:'Sharp stock decline destroys LEAP value faster than short call gains. Needs slow/sideways market. Underperforms buy-and-hold in sustained bull run (confirmed by your backtest).',
    edge:'Capital efficiency. Lower cost basis than holding shares. Best in range-bound or slowly-rising environments.',
  },
  {
    id:30, name:'Hard-to-Borrow Stock Lending Income', cat:'Yield / Carry',
    instruments:['High Short-Interest Stock','Protective Put'], regime:['Any'],
    risk:2, capital:'$50K–$150K', ret:'Borrow fee 5–100% ann. + equity return', zeroLoss:false,
    summary:'Hold high short-interest stocks, lend them via IBKR\'s Stock Yield Enhancement Program, earn the lending fee (can be 20–100% annualized). Add put to cap downside.',
    how:'Stock XYZ borrow fee: 30% annualized. Hold $100K. IBKR pays 50% of fee = 15% annual income. Buy 6-month ATM put for $8K. Net: $7K risk-adjusted income.',
    impl:'Screen for stocks with >20% short float and liquid options. Enable IBKR Stock Yield Enhancement Program. Buy put only when borrow income > 1.5× put cost. $100K per position.',
    risks:'Stock declines sharply despite put protection. Borrow rate collapses as short interest unwinds. Puts expensive on high-vol stocks (often eat most of the fee).',
    edge:'Short sellers pay a premium for scarce lending supply. You capture this as the lender. Information advantage: high short interest = potential squeeze upside too.',
  },
  {
    id:31, name:'Synthetic Long vs Actual Stock (Financing Arb)', cat:'Yield / Carry',
    instruments:['Long Call','Short Put (Same Strike)','vs. Stock'], regime:['Bull','High Rates'],
    risk:2, capital:'$100K–$200K', ret:'Financing advantage: 1–3% annually', zeroLoss:false,
    summary:'Long call + short put at same strike = synthetic long stock. When the synthetic is cheaper than actual stock + financing cost, use synthetic instead. Captures rate differential.',
    how:'Stock $100. Buy $100C at $5, sell $100P at $4. Net debit $1. Alternative: own stock at $100 financed at 5% = $5/year carry. Synthetic saves $4/year if dividends are <$4.',
    impl:'Compare synthetic cost vs stock carry for liquid names. Advantage appears when Rf > dividend yield (currently true for many tech stocks). Use for NVDA, MSFT, GOOGL. $100K.',
    risks:'No dividend received on synthetic long. American put early assignment risk. Margin treatment varies by broker. Rate environment shift reverses advantage.',
    edge:'Put-call parity creates an explicit link between options pricing and the risk-free rate. High-rate environments make this particularly attractive for low-dividend stocks.',
  },
  {
    id:32, name:'Covered Call on Core ETF (Box 3 Enhancement)', cat:'Yield / Carry',
    instruments:['ETF (SXR8/SPY proxy)','Short OTM Calls'], regime:['Sideways','Low Vol'],
    risk:2, capital:'$100K–$300K', ret:'2–5% premium income above ETF return', zeroLoss:false,
    summary:'Sell OTM calls on your existing SXR8/VWCE core (via SPY/IVV proxy). Enhance yield above passive in sideways markets. Box 3 tax-neutral (wealth tax, not income).',
    how:'Hold $200K SXR8 equivalent via SPY. Sell 2% OTM 30-DTE calls at $3/share. Monthly repeat. Annual income: 5–8% of portfolio. Upside capped above strike.',
    impl:'Use SPY/IVV options as proxy for SXR8 (98%+ correlation). Write calls on $200K of portfolio. Target VIX > 18 for best premium. NL Box 3 tax regime: options income is not separately taxed on top of wealth tax.',
    risks:'Misses upside above strike in a strong bull year. SPY/SXR8 basis risk (small). Behavioral: watching stocks run past your short calls is psychologically difficult.',
    edge:'Captures index-level VRP on your existing passive holdings. Particularly attractive in NL Box 3 regime — premium income is effectively \'free\' from a tax perspective vs the notional Box 3 yield.',
  },
];

// ── Filter options ────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Pure Arbitrage', 'Quasi-Arbitrage', 'Event-Driven', 'Volatility Arb', 'Capital Structure', 'Statistical / Pairs', 'Yield / Carry'];
const REGIMES    = ['Any', 'Bull', 'Bear', 'Sideways', 'High Vol', 'Low Vol'];
const RISKS      = ['All', 'Very Low (1–2)', 'Medium (3)', 'High (4–5)'];

// ── Sub-components ────────────────────────────────────────────────────────

function RiskDots({ level }: { level: number }) {
  const color = level <= 2 ? '#00D4B4' : level === 3 ? '#FBBF24' : '#F87171';
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: i <= level ? color : 'var(--border)',
        }} />
      ))}
    </div>
  );
}

function Tag({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 7px', borderRadius: 4,
      background: bg, color,
      fontFamily: 'monospace', whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

function FilterPills({
  label, options, value, onChange, colorFn,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  colorFn?: (o: string) => { accent: string; bg: string } | undefined;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(o => {
          const active = value === o;
          const cc = colorFn?.(o);
          return (
            <button key={o} onClick={() => onChange(o)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              border: active ? `1px solid ${cc?.accent ?? 'var(--accent)'}` : '1px solid var(--border)',
              background: active ? (cc?.bg ?? 'color-mix(in srgb, var(--accent) 12%, transparent)') : 'transparent',
              color: active ? (cc?.accent ?? 'var(--accent)') : 'var(--text-muted)',
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}>{o}</button>
          );
        })}
      </div>
    </div>
  );
}

function Card({ s, expanded, onToggle }: { s: Strategy; expanded: boolean; onToggle: () => void }) {
  const cc = CAT_COLORS[s.cat] ?? { accent: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)' };

  const detailRows = [
    { label: '⚙ Mechanics',            text: s.how,   color: 'var(--text-dim)'   },
    { label: '💼 $1M Implementation',  text: s.impl,  color: 'var(--profit)'     },
    { label: '⚠ Key Risks',            text: s.risks, color: 'var(--loss)'       },
    { label: '✦ Edge / Why It Works',  text: s.edge,  color: 'var(--volatile)'   },
  ] as const;

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid ${expanded ? cc.accent + '55' : 'var(--border)'}`,
        borderLeft: `3px solid ${cc.accent}`,
        borderRadius: 10, overflow: 'hidden',
        transition: 'all 0.2s', cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            {/* Category + zero-loss badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 12,
                background: cc.bg, color: cc.accent,
                fontWeight: 600, letterSpacing: '0.02em',
              }}>{s.cat.toUpperCase()}</span>
              {s.zeroLoss && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 12,
                  background: 'rgba(0,212,180,0.12)', color: '#00D4B4',
                  fontWeight: 700, letterSpacing: '0.02em',
                }}>⬡ NEAR-ZERO LOSS</span>
              )}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-h)', marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.summary}</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0, marginTop: 2 }}>
            {expanded ? '▲' : '▼'}
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk</div>
            <RiskDots level={s.risk} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capital</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{s.capital}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expected Return</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{s.ret}</div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {s.instruments.map((ins, i) => (
            <Tag key={i} text={ins} color="var(--text-muted)" bg="color-mix(in srgb, var(--text) 6%, transparent)" />
          ))}
          {s.regime.map((r, i) => (
            <Tag key={i} text={r} color="#60A5FA" bg="rgba(96,165,250,0.10)" />
          ))}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {detailRows.map(({ label, text, color }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, letterSpacing: '0.03em' }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>{text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export function ArbitrageAtlas() {
  const [cat, setCat]       = useState('All');
  const [risk, setRisk]     = useState('All');
  const [regime, setRegime] = useState('Any');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => STRATS.filter(s => {
    const cMatch  = cat === 'All' || s.cat === cat;
    const rMatch  = risk === 'All'
      || (risk === 'Very Low (1–2)' && s.risk <= 2)
      || (risk === 'Medium (3)'     && s.risk === 3)
      || (risk === 'High (4–5)'     && s.risk >= 4);
    const rgMatch = regime === 'Any' || s.regime.includes(regime) || s.regime.includes('Any');
    return cMatch && rMatch && rgMatch;
  }), [cat, risk, regime]);

  const zeroLossCount = filtered.filter(s => s.zeroLoss).length;

  const stats = [
    { v: STRATS.filter(s => s.risk <= 2).length,   l: 'Low Risk (≤2)',    c: '#00D4B4' },
    { v: STRATS.filter(s => s.zeroLoss).length,    l: 'Near-Zero Loss',   c: '#34D399' },
    { v: STRATS.length,                             l: 'Total Strategies', c: '#60A5FA' },
    { v: Object.keys(CAT_COLORS).length,            l: 'Categories',       c: '#A78BFA' },
  ];

  function reset() { setExpanded(null); }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: '#00D4B4', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            MARKET OPPORTUNITIES ATLAS · $1M PORTFOLIO
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text-h)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Arbitrage &amp; Asymmetric Strategies
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8, lineHeight: 1.55, maxWidth: 560 }}>
            {STRATS.length} strategies across all market regimes — from risk-free locking to high-probability edges.
            Tap any card to expand mechanics, implementation, and risks.
          </p>

          {/* Stats bar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
            {stats.map(({ v, l, c }) => (
              <div key={l} style={{
                background: 'var(--bg-card)', borderRadius: 10,
                padding: '10px 16px', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: 'monospace' }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 12, padding: '16px 18px',
          border: '1px solid var(--border)', marginBottom: 20,
        }}>
          <FilterPills
            label="Category"
            options={CATEGORIES}
            value={cat}
            onChange={v => { setCat(v); reset(); }}
            colorFn={o => CAT_COLORS[o]}
          />
          <FilterPills
            label="Risk Level"
            options={RISKS}
            value={risk}
            onChange={v => { setRisk(v); reset(); }}
          />
          <FilterPills
            label="Market Regime"
            options={REGIMES}
            value={regime}
            onChange={v => { setRegime(v); reset(); }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Showing <strong style={{ color: 'var(--text-h)' }}>{filtered.length}</strong> strategies
            {zeroLossCount > 0 && <> · <span style={{ color: '#00D4B4' }}>{zeroLossCount} near-zero-loss</span></>}
          </div>
        </div>

        {/* Card list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
              No strategies match the current filters.
            </div>
          ) : filtered.map(s => (
            <Card
              key={s.id}
              s={s}
              expanded={expanded === s.id}
              onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
            />
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop: 36, paddingTop: 20, borderTop: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          ⚠ Educational reference only. All strategies carry real risks including total loss.
          Verify tax treatment for NL Box 3 regime. Not financial advice.
        </div>
      </div>
    </div>
  );
}
