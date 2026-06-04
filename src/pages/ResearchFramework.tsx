import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutoAnalysis } from '../components/AutoAnalysis';

// ── Types ────────────────────────────────────────────────────────────────────

interface ToolLink {
  label: string;
  path: string;
  description: string;
  accent: string;
}

interface CheckItem {
  text: string;
  flag?: 'green' | 'red' | 'yellow';
}

interface Phase {
  id: number;
  title: string;
  tagline: string;
  accent: string;
  icon: string;
  objective: string;
  context: string;
  checklist: CheckItem[];
  redFlags: string[];
  greenFlags: string[];
  keyMetrics: { name: string; description: string }[];
  tools: ToolLink[];
  proTip: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Understand the Business',
    tagline: 'Before any number, understand what you\'re buying',
    accent: '#8b5cf6',
    icon: '🔍',
    objective:
      'Build a clear mental model of how the company makes money, what keeps competitors out, and whether the market it serves is growing or shrinking. You cannot evaluate a number you don\'t understand in context.',
    context:
      `This is the step most retail investors skip, and it's why they get surprised by results that analysts saw coming from miles away. A professional investor can explain a company's business model in two sentences before opening a spreadsheet. Ask yourself: does this company sell a product or service people need repeatedly (recurring), or do they sell once (transactional)? Is the business model scalable — does revenue grow faster than costs as it scales? What keeps a well-funded competitor from doing exactly what they do? That last question — the moat — is the foundation of every long-term investment thesis.`,
    checklist: [
      { text: 'Can I explain the business model in ≤2 sentences?', flag: 'green' },
      { text: 'Revenue model: subscription, transaction, licensing, advertising, services?', flag: 'yellow' },
      { text: 'Is the TAM (total addressable market) growing, stable, or shrinking?', flag: 'yellow' },
      { text: 'Who are the top 3 competitors and what is this company\'s differentiation?', flag: 'yellow' },
      { text: 'Moat type: network effects, switching costs, cost advantage, brand, patents?', flag: 'yellow' },
      { text: 'What are the primary risk factors (regulatory, cyclical, macro, competition)?', flag: 'red' },
      { text: 'Is management owner-operated, founder-led, or institutional?', flag: 'yellow' },
      { text: 'Check the 10-K "Risk Factors" — are risks structural or temporary?', flag: 'red' },
    ],
    redFlags: [
      'Business model requires constant capital raises to survive (negative FCF with no path to profitability)',
      'Revenue concentrated in 1–2 customers (>20% single customer = client risk)',
      'Management has a pattern of missing guidance or walking back prior commitments',
      'Heavily commoditised product with no pricing power',
      'Regulatory or litigation risk that could impair the core business',
    ],
    greenFlags: [
      'Founder/CEO still running the company with significant equity ownership',
      'High recurring revenue (subscriptions, contracts, consumables) vs one-time sales',
      'Demonstrated pricing power — they raise prices and customers stay',
      'Market leader in a niche growing at >10% annually',
      'Business model improves in unit economics at scale (positive operating leverage)',
    ],
    keyMetrics: [
      { name: 'Revenue mix (recurring vs one-time)', description: 'Higher recurring % = more predictable, higher-quality revenue stream' },
      { name: 'Revenue concentration', description: 'Largest single customer as % of total revenue — above 20% is a risk' },
      { name: 'Customer retention / churn rate', description: 'For SaaS: annual churn <5% is excellent; >15% is a serious problem' },
      { name: 'Net Revenue Retention (NRR)', description: 'SaaS metric: >120% means existing customers are spending more each year — a compounding engine' },
      { name: 'TAM and penetration rate', description: 'If a $10B company is in a $12B TAM, growth will slow — if in a $500B TAM, runway is massive' },
    ],
    tools: [],
    proTip:
      'Read the last 3 annual reports (10-K). Go straight to the CEO letter and the risk factors. Ignore the financial tables for now — you\'re building the story first. Also read the last 2 earnings call transcripts — how management talks about the business in Q&A reveals more than any press release.',
  },
  {
    id: 2,
    title: 'Financial Health Check',
    tagline: 'Verify the story with three statements',
    accent: '#10b981',
    icon: '📊',
    objective:
      'Examine the income statement, balance sheet, and cash flow statement across at least 4 years to identify trends in growth, profitability, and financial strength. Numbers either confirm or contradict the business narrative.',
    context:
      `Three statements, three questions. Income statement: is the business growing profitably? Balance sheet: is it financially stable? Cash flow statement: does accounting profit convert to real cash? Professionals always look at all three together — a company can show strong net income while silently burning cash (see: Enron). The most important single number is free cash flow margin, because FCF is the hardest to manipulate. Trend matters more than any single data point — a company with declining margins but growing revenue is often more interesting than one with flat margins and flat revenue, because it may be investing heavily in growth that will pay off later.`,
    checklist: [
      { text: 'Revenue growing consistently? (3–5 year CAGR)', flag: 'green' },
      { text: 'Gross margin stable or expanding over the last 4 years?', flag: 'green' },
      { text: 'Operating margin trend — widening (scale) or compressing?', flag: 'yellow' },
      { text: 'FCF consistently positive? FCF margin vs net margin?', flag: 'green' },
      { text: 'Net Debt / EBITDA below 3x? Below 2x is comfortable', flag: 'yellow' },
      { text: 'Interest coverage ratio above 5x?', flag: 'yellow' },
      { text: 'Working capital trend — is DSO rising (revenue quality concern)?', flag: 'red' },
      { text: 'Piotroski F-Score ≥7 (financial strength composite)?', flag: 'green' },
      { text: 'Altman Z-Score above 2.6 (low bankruptcy risk)?', flag: 'green' },
      { text: 'SG&A and R&D growing slower than revenue (operating leverage)?', flag: 'green' },
    ],
    redFlags: [
      'Revenue growing but FCF declining — earnings quality deteriorating, likely channel stuffing or aggressive accruals',
      'Net income positive but operating cash flow negative — a classic accounting red flag',
      'Rapidly increasing accounts receivable (DSO rising) without equivalent revenue growth',
      'Debt/EBITDA above 4x in a rising rate environment — servicing costs will crowd out investment',
      'Gross margin compression over 3+ years — competitive moat is eroding',
      'Share count increasing rapidly — dilution is a hidden tax on existing shareholders',
    ],
    greenFlags: [
      'FCF margin exceeds net margin — high earnings quality, cash conversion is strong',
      'Negative cash conversion cycle (paid before they pay suppliers) — structural working capital advantage',
      'Gross margin expanding while revenue grows — pricing power and scale benefits',
      'Debt declining year over year while FCF grows — self-funding the business',
      'R&D as % of revenue is stable — investing in future without burning present',
    ],
    keyMetrics: [
      { name: 'Revenue CAGR (3–5 year)', description: 'The core growth story — >15% is strong for any sector, >25% is exceptional' },
      { name: 'Gross Margin', description: 'Structural pricing power indicator — compare to sector benchmarks in Stock Ratios' },
      { name: 'FCF Margin', description: 'FCF ÷ Revenue — more honest than net margin; >10% is excellent' },
      { name: 'Net Debt / EBITDA', description: 'Leverage: <2x is conservative, >4x is speculative' },
      { name: 'Piotroski F-Score', description: '9-factor score 0–9: ≥7 = financially strong, ≤3 = weak' },
      { name: 'Altman Z-Score', description: '>2.6 = low distress risk; <1.8 = high bankruptcy probability' },
    ],
    tools: [
      {
        label: 'Financial Statements',
        path: '/financials',
        description: 'Income, balance sheet, cash flow with auto-detected flags, margin trends, and Piotroski / Altman scores',
        accent: '#10b981',
      },
      {
        label: 'Stock Ratios Reference',
        path: '/stocks-glossary',
        description: 'In-depth explanations of every ratio with sector benchmarks',
        accent: '#6366f1',
      },
    ],
    proTip:
      'Look at the cash flow statement first. Go to operating cash flow → net income. If operating CF is consistently higher than net income, the business has high earnings quality (non-cash charges like D&A are adding back). If net income consistently outpaces operating CF, dig into working capital changes — someone is managing the books.',
  },
  {
    id: 3,
    title: 'Earnings Quality & Surprise History',
    tagline: 'How reliable is the management team\'s guidance?',
    accent: '#3b82f6',
    icon: '📈',
    objective:
      'Analyse the past 8 quarters of earnings vs estimates to understand whether management consistently sandbaggs guidance (beats), shoots straight, or misses. Stocks reprice on surprise — the beat/miss pattern predicts near-term stock behaviour.',
    context:
      `Earnings surprises are one of the most underappreciated predictors of short-term stock price movement. A company that beats EPS estimates by 5%+ every quarter is not lucky — management is deliberately setting beatable guidance. This "guidance game" is a strategic signal: it means the company has high earnings visibility and chooses to under-promise. Conversely, a company that repeatedly misses or guides down has either poor internal forecasting or deteriorating business conditions. Professional investors call this "execution risk" — and they discount it heavily in the multiple they're willing to pay. The goal is to find high-conviction, repeatable beaters with accelerating EPS growth.`,
    checklist: [
      { text: 'EPS beat rate over last 8 quarters: above 75%?', flag: 'green' },
      { text: 'Revenue beat rate over last 8 quarters: above 65%?', flag: 'green' },
      { text: 'Average EPS surprise magnitude: >3% is strong, >8% is exceptional', flag: 'green' },
      { text: 'Earnings growth trend — is EPS accelerating or decelerating YoY?', flag: 'yellow' },
      { text: 'Any "kitchen sink" quarters (large write-offs) in the last 3 years?', flag: 'red' },
      { text: 'Guidance trend: is management raising full-year guidance or cutting?', flag: 'yellow' },
      { text: 'Revenue beats or misses: revenue misses are harder to explain away than EPS misses', flag: 'red' },
    ],
    redFlags: [
      'Back-to-back revenue misses — demand is softening, not an execution issue',
      'EPS beat driven purely by buybacks or tax rate, not earnings growth',
      'Guidance cut mid-year — management lost visibility into their own business',
      'Large non-recurring charges appearing regularly (they\'re not non-recurring)',
      'Earnings quality: EPS growing but revenue flat (margin expansion story running out)',
    ],
    greenFlags: [
      'Consistent 2–5% EPS beat with guidance raises each quarter — the gold standard',
      'Revenue beats + EPS beats together — top-line + bottom-line execution',
      'Long-term EPS growth CAGR outpacing revenue growth — operating leverage proof',
      'Earnings acceleration: growth rate is increasing, not just positive',
      'Management has beaten or raised guidance in 7 of last 8 quarters',
    ],
    keyMetrics: [
      { name: 'EPS Beat Rate', description: '% of quarters beating consensus EPS estimate — >75% is excellent' },
      { name: 'Average Surprise %', description: 'Mean EPS surprise magnitude — >5% consistently means management sandbaggs' },
      { name: 'Earnings Streak', description: 'Consecutive quarters of YoY EPS growth — longer streak = more stable business' },
      { name: 'EPS CAGR (3yr)', description: 'Compounded annual EPS growth — the single biggest predictor of long-term stock returns' },
      { name: 'Revenue Growth Trend', description: 'Is YoY revenue growth accelerating or decelerating over the last 4 quarters?' },
    ],
    tools: [
      {
        label: 'Earnings Surprises',
        path: '/earnings-history',
        description: 'Beat/miss chart for last 8 quarters, beat rate, EPS streak, and annual EPS CAGR',
        accent: '#3b82f6',
      },
    ],
    proTip:
      'A stock can go up on bad earnings or down on good earnings — what matters is results vs expectations. A company that grows EPS 20% but guided 25% will sell off. A company that grows EPS 5% against a -10% expected print will rip. Always anchor to what the market was priced for, not just absolute numbers.',
  },
  {
    id: 4,
    title: 'Valuation Assessment',
    tagline: 'Is the stock cheap, fair, or expensive relative to fundamentals?',
    accent: '#f59e0b',
    icon: '⚖️',
    objective:
      'Compare the stock\'s current trading multiples to historical averages, sector peers, and growth-adjusted benchmarks to determine whether the market is pricing in too much optimism, too much pessimism, or fair value.',
    context:
      `Valuation is not about finding the lowest P/E ratio — cheap stocks are often cheap for a reason. It's about finding the biggest gap between what the market is paying today and what the business will actually deliver over the next 3–5 years. A stock with P/E = 35x growing earnings at 30% annually is cheaper than a P/E = 12x business growing at 2% — because in 5 years, the fast-grower will have earned the multiple. Professional investors use multiple valuation lenses simultaneously: relative (vs peers), historical (vs own history), and intrinsic (DCF). No single metric gives you the answer; they triangulate a range. The goal is to find situations where the stock is mispriced due to short-term noise while the long-term trajectory is intact.`,
    checklist: [
      { text: 'P/E ratio vs sector median — premium is justified by growth?', flag: 'yellow' },
      { text: 'PEG ratio (P/E ÷ growth) below 1.5?', flag: 'green' },
      { text: 'EV/EBITDA vs sector — where in the range?', flag: 'yellow' },
      { text: 'P/FCF below 20x (FCF yield >5%)?', flag: 'green' },
      { text: 'P/S ratio appropriate for gross margin profile?', flag: 'yellow' },
      { text: 'Current price vs analyst consensus target and 52-week range', flag: 'yellow' },
      { text: 'Price-to-Book (P/B) — relevant for asset-heavy or financial companies', flag: 'yellow' },
      { text: 'Has the multiple contracted or expanded YTD vs earnings growth?', flag: 'yellow' },
    ],
    redFlags: [
      'Trading at a significant premium to all-time-high multiples with decelerating growth',
      'Revenue growth slowing while multiple is still pricing in hyper-growth (P/S >15x with <20% growth)',
      'Negative FCF + high EV/Revenue multiple — requires external capital to maintain valuation',
      'All valuation metrics at multi-year highs with no new catalyst to justify re-rating',
      'Analyst target prices based on aggressive 5-year projections with no near-term earnings',
    ],
    greenFlags: [
      'P/FCF below 15x for a cash-generative business with consistent >10% FCF growth',
      'Stock trading at discount to 3-year average multiple while fundamentals are improving',
      'PEG below 1.0 — paying less than 1x for each point of earnings growth',
      'EV/EBITDA below sector median while ROIC is above sector median (quality at a discount)',
      'Management buybacks at current prices (insiders are telling you they think it\'s cheap)',
    ],
    keyMetrics: [
      { name: 'P/E (Trailing & Forward)', description: 'What the market pays per dollar of earnings — compare forward to trailing to see if growth is priced in' },
      { name: 'PEG Ratio', description: 'P/E ÷ EPS Growth Rate — Peter Lynch\'s favourite: <1.0 is traditionally undervalued' },
      { name: 'EV/EBITDA', description: 'Enterprise-value based — accounts for debt, best for cross-company comparisons' },
      { name: 'P/FCF', description: 'Price-to-free-cash-flow — the most manipulation-resistant valuation multiple' },
      { name: 'FCF Yield', description: 'FCF ÷ Market Cap — the cash return you get per year; compare to 10-yr treasury rate' },
      { name: 'Price vs 52-week range', description: 'Where is it in its range? Stocks near 52-week lows merit extra scrutiny (and sometimes reward)' },
    ],
    tools: [
      {
        label: 'Valuation Snapshot',
        path: '/valuation',
        description: 'Full ratio dashboard — P/E, P/B, P/S, PEG, EV/EBITDA, analyst target, 52-week range with colour-coded flags',
        accent: '#f59e0b',
      },
      {
        label: 'Stock Ratios Reference',
        path: '/stocks-glossary',
        description: 'Deep-dive explanations for every multiple with sector benchmarks and signal ranges',
        accent: '#6366f1',
      },
    ],
    proTip:
      'The best time to buy quality companies at a discount is when the whole sector is out of favour — not just the individual stock. When EV/EBITDA for an entire sector is at the low end of its 10-year range, sector-wide cheap often means systematic opportunity. Individual stock cheap might just mean individual stock broken.',
  },
  {
    id: 5,
    title: 'Intrinsic Value (DCF)',
    tagline: 'What is this business worth based on future cash flows?',
    accent: '#6366f1',
    icon: '🧮',
    objective:
      'Build a discounted cash flow model under base, bull, and bear scenarios to derive an intrinsic value range and calculate the margin of safety at the current price.',
    context:
      `DCF is both the most powerful and most dangerous valuation tool. It's powerful because it forces you to make your assumptions explicit — you can't do a DCF without committing to a view on growth rates, margins, and risk. It's dangerous because garbage in = garbage out: tweak the terminal growth rate by 1% and the output changes by 30%. Professionals use DCF not to find a precise price target but to map a range — bull case intrinsic value to bear case intrinsic value. The current stock price should sit below the mid-case intrinsic value for there to be a margin of safety. Warren Buffett's rule: never pay more than 50 cents for a dollar of intrinsic value. The DCF exercise also forces you to confront: "what growth rate is already baked into this stock price?" — sometimes the market implies an absurd rate, and that's the real insight.`,
    checklist: [
      { text: 'Model base case: use consensus revenue growth for years 1–3, conservative beyond', flag: 'yellow' },
      { text: 'Bull case: assume company executes on its best stated targets', flag: 'green' },
      { text: 'Bear case: assume growth halves and margins compress 200bps', flag: 'red' },
      { text: 'Use WACC of 9–11% for most US large-cap companies', flag: 'yellow' },
      { text: 'Terminal growth rate: 2–3% for mature businesses, never higher than GDP growth', flag: 'yellow' },
      { text: 'Is the implied intrinsic value meaningfully above current price?', flag: 'green' },
      { text: 'Margin of safety target: buy when price is 20–40% below base case intrinsic value', flag: 'green' },
      { text: 'Reverse DCF: what growth rate does the current price imply? Is it realistic?', flag: 'yellow' },
    ],
    redFlags: [
      'Bull case requires 30%+ revenue CAGR for 10 years — almost no large-cap achieves this',
      'Positive NPV only if terminal growth rate is above 4% — this is usually an error',
      'Base case intrinsic value is within 10% of current price — no margin of safety',
      'FCF used in DCF is not confirmed by historical FCF — you\'re projecting a business that doesn\'t exist yet',
      'Ignoring stock-based compensation in FCF calculation — real dilution to shareholders',
    ],
    greenFlags: [
      'Even bear case intrinsic value is above current price — asymmetric risk/reward',
      'Reverse DCF shows market is implying 5% revenue growth but you model 15% — you have an edge',
      'Intrinsic value range is tight (bull vs bear within 30%) — high-quality, predictable business',
      'Current stock price is at a 30%+ discount to base case — margin of safety is comfortable',
    ],
    keyMetrics: [
      { name: 'WACC', description: 'Discount rate: 8–10% for investment-grade companies, 12–15% for high-growth, higher for speculative' },
      { name: 'Terminal Growth Rate', description: 'Long-run FCF growth post-projection period — should be at or below GDP growth (2–3%)' },
      { name: 'FCF Margin (projected)', description: 'The FCF margin you are assuming in Year 5–10 — must be supportable by industry benchmarks' },
      { name: 'Intrinsic Value Range', description: 'Bear / base / bull case NPV — the range tells you the uncertainty, not just the midpoint' },
      { name: 'Margin of Safety', description: '(Intrinsic Value − Current Price) ÷ Intrinsic Value — target ≥20–30% for most positions' },
      { name: 'Implied Growth Rate', description: 'Reverse-solve the DCF: what growth does today\'s price imply? If unrealistic, stock is overvalued' },
    ],
    tools: [
      {
        label: 'DCF Calculator',
        path: '/dcf',
        description: 'Interactive 5-year FCF model with base/bull/bear scenarios, sensitivity table, and margin of safety output',
        accent: '#6366f1',
      },
    ],
    proTip:
      'The most useful output of a DCF is not the price target — it\'s the implied growth rate (reverse DCF). Plug in the current stock price and solve for the revenue growth rate required to justify it. If the market is implying 35% CAGR for 10 years and the business has never grown above 20%, the stock is priced for perfection. This makes you a seller, not a buyer.',
  },
  {
    id: 6,
    title: 'Dividend & Capital Return',
    tagline: 'For income-focused positions: is the payout safe and growing?',
    accent: '#ec4899',
    icon: '💰',
    objective:
      'Evaluate dividend sustainability, FCF coverage, payout growth history, and the overall capital return policy (dividends + buybacks) to assess whether the income stream is reliable and growing.',
    context:
      `Not every investment thesis requires a dividend analysis — for high-growth companies, dividends are irrelevant (they reinvest all FCF). But for income investors, retirees, and dividend-growth strategies, this step is critical. The single most important question is: can the company cover its dividend from free cash flow — not earnings? Many companies pay dividends out of debt or by cutting investment — that's a trap that eventually breaks. Aristocrats (25+ years of consecutive increases) and Kings (50+ years) have built capital-return into their culture. The second question: is the dividend growing? A company growing its dividend 8% annually doubles your yield-on-cost in 9 years. That compounding is the real power of dividend investing.`,
    checklist: [
      { text: 'FCF payout ratio below 70%? (FCF covers dividend with buffer)', flag: 'green' },
      { text: 'Earnings payout ratio below 60%?', flag: 'green' },
      { text: 'Dividend growth rate consistent over 5+ years?', flag: 'green' },
      { text: 'Is the company a Dividend Aristocrat (25+ years increases)?', flag: 'green' },
      { text: 'Debt-funded dividend? Check if debt is rising while dividend is paid', flag: 'red' },
      { text: 'Buyback yield: total shareholder yield = dividend yield + buyback yield?', flag: 'yellow' },
      { text: 'Dividend yield anomalously high? (>6% often signals the market expects a cut)', flag: 'red' },
    ],
    redFlags: [
      'Payout ratio above 100% of FCF — company is paying out more than it earns',
      'Dividend yield suddenly spiking due to stock price collapse (yield trap)',
      'Dividend cut history: once a company cuts, it often cuts again',
      'High debt + high payout ratio in a rising rate environment — payout will be sacrificed for debt service',
      'Declining revenue + maintained dividend — a race to the bottom',
    ],
    greenFlags: [
      'FCF payout ratio below 50% with FCF growing >5% annually — dividend has room to grow and is very safe',
      '25+ year consecutive dividend growth — culture of shareholder return is embedded',
      'Management explicitly states dividend protection as a capital allocation priority',
      'Buyback yield >3% on top of dividend — total shareholder yield is compelling',
      'Dividend growth CAGR of 8%+: yield-on-cost doubles every 9 years',
    ],
    keyMetrics: [
      { name: 'FCF Payout Ratio', description: 'Dividend ÷ FCF — the safest measure. Below 60% is safe; above 90% is at risk' },
      { name: 'Earnings Payout Ratio', description: 'Dividend ÷ EPS — traditional measure, but FCF is more reliable' },
      { name: 'Dividend Growth CAGR', description: '5-year dividend growth rate — the compound interest of income investing' },
      { name: 'Dividend Yield', description: 'Annual dividend ÷ stock price — context: >6% warrants scrutiny' },
      { name: 'Total Shareholder Yield', description: 'Dividend yield + buyback yield — the total cash return to shareholders annually' },
    ],
    tools: [
      {
        label: 'Dividend Safety',
        path: '/dividends',
        description: 'Payout ratio, FCF coverage, Safe/Watch/At Risk badge, and annual dividend history chart',
        accent: '#ec4899',
      },
    ],
    proTip:
      'For non-dividend payers, calculate the total shareholder yield instead: (dividends + net buybacks) ÷ market cap. A company buying back 4% of its shares annually while paying no dividend is returning more cash than many dividend stocks. Apple and Meta are examples — both returned enormous capital through buybacks rather than dividends.',
  },
  {
    id: 7,
    title: 'Sentiment, News & Catalysts',
    tagline: 'What does the market know that you don\'t — and vice versa?',
    accent: '#06b6d4',
    icon: '📡',
    objective:
      'Synthesise recent news flow, analyst sentiment, and upcoming catalysts to determine the informational edge (if any), assess whether the current price reflects known information, and identify upcoming events that could reprice the stock.',
    context:
      `Markets are generally efficient at pricing known information — the edge is in what the market is either ignoring or overweighting. News sentiment analysis helps you understand the narrative the market is currently pricing: is the stock in a bad-news-priced-in phase (contrarian opportunity) or in a hype phase (crowded trade risk)? Catalysts matter enormously for timing — even the right thesis at the wrong time can be frustrating or costly. Upcoming earnings, product launches, FDA approvals, regulatory decisions, management changes, or activist investor involvement are all catalysts that can close the gap between price and value. Professional investors map the catalyst calendar before sizing a position.`,
    checklist: [
      { text: 'Recent news sentiment: overall positive, neutral, or negative bias?', flag: 'yellow' },
      { text: 'Analyst consensus: Buy/Hold/Sell ratio and average price target?', flag: 'yellow' },
      { text: 'Any material news in last 30 days (earnings, guidance, M&A, management)?', flag: 'yellow' },
      { text: 'Upcoming catalysts mapped: next earnings date, investor day, product launch?', flag: 'green' },
      { text: 'Short interest: high short interest + improving fundamentals = short squeeze risk', flag: 'yellow' },
      { text: 'Is negative sentiment from transient issues (bad macro quarter) or structural problems?', flag: 'red' },
      { text: 'Insider buying? Net insider buying is a strong bullish signal', flag: 'green' },
    ],
    redFlags: [
      'Multiple analyst downgrades in a short window — something they know is changing',
      'Management selling large blocks of stock via 10b5-1 plans (planned, but optics matter)',
      'Negative sentiment driven by structural business deterioration, not macro headwinds',
      'Key executive departures (CFO or CEO unexpectedly leaving is a serious red flag)',
      'Regulatory or legal action with material financial exposure (not just headline risk)',
    ],
    greenFlags: [
      'Negative sentiment from macro headwinds while company-specific metrics are strong — temporary discount',
      'Analyst upgrades following a quarter where the stock sold off irrationally',
      'Net insider buying in the open market (not options exercises)',
      'Clear upcoming catalyst (product launch, FDA decision) not yet priced in',
      'Short interest declining — short-sellers are capitulating, which can fuel an upside move',
    ],
    keyMetrics: [
      { name: 'News Sentiment Score', description: 'Aggregated sentiment across recent news — are the headlines getting better or worse?' },
      { name: 'Analyst Buy/Hold/Sell ratio', description: 'Consensus recommendation: >70% Buy = crowded bullish; <40% Buy = wall of worry (contrarian)' },
      { name: 'Short Interest %', description: 'Shares sold short ÷ float — >10% is elevated; >20% is significant short squeeze risk' },
      { name: 'Days to Cover', description: 'Short interest ÷ average daily volume — high days-to-cover means shorts can\'t exit quickly' },
      { name: 'Catalyst timeline', description: 'Map all known catalysts for next 90 days: earnings, guidance updates, regulatory, product milestones' },
    ],
    tools: [
      {
        label: 'News Sentiment & Summary',
        path: '/news-sentiment',
        description: 'Local AI analysis of recent SEC filings and news articles — sentiment scoring, summary, and bull/bear signal extraction',
        accent: '#06b6d4',
      },
    ],
    proTip:
      'The best investments are often in stocks with negative sentiment but improving fundamentals. The narrative lags the data by 1–2 quarters. If the financial statements (Step 2) show margin expansion and FCF growth while the news (Step 7) is still bearish, you may have found a situation where you\'re buying ahead of the turn.',
  },
  {
    id: 8,
    title: 'Investment Decision & Sizing',
    tagline: 'Synthesise the research into a position with a defined risk/reward',
    accent: '#f97316',
    icon: '🎯',
    objective:
      'Consolidate all prior analysis into a formal thesis: bull case, bear case, and base case return expectations. Define entry criteria, target price, stop-loss level, and position size based on conviction and risk tolerance.',
    context:
      `Every investment thesis should be written down — not as a formality, but because the exercise of articulating your bull and bear case forces clarity. If you can't write down why you're wrong (bear case), you don't understand the position. A professional investor always asks: what would have to be true for me to be wrong? If those conditions are plausible, position sizing should be conservative. If those conditions are implausible, position sizing can be aggressive. The Kelly Criterion is a mathematical framework for position sizing based on the probability and magnitude of win/loss — professionals don't blindly follow it, but understanding it prevents over-concentration in uncertain positions. Diversification is not about owning 40 stocks — it's about owning positions with uncorrelated risk.`,
    checklist: [
      { text: 'Written thesis: bull case return and probability?', flag: 'green' },
      { text: 'Written thesis: bear case loss and probability?', flag: 'red' },
      { text: 'Expected Value positive? (Bull case × probability) − (Bear case × probability)', flag: 'green' },
      { text: 'Time horizon defined: when does the thesis play out?', flag: 'yellow' },
      { text: 'Catalyst to close the gap between price and intrinsic value?', flag: 'yellow' },
      { text: 'Stop-loss or invalidation level defined before entering?', flag: 'red' },
      { text: 'Position size appropriate for conviction and correlation to existing portfolio?', flag: 'yellow' },
      { text: 'Is the position size one you can hold through a 30% drawdown without panic selling?', flag: 'yellow' },
    ],
    redFlags: [
      'Bull case requires everything to go right; bear case is catastrophic — asymmetric downside',
      'No defined exit: "I\'ll sell when I feel like it" is not a strategy',
      'Thesis is based on what the company could become, not what it demonstrably is',
      'Concentration >15% in a single position without exceptional conviction and a very tight bear case',
      'Buying because "the stock is down a lot" — that\'s not a thesis, that\'s a heuristic',
    ],
    greenFlags: [
      'Risk/reward ratio of 3:1 or better: if you lose $1 in the bear case, you make $3+ in the bull case',
      'Clear catalyst with defined timeline that will prove or disprove the thesis within 12 months',
      'Bear case intrinsic value is still above current price — limited downside even if wrong',
      'The thesis is contrarian to consensus but supported by the data you\'ve gathered in steps 1–7',
      'Position size lets you sleep at night — behavioural discipline starts before you buy',
    ],
    keyMetrics: [
      { name: 'Expected Value (EV)', description: '(P(win) × upside) − (P(loss) × downside) — only invest if EV is positive and meaningful' },
      { name: 'Risk/Reward ratio', description: 'Target gain ÷ maximum acceptable loss — professional standard is ≥2:1, ideally ≥3:1' },
      { name: 'Position size', description: 'Rule of thumb: 2–5% for moderate conviction, 5–10% for high conviction, >10% only with extraordinary certainty' },
      { name: 'Time horizon', description: 'When does your thesis mature? A 3-year thesis sized at 5% is very different from a 3-month trade' },
      { name: 'Invalidation criteria', description: 'Pre-define what conditions would prove your thesis wrong — this protects against confirmation bias' },
    ],
    tools: [],
    proTip:
      'Write your thesis in 200 words before buying. Include: what you own, why it\'s undervalued, what the catalyst is, what would make you wrong, and what price makes you re-evaluate. Revisit this note at every earnings report. Positions where the original thesis no longer holds but you haven\'t sold are the most dangerous thing in a portfolio.',
  },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolLink }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(tool.path)}
      style={{
        background: 'var(--bg)',
        border: `1px solid ${tool.accent}40`,
        borderRadius: 8,
        padding: '12px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = tool.accent + '12';
        e.currentTarget.style.borderColor = tool.accent + '80';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--bg)';
        e.currentTarget.style.borderColor = tool.accent + '40';
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: tool.accent, flexShrink: 0, marginTop: 5,
      }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: tool.accent, marginBottom: 3 }}>
          {tool.label} →
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {tool.description}
        </div>
      </div>
    </button>
  );
}

function PhaseCard({ phase, isActive, onClick }: {
  phase: Phase; isActive: boolean; onClick: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'checklist' | 'metrics' | 'tools'>('overview');

  const TABS = [
    { id: 'overview' as const, label: 'Deep Dive' },
    { id: 'checklist' as const, label: 'Checklist' },
    { id: 'metrics' as const, label: 'Key Metrics' },
    { id: 'tools' as const, label: `Tools${phase.tools.length ? ` (${phase.tools.length})` : ''}` },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isActive ? phase.accent + '60' : 'var(--border)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      boxShadow: isActive ? `0 0 0 1px ${phase.accent}20` : 'none',
    }}>
      {/* Phase header — always visible */}
      <button
        onClick={onClick}
        style={{
          width: '100%', background: 'none', border: 'none',
          cursor: 'pointer', padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
        }}
      >
        {/* Step number */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: isActive ? phase.accent : 'var(--bg-card2)',
          border: `2px solid ${isActive ? phase.accent : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800,
          color: isActive ? '#fff' : 'var(--text-muted)',
          transition: 'all 0.2s',
        }}>
          {phase.id}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: phase.accent, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Phase {phase.id}
            </span>
            {phase.tools.length > 0 && (
              <span style={{
                fontSize: 10, background: phase.accent + '18',
                color: phase.accent, borderRadius: 4, padding: '1px 6px',
                border: `1px solid ${phase.accent}35`,
              }}>
                {phase.tools.length} tool{phase.tools.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-h)', marginTop: 2 }}>
            {phase.icon} {phase.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {phase.tagline}
          </div>
        </div>

        <span style={{
          fontSize: 14, color: 'var(--text-muted)', flexShrink: 0,
          transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s',
        }}>▾</span>
      </button>

      {/* Expanded content */}
      {isActive && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {/* Objective banner */}
          <div style={{
            padding: '14px 20px',
            background: phase.accent + '10',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: phase.accent, marginBottom: 6 }}>
              Objective
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-h)', lineHeight: 1.65 }}>
              {phase.objective}
            </p>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 18px', fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                  color: tab === t.id ? phase.accent : 'var(--text-muted)',
                  borderBottom: tab === t.id ? `2px solid ${phase.accent}` : '2px solid transparent',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px' }}>
            {tab === 'overview' && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.8, margin: '0 0 20px', whiteSpace: 'pre-line' }}>
                  {phase.context}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Green flags */}
                  <div style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 8, padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#10b981', marginBottom: 10 }}>
                      ✓ Green Flags
                    </div>
                    {phase.greenFlags.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: '#10b981', fontSize: 11, flexShrink: 0, marginTop: 1 }}>●</span>
                        <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Red flags */}
                  <div style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8, padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#ef4444', marginBottom: 10 }}>
                      ✗ Red Flags
                    </div>
                    {phase.redFlags.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: '#ef4444', fontSize: 11, flexShrink: 0, marginTop: 1 }}>●</span>
                        <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro tip */}
                <div style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'rgba(99,102,241,0.07)',
                  borderLeft: `3px solid ${phase.accent}`,
                  borderRadius: '0 8px 8px 0',
                  fontSize: 12, color: 'var(--text)', lineHeight: 1.65,
                }}>
                  <strong style={{ color: phase.accent }}>Pro tip: </strong>
                  {phase.proTip}
                </div>
              </div>
            )}

            {tab === 'checklist' && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  Work through each item before proceeding to the next phase. Green items are confirmation signals, yellow require investigation, red are potential disqualifiers.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {phase.checklist.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px',
                        background: item.flag === 'green' ? 'rgba(16,185,129,0.06)' :
                                    item.flag === 'red' ? 'rgba(239,68,68,0.06)' : 'var(--bg-card2)',
                        border: `1px solid ${
                          item.flag === 'green' ? 'rgba(16,185,129,0.2)' :
                          item.flag === 'red' ? 'rgba(239,68,68,0.2)' : 'var(--border)'
                        }`,
                        borderRadius: 7,
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                        border: `2px solid ${
                          item.flag === 'green' ? '#10b981' :
                          item.flag === 'red' ? '#ef4444' : 'var(--border)'
                        }`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9,
                        color: item.flag === 'green' ? '#10b981' : item.flag === 'red' ? '#ef4444' : 'var(--text-muted)',
                      }}>
                        {item.flag === 'green' ? '✓' : item.flag === 'red' ? '!' : '?'}
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-h)', lineHeight: 1.5 }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'metrics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {phase.keyMetrics.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-card2)', borderRadius: 8,
                      padding: '12px 16px', border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: phase.accent, marginBottom: 4 }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                      {m.description}
                    </div>
                  </div>
                ))}
                <div style={{
                  padding: '10px 14px', marginTop: 4,
                  background: 'var(--bg-card2)', borderRadius: 8, border: '1px solid var(--border)',
                  fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
                }}>
                  See the <strong style={{ color: 'var(--text-h)' }}>Stock Ratios Reference</strong> for full sector benchmarks and signal ranges for each of these metrics.
                </div>
              </div>
            )}

            {tab === 'tools' && (
              <div>
                {phase.tools.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
                      These tools are built into Meridian. Click to open them directly for analysis.
                    </div>
                    {phase.tools.map((tool, i) => (
                      <ToolCard key={i} tool={tool} />
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '24px 20px', textAlign: 'center',
                    color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
                    This phase is qualitative research — no specific tool, but the insights are foundational for every subsequent step. Refer to the company\'s 10-K, earnings transcripts, and investor presentations.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function ResearchFramework() {
  const [activePhase, setActivePhase] = useState<number | null>(1);

  const togglePhase = (id: number) => {
    setActivePhase(prev => (prev === id ? null : id));
  };

  const toolMap = [
    { path: '/financials', label: 'Financial Statements', phase: 2, accent: '#10b981' },
    { path: '/earnings-history', label: 'Earnings Surprises', phase: 3, accent: '#3b82f6' },
    { path: '/valuation', label: 'Valuation Snapshot', phase: 4, accent: '#f59e0b' },
    { path: '/stocks-glossary', label: 'Stock Ratios', phase: '2 & 4', accent: '#6366f1' },
    { path: '/dcf', label: 'DCF Calculator', phase: 5, accent: '#6366f1' },
    { path: '/dividends', label: 'Dividend Safety', phase: 6, accent: '#ec4899' },
    { path: '/news-sentiment', label: 'News Sentiment', phase: 7, accent: '#06b6d4' },
  ];

  const navigate = useNavigate();

  return (
    <div className="page-wrap">
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: '#6366f1' }} />
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
            Company Research Framework
          </h1>
        </div>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
          An 8-phase professional due diligence process — from understanding the business to sizing the position. Each phase links to tools already in Meridian.
        </p>

        {/* Quick stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
        }}>
          {[
            { label: '8 Phases', sub: 'Structured workflow' },
            { label: '45+ Checks', sub: 'Checklist items' },
            { label: '7 Tools', sub: 'Linked in Meridian' },
            { label: '30+ Metrics', sub: 'Defined with benchmarks' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool map */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
          Tools — click to open
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {toolMap.map(t => (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              style={{
                background: t.accent + '12',
                border: `1px solid ${t.accent}40`,
                borderRadius: 6, padding: '7px 14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = t.accent + '22'; e.currentTarget.style.borderColor = t.accent + '80'; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.accent + '12'; e.currentTarget.style.borderColor = t.accent + '40'; }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.accent, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: t.accent }}>{t.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 2 }}>Phase {t.phase}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Auto-Analysis ── */}
      <AutoAnalysis />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Research Roadmap — Phase by Phase
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Phase roadmap */}
      <div style={{ position: 'relative' }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute', left: 19, top: 40, bottom: 40, width: 2,
          background: 'linear-gradient(to bottom, var(--border), var(--border))',
          zIndex: 0, display: 'none',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PHASES.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              isActive={activePhase === phase.id}
              onClick={() => togglePhase(phase.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        marginTop: 48, padding: '24px 28px',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)' }}>
          Ready to analyse a company?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
          Start with Financial Statements for the numbers, then layer in Valuation and DCF for pricing. Use Earnings Surprises to evaluate management execution.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: 'Financial Statements', path: '/financials', accent: '#10b981' },
            { label: 'Valuation Snapshot', path: '/valuation', accent: '#f59e0b' },
            { label: 'DCF Calculator', path: '/dcf', accent: '#6366f1' },
            { label: 'Earnings Surprises', path: '/earnings-history', accent: '#3b82f6' },
          ].map(t => (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              style={{
                background: t.accent, border: 'none', borderRadius: 7, padding: '9px 18px',
                fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
