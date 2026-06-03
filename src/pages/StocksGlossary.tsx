import { useState } from 'react';

interface SectorRange {
  sector: string;
  value: string;
  signal: 'green' | 'yellow' | 'red';
}

interface RatioCard {
  id: string;
  name: string;
  formula?: string;
  summary: string;
  definition: string;
  ranges: SectorRange[];
  investorNote: string;
  category: string;
}

const RATIOS: RatioCard[] = [
  // ── PROFITABILITY ──────────────────────────────────────────
  {
    id: 'gross-margin',
    name: 'Gross Margin',
    formula: '(Revenue − COGS) ÷ Revenue',
    summary: 'Revenue retained after direct production costs',
    category: 'profitability',
    definition: `Gross margin tells you how much of each dollar of revenue survives after paying for the direct cost of making or delivering the product — raw materials, manufacturing labor, direct overhead. It does not include salaries, R&D, rent, or marketing.

A high gross margin means pricing power and/or a scalable cost structure. It's often the single most important margin because everything else — R&D, sales, interest — gets paid out of gross profit. A declining gross margin is a red flag: pricing pressure, rising input costs, or a deteriorating competitive position.`,
    ranges: [
      { sector: 'Software / SaaS', value: '65–85%', signal: 'green' },
      { sector: 'Semiconductors', value: '50–65%', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '55–75%', signal: 'green' },
      { sector: 'Financial Services', value: '40–60%', signal: 'green' },
      { sector: 'Consumer Staples', value: '25–45%', signal: 'yellow' },
      { sector: 'IT Hardware', value: '15–25%', signal: 'yellow' },
      { sector: 'Retail', value: '20–35%', signal: 'yellow' },
      { sector: 'Auto / Industrial', value: '10–20%', signal: 'yellow' },
    ],
    investorNote: `Compare only within sector — comparing a hardware company to a SaaS company is meaningless. Watch the trend more than the absolute value. Rising gross margin + flat revenue = mix shift toward higher-margin products (positive). Falling gross margin = commoditisation signal.`,
  },
  {
    id: 'operating-margin',
    name: 'Operating Margin',
    formula: 'Operating Income (EBIT) ÷ Revenue',
    summary: 'Profit after all operating costs, before interest and tax',
    category: 'profitability',
    definition: `Operating margin captures all the costs of running the actual business — gross profit minus R&D, SG&A (salaries, marketing, admin), depreciation. It excludes interest (financing decisions) and taxes (jurisdiction effects).

This is arguably the best single profitability metric for operational efficiency because it reflects what management controls day-to-day. A widening operating margin signals either pricing power, cost discipline, or operating leverage (fixed costs spread over growing revenue). Compression — even if gross margin is stable — means opex is growing faster than revenue.`,
    ranges: [
      { sector: 'Software / SaaS', value: '20–35%', signal: 'green' },
      { sector: 'Semiconductors', value: '25–40%', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '20–30%', signal: 'green' },
      { sector: 'Consumer Staples', value: '10–18%', signal: 'yellow' },
      { sector: 'IT Hardware', value: '5–10%', signal: 'yellow' },
      { sector: 'Retail', value: '3–8%', signal: 'yellow' },
      { sector: 'Auto / Industrial', value: '4–9%', signal: 'yellow' },
      { sector: 'Airlines', value: '0–6%', signal: 'red' },
    ],
    investorNote: `The spread between gross margin and operating margin tells you about opex efficiency. A company spending heavily on R&D may have a large spread — that's strategic. Excessive SG&A bloat is a different story. Also used in EV/EBIT valuation multiples.`,
  },
  {
    id: 'net-margin',
    name: 'Net Margin',
    formula: 'Net Income ÷ Revenue',
    summary: 'Final bottom-line profit per dollar of revenue',
    category: 'profitability',
    definition: `Net margin is the "final score" — what's left after every expense including interest and taxes. It's the least pure operational metric because it's affected by capital structure (debt level = interest expense), tax management, and one-time items.

A company can have great operations but terrible net margin due to a leveraged balance sheet. Conversely, a lightly taxed company in a favorable jurisdiction may report inflated net margins. Always cross-reference with operating margin and FCF margin to triangulate the real picture.`,
    ranges: [
      { sector: 'Software / SaaS', value: '15–30%', signal: 'green' },
      { sector: 'Semiconductors', value: '20–35%', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '15–25%', signal: 'green' },
      { sector: 'Consumer Staples', value: '8–15%', signal: 'yellow' },
      { sector: 'IT Hardware', value: '3–7%', signal: 'yellow' },
      { sector: 'Retail', value: '2–5%', signal: 'yellow' },
      { sector: 'Auto', value: '2–6%', signal: 'yellow' },
      { sector: 'Airlines', value: '0–4%', signal: 'red' },
    ],
    investorNote: `Used in P/E ratio construction. Declining net margin while operating margin holds → financing costs or tax rate change. Declining both → operational deterioration. High net margin + low FCF margin → accounting earnings may be aggressive (check working capital).`,
  },
  {
    id: 'fcf-margin',
    name: 'FCF Margin',
    formula: 'Free Cash Flow ÷ Revenue  (FCF = Operating Cash Flow − Capex)',
    summary: 'Real cash generated vs reported earnings',
    category: 'profitability',
    definition: `FCF margin is often considered the most honest profitability metric because cash is harder to manipulate than accounting earnings. It strips away non-cash items (depreciation, stock comp) and shows what the business actually generates for shareholders after maintaining and growing its asset base.

A company with net margin > FCF margin may be deferring cash collection or over-capitalizing expenses. FCF > net income is generally a positive quality signal. Companies with high FCF margins can self-fund growth, pay dividends, buy back shares, or weather downturns without needing external capital. Warren Buffett calls it "owner earnings."`,
    ranges: [
      { sector: 'Software / SaaS', value: '20–40%', signal: 'green' },
      { sector: 'Semiconductors', value: '15–30%', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '15–25%', signal: 'green' },
      { sector: 'Consumer Staples', value: '8–15%', signal: 'green' },
      { sector: 'IT Hardware', value: '5–10%', signal: 'green' },
      { sector: 'Retail', value: '2–6%', signal: 'yellow' },
      { sector: 'Auto / Industrial', value: '2–7%', signal: 'yellow' },
      { sector: 'Utilities', value: '-5–5%', signal: 'red' },
    ],
    investorNote: `P/FCF is used as a valuation multiple. FCF yield (FCF ÷ Market Cap) tells you what % return you get in cash per year. FCF > net income = high earnings quality. Used in DCF models as the basis for intrinsic value calculations.`,
  },
  {
    id: 'roe',
    name: 'ROE — Return on Equity',
    formula: 'Net Income ÷ Shareholders\' Equity (average)',
    summary: 'Profit generated per dollar of shareholder capital',
    category: 'profitability',
    definition: `ROE measures how efficiently a company generates profit from the equity shareholders have put in. It's one of Warren Buffett's favorite metrics — he looks for companies that consistently earn 15%+ ROE without excessive leverage.

Importantly, ROE can be inflated by debt (high leverage reduces equity, making ROE look better than the underlying business performance). Always pair ROE with a leverage check. Companies buying back shares heavily will also show rising ROE as equity shrinks. The DuPont decomposition breaks ROE into: Net Margin × Asset Turnover × Financial Leverage — letting you see exactly what's driving returns.`,
    ranges: [
      { sector: 'Software / SaaS', value: '20–50%+', signal: 'green' },
      { sector: 'Consumer Staples (branded)', value: '20–40%', signal: 'green' },
      { sector: 'Semiconductors', value: '15–35%', signal: 'green' },
      { sector: 'Healthcare', value: '15–30%', signal: 'green' },
      { sector: 'IT Hardware', value: '20–60%+', signal: 'green' },
      { sector: 'Retail', value: '10–25%', signal: 'yellow' },
      { sector: 'Industrials', value: '10–20%', signal: 'yellow' },
      { sector: 'Utilities', value: '8–12%', signal: 'yellow' },
    ],
    investorNote: `A consistently high ROE (15%+) over many years without excessive debt is a hallmark of a durable competitive advantage. Beware negative equity from heavy buybacks — it makes ROE mathematically meaningless. Use ROIC as the leverage-neutral companion metric.`,
  },
  {
    id: 'roic',
    name: 'ROIC — Return on Invested Capital',
    formula: 'NOPAT ÷ Invested Capital  (NOPAT = EBIT × (1 − tax rate))',
    summary: 'After-tax return on all capital deployed in the business',
    category: 'profitability',
    definition: `ROIC is widely considered the gold standard return metric because it measures returns on all capital — both debt and equity — on an after-tax operating basis. It strips out financing decisions and shows the pure economic return the business generates.

The critical threshold: if ROIC > WACC (weighted average cost of capital), the company is creating value. If ROIC < WACC, management is destroying value even if earnings are growing. Companies that sustain ROIC well above their cost of capital tend to compound shareholder value at exceptional rates over time. This is why Buffett-style investors obsess over businesses with "wide moats" — moats are just another way of saying sustainably high ROIC.`,
    ranges: [
      { sector: 'Software / SaaS', value: '20–60%+', signal: 'green' },
      { sector: 'Consumer brands / Moats', value: '20–40%', signal: 'green' },
      { sector: 'Semiconductors', value: '15–35%', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '12–25%', signal: 'green' },
      { sector: 'Retail', value: '8–18%', signal: 'yellow' },
      { sector: 'Industrials', value: '8–15%', signal: 'yellow' },
      { sector: 'Telecom / Utilities', value: '4–8%', signal: 'yellow' },
      { sector: 'Airlines / Commodities', value: '2–6%', signal: 'red' },
    ],
    investorNote: `Compare ROIC to WACC (typically 7–10% for US large-caps). ROIC > 15% is excellent. Trending ROIC tells you whether the competitive moat is widening or narrowing over time. McKinsey research shows ROIC is the strongest predictor of long-term stock returns.`,
  },

  // ── RETURNS & EFFICIENCY ──────────────────────────────────
  {
    id: 'roa',
    name: 'ROA — Return on Assets',
    formula: 'Net Income ÷ Total Assets (average)',
    summary: 'Profit generated per dollar of total assets',
    category: 'efficiency',
    definition: `ROA measures how efficiently management deploys the entire asset base — factories, inventory, receivables, cash, IP — to generate profit. It's sector-agnostic in concept but wildly variable in practice: asset-heavy businesses (utilities, industrials) naturally have low ROA, while capital-light businesses (software, marketplaces) can achieve very high ROA.

It also gets distorted by large cash balances (a tech company sitting on $100B cash will have depressed ROA). Use ROA to compare companies within the same sector, and track its trend over time — improving ROA signals management is getting more out of each dollar invested.`,
    ranges: [
      { sector: 'Software / SaaS', value: '10–25%', signal: 'green' },
      { sector: 'Semiconductors', value: '8–20%', signal: 'green' },
      { sector: 'Consumer Staples', value: '5–12%', signal: 'yellow' },
      { sector: 'IT Hardware', value: '4–8%', signal: 'yellow' },
      { sector: 'Retail', value: '4–9%', signal: 'yellow' },
      { sector: 'Auto / Industrial', value: '2–6%', signal: 'yellow' },
      { sector: 'Banks', value: '0.8–1.5%', signal: 'yellow' },
      { sector: 'Utilities', value: '1–3%', signal: 'red' },
    ],
    investorNote: `ROA feeds into the DuPont decomposition (ROA = Net Margin × Asset Turnover) which reveals whether returns are driven by margin or asset efficiency. A high-margin/low-turnover model (luxury) and low-margin/high-turnover model (retail) can both yield good ROA.`,
  },
  {
    id: 'asset-turnover',
    name: 'Asset Turnover',
    formula: 'Revenue ÷ Total Assets (average)',
    summary: 'Revenue generated per dollar of total assets',
    category: 'efficiency',
    definition: `Asset turnover is the efficiency component of ROA. It answers: "how hard are assets working to generate sales?" A turnover of 1.1x means the company generates $1.10 in revenue for every $1 of assets on the balance sheet.

High asset turnover is the hallmark of lean, capital-efficient businesses. Low turnover is normal for asset-heavy industries like utilities or real estate (which compensate with higher margins). In the DuPont model: ROA = Net Margin × Asset Turnover. A company can improve ROA either by improving margins or turning assets faster — knowing which lever management is pulling tells you a lot about the business model.`,
    ranges: [
      { sector: 'Retail', value: '1.5–3.0x', signal: 'green' },
      { sector: 'IT Hardware', value: '0.9–1.4x', signal: 'green' },
      { sector: 'Consumer Staples', value: '0.8–1.2x', signal: 'yellow' },
      { sector: 'Industrials', value: '0.5–0.9x', signal: 'yellow' },
      { sector: 'Software / SaaS', value: '0.4–0.8x', signal: 'yellow' },
      { sector: 'Semiconductors', value: '0.4–0.7x', signal: 'yellow' },
      { sector: 'Utilities', value: '0.2–0.4x', signal: 'red' },
      { sector: 'Real Estate', value: '0.1–0.2x', signal: 'red' },
    ],
    investorNote: `Declining asset turnover over time signals the business is becoming more capital-intensive (often bad), or is building a cash cushion (neutral/good). Use alongside inventory turns and DSO to spot operational bottlenecks.`,
  },
  {
    id: 'inventory-turns',
    name: 'Inventory Turns',
    formula: 'COGS ÷ Average Inventory',
    summary: 'How many times inventory sells and replenishes per year',
    category: 'efficiency',
    definition: `Inventory turns tells you how efficiently a company manages physical stock. 8x means the company cycles through its entire inventory roughly every 45 days. High turns are desirable because inventory sitting in a warehouse is capital tied up earning nothing — it also carries the risk of obsolescence (devastating in tech hardware where product cycles are fast).

Declining turns signal demand weakness, over-stocking, or supply chain mismanagement. Rising turns without margin compression signal operational excellence. The legendary benchmarks are Apple (50–100x) and Toyota's just-in-time manufacturing.`,
    ranges: [
      { sector: 'Retail (grocery)', value: '10–20x', signal: 'green' },
      { sector: 'Consumer Electronics', value: '8–15x', signal: 'green' },
      { sector: 'IT Hardware', value: '6–12x', signal: 'green' },
      { sector: 'Auto', value: '5–9x', signal: 'yellow' },
      { sector: 'Consumer Staples', value: '4–8x', signal: 'yellow' },
      { sector: 'Industrial / Machinery', value: '3–6x', signal: 'yellow' },
      { sector: 'Luxury / Apparel', value: '1–3x', signal: 'red' },
      { sector: 'Software / SaaS', value: 'N/A', signal: 'green' },
    ],
    investorNote: `A sudden drop in inventory turns is one of the earliest warning signals of demand deterioration — companies build stock expecting sales that don't come. Watch this metric closely in earnings previews. Also directly affects the cash conversion cycle.`,
  },
  {
    id: 'dso',
    name: 'DSO — Days Sales Outstanding',
    formula: '(Accounts Receivable ÷ Revenue) × 365',
    summary: 'How long it takes to collect cash from customers',
    category: 'efficiency',
    definition: `DSO measures how long, on average, it takes to collect payment after a sale is made. A high DSO means money is sitting in receivables rather than the bank — essentially an interest-free loan to customers.

This matters because revenue can be booked on paper (accrual accounting) long before cash arrives. A rising DSO can indicate: aggressive revenue recognition, credit quality deterioration in the customer base, or deliberate channel stuffing. In B2B enterprise tech, high DSO is common because large contracts have 30–90 day payment terms. The key is whether DSO is stable or rising.`,
    ranges: [
      { sector: 'Retail (B2C)', value: '1–10 days', signal: 'green' },
      { sector: 'Software / SaaS', value: '30–60 days', signal: 'green' },
      { sector: 'Consumer Staples', value: '20–45 days', signal: 'yellow' },
      { sector: 'IT Hardware (enterprise)', value: '60–95 days', signal: 'yellow' },
      { sector: 'Healthcare / MedTech', value: '50–80 days', signal: 'yellow' },
      { sector: 'Industrials', value: '50–90 days', signal: 'yellow' },
      { sector: 'Construction', value: '70–120 days', signal: 'red' },
      { sector: 'Telecom equipment', value: '80–110 days', signal: 'red' },
    ],
    investorNote: `Compare DSO to DPO (Days Payable Outstanding). If DSO > DPO, the company is funding its customers. If DPO > DSO, the company is being funded by its suppliers (working capital advantage — this is how Dell and Amazon generate cash from negative working capital).`,
  },

  // ── LIQUIDITY & LEVERAGE ──────────────────────────────────
  {
    id: 'current-ratio',
    name: 'Current Ratio',
    formula: 'Current Assets ÷ Current Liabilities',
    summary: 'Can it cover short-term liabilities with short-term assets?',
    category: 'leverage',
    definition: `The current ratio is the most basic solvency check: does the company have enough short-term assets (cash, receivables, inventory) to cover obligations due within 12 months (payables, short-term debt, accrued expenses)? Below 1.0 technically means current liabilities exceed current assets — which sounds alarming but is extremely common and not necessarily dangerous.

Companies with predictable, recurring cash flows (utilities, large-cap tech, retailers) routinely operate below 1.0 because they know cash is coming. What matters is the quality and predictability of cash inflows, not just the balance sheet snapshot. Deferred revenue inflates current liabilities without representing a real cash obligation.`,
    ranges: [
      { sector: 'Pharmaceuticals', value: '2.0–4.0x', signal: 'green' },
      { sector: 'Industrials / Manufacturing', value: '1.5–2.5x', signal: 'green' },
      { sector: 'Software / SaaS', value: '1.5–3.0x', signal: 'green' },
      { sector: 'Consumer Staples', value: '0.8–1.3x', signal: 'yellow' },
      { sector: 'IT Hardware', value: '0.8–1.2x', signal: 'yellow' },
      { sector: 'Retail', value: '0.7–1.2x', signal: 'yellow' },
      { sector: 'Airlines', value: '0.5–0.9x', signal: 'red' },
      { sector: 'Restaurants / Hospitality', value: '0.3–0.8x', signal: 'red' },
    ],
    investorNote: `Never use current ratio in isolation. A ratio of 0.8x for a cash-generative large-cap is fine; 0.8x for a startup with negative FCF is distress. Also check whether current liabilities include meaningful debt maturities or are mostly trade payables (less threatening).`,
  },
  {
    id: 'quick-ratio',
    name: 'Quick Ratio',
    formula: '(Cash + Short-term Investments + Receivables) ÷ Current Liabilities',
    summary: 'Liquidity without relying on inventory liquidation',
    category: 'leverage',
    definition: `The quick ratio is a stricter version of the current ratio — it excludes inventory and prepaid expenses, which are less liquid and harder to convert to cash quickly. The premise: in a stress scenario, can you pay your bills without selling any inventory?

For service businesses and software companies, quick and current ratios are nearly identical (no inventory). For hardware companies, the gap between current and quick ratios reflects how much inventory is in the mix. A quick ratio below 1.0 is more concerning than current ratio below 1.0, but again: context and cash generation are the override.`,
    ranges: [
      { sector: 'Software / SaaS', value: '1.5–3.0x', signal: 'green' },
      { sector: 'Pharmaceuticals', value: '1.5–3.5x', signal: 'green' },
      { sector: 'Consumer Staples', value: '0.5–1.0x', signal: 'yellow' },
      { sector: 'IT Hardware', value: '0.6–1.0x', signal: 'yellow' },
      { sector: 'Retail', value: '0.2–0.6x', signal: 'yellow' },
      { sector: 'Auto', value: '0.5–0.9x', signal: 'yellow' },
      { sector: 'Airlines', value: '0.3–0.7x', signal: 'red' },
      { sector: 'Restaurants', value: '0.1–0.4x', signal: 'red' },
    ],
    investorNote: `More useful than current ratio for asset-heavy businesses. If quick ratio is declining while current ratio holds, it means inventory is building up — a potential red flag. The metric becomes largely irrelevant for SaaS and service businesses.`,
  },
  {
    id: 'interest-coverage',
    name: 'Interest Coverage',
    formula: 'EBIT ÷ Interest Expense',
    summary: 'How comfortably EBIT covers interest payments',
    category: 'leverage',
    definition: `Interest coverage tells you how many times over the company can pay its interest bill from operating profits. It's the key debt safety metric for credit analysts and bond investors. Below 1.5x is distress territory — the company is barely covering interest and any earnings deterioration could trigger a covenant breach or default.

Above 3x is generally considered safe. Above 5x signals comfortable leverage. The metric is particularly important during economic downturns: a company with 8x coverage has a lot of room for earnings to fall before interest payments become threatening.`,
    ranges: [
      { sector: 'Software / SaaS', value: '15–50x (or debt-free)', signal: 'green' },
      { sector: 'Consumer Staples', value: '8–20x', signal: 'green' },
      { sector: 'Healthcare', value: '8–25x', signal: 'green' },
      { sector: 'IT Hardware', value: '4–10x', signal: 'green' },
      { sector: 'Industrials', value: '3–8x', signal: 'yellow' },
      { sector: 'Telecom', value: '2–5x', signal: 'yellow' },
      { sector: 'Utilities', value: '2–4x', signal: 'yellow' },
      { sector: 'Airlines', value: '1–3x', signal: 'red' },
    ],
    investorNote: `Credit agencies use this to assign debt ratings. Equity investors use it to assess downside risk — a company with 2x coverage is far more vulnerable to an earnings miss than one with 10x. EBITDA/interest (used by lenders) is higher than EBIT/interest (preferred by credit analysts — more conservative).`,
  },
  {
    id: 'net-debt-ebitda',
    name: 'Net Debt / EBITDA',
    formula: '(Total Debt − Cash) ÷ EBITDA',
    summary: 'Years of earnings needed to pay off net debt',
    category: 'leverage',
    definition: `This is the most widely used leverage ratio by corporate finance professionals, M&A analysts, and private equity. It expresses debt burden in terms of earnings power — "how many years of EBITDA would it take to pay off all net debt?"

It accounts for the cash cushion (net vs. gross debt): a company with $10B debt and $9B cash is in a very different position from one with $10B debt and $500M cash. EBITDA is used as the denominator as a proxy for operating cash flow. 1.0x means the company could theoretically pay off all debt in one year of full earnings.`,
    ranges: [
      { sector: 'Software / SaaS (net cash)', value: 'Negative (net cash)', signal: 'green' },
      { sector: 'Consumer Staples', value: '1.0–2.5x', signal: 'green' },
      { sector: 'IT Hardware', value: '0.5–2.0x', signal: 'green' },
      { sector: 'Pharmaceuticals', value: '1.5–3.5x', signal: 'yellow' },
      { sector: 'Industrials', value: '2.0–3.5x', signal: 'yellow' },
      { sector: 'Telecom', value: '2.5–4.0x', signal: 'yellow' },
      { sector: 'Utilities', value: '4.0–6.0x', signal: 'yellow' },
      { sector: 'PE-backed / LBO', value: '5.0–8.0x', signal: 'red' },
    ],
    investorNote: `The go-to leverage metric in LBO analysis, credit research, and valuation. Investment-grade companies typically stay below 3x. Above 4x is speculative territory. Lenders often set covenant triggers at 4–5x. In a rising rate environment, high leverage becomes disproportionately punishing.`,
  },

  // ── VALUATION ─────────────────────────────────────────────
  {
    id: 'pe',
    name: 'P/E — Price-to-Earnings',
    formula: 'Share Price ÷ EPS  (or Market Cap ÷ Net Income)',
    summary: 'How many dollars you pay per dollar of earnings',
    category: 'valuation',
    definition: `The P/E ratio is the most widely quoted valuation metric. It tells you how many years of current earnings you're paying for the stock. A P/E of 20x means you're paying $20 for every $1 of annual earnings — if earnings stay flat, it would take 20 years to earn back your investment through earnings alone.

P/E is affected by growth rate, interest rates, and earnings quality. High-growth companies justifiably trade at high P/E (you're paying for future earnings, not current). Low-growth, stable businesses trade at lower multiples. During low interest rate environments, P/E multiples expand across the board. Always check whether earnings are "clean" — non-recurring items, stock comp adjustments, and tax rate changes can distort reported EPS significantly.`,
    ranges: [
      { sector: 'High-growth tech / SaaS', value: '30–80x+', signal: 'yellow' },
      { sector: 'Semiconductors (cyclical peak)', value: '15–30x', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '15–25x', signal: 'green' },
      { sector: 'Consumer Staples', value: '18–28x', signal: 'green' },
      { sector: 'S&P 500 average (historical)', value: '15–20x', signal: 'green' },
      { sector: 'Industrials', value: '12–20x', signal: 'green' },
      { sector: 'Financials / Banks', value: '8–14x', signal: 'yellow' },
      { sector: 'Utilities', value: '12–18x', signal: 'yellow' },
    ],
    investorNote: `P/E alone is meaningless without growth context. Use PEG ratio (P/E ÷ growth rate) to normalize for growth. Forward P/E (based on next twelve months estimates) is more useful than trailing P/E for fast-growing companies. Compare to the company's own historical P/E range to gauge relative value.`,
  },
  {
    id: 'ps',
    name: 'P/S — Price-to-Sales',
    formula: 'Market Cap ÷ Revenue  (or Share Price ÷ Revenue per Share)',
    summary: 'Valuation relative to top-line revenue',
    category: 'valuation',
    definition: `P/S is used when a company has no earnings (startups, high-growth companies reinvesting everything) or when earnings are temporarily distorted. It's a cruder metric than P/E because revenue doesn't account for profitability — a company with $1B revenue and 80% gross margin is worth far more than one with $1B revenue and 10% margin.

P/S multiples exploded during the 2020–2021 tech bubble (many SaaS companies traded at 30–50x sales) and compressed sharply as rates rose. P/S is most useful for comparing companies within the same industry at similar growth rates and margin profiles.`,
    ranges: [
      { sector: 'High-growth SaaS (>30% rev growth)', value: '8–20x', signal: 'yellow' },
      { sector: 'Mid-growth SaaS (15–30%)', value: '4–10x', signal: 'yellow' },
      { sector: 'Mature software', value: '3–7x', signal: 'green' },
      { sector: 'Healthcare / Biotech', value: '3–8x', signal: 'yellow' },
      { sector: 'Semiconductors', value: '4–10x', signal: 'yellow' },
      { sector: 'Consumer brands', value: '1–3x', signal: 'green' },
      { sector: 'Retail', value: '0.2–0.8x', signal: 'green' },
      { sector: 'IT Hardware', value: '0.3–1.0x', signal: 'green' },
    ],
    investorNote: `Rule of 40 for SaaS: if Revenue Growth % + FCF Margin % ≥ 40, the business is healthy. P/S should be compared alongside the Rule of 40 score. A 10x P/S with Rule of 40 = 60 may be cheap; 10x P/S with Rule of 40 = 20 is expensive.`,
  },
  {
    id: 'ev-ebitda',
    name: 'EV / EBITDA',
    formula: 'Enterprise Value ÷ EBITDA  (EV = Market Cap + Debt − Cash)',
    summary: 'Capital-structure-neutral operational valuation',
    category: 'valuation',
    definition: `EV/EBITDA is the workhorse of professional valuation — investment bankers, private equity, and M&A analysts use it to value businesses because it's capital-structure-neutral (accounts for debt). Enterprise Value represents the total cost to acquire the company outright (buy the equity, pay off the debt, keep the cash).

EBITDA is used as a proxy for operational cash generation (before financing costs, taxes, and non-cash charges). Because EV includes debt, you're comparing apples-to-apples across companies with different leverage profiles. It's also sector-agnostic — you can compare a leveraged buyout candidate to a debt-free peer.`,
    ranges: [
      { sector: 'Software / SaaS', value: '20–50x', signal: 'yellow' },
      { sector: 'Semiconductors', value: '15–30x', signal: 'green' },
      { sector: 'Healthcare / Pharma', value: '12–20x', signal: 'green' },
      { sector: 'Consumer Staples', value: '12–18x', signal: 'green' },
      { sector: 'S&P 500 median', value: '12–15x', signal: 'green' },
      { sector: 'Industrials', value: '9–14x', signal: 'green' },
      { sector: 'Retail', value: '6–12x', signal: 'green' },
      { sector: 'Telecom / Utilities', value: '6–10x', signal: 'yellow' },
    ],
    investorNote: `EV/EBITDA is the most common metric in M&A comparable company analysis. A company trading at a significant discount to sector peers on EV/EBITDA may be a value opportunity — or a value trap (check why it's cheap). Also watch EV/EBIT (more conservative, includes D&A which is a real cost in capex-heavy industries).`,
  },
  {
    id: 'pfcf',
    name: 'P/FCF — Price-to-Free-Cash-Flow',
    formula: 'Market Cap ÷ Free Cash Flow',
    summary: 'How much you pay per dollar of real cash generated',
    category: 'valuation',
    definition: `P/FCF is arguably the most honest valuation multiple because free cash flow is the hardest number to manipulate. Unlike earnings, which can be dressed up through accounting choices, cash either hits the bank account or it doesn't.

P/FCF is Warren Buffett's preferred lens — he famously looks for businesses where you can buy a dollar of future earnings for 50 cents. FCF yield (the inverse: FCF ÷ Market Cap) expresses what percentage return you get in cash per year at the current price. A 5% FCF yield is equivalent to a 20x P/FCF.`,
    ranges: [
      { sector: 'Software / SaaS (high growth)', value: '30–60x', signal: 'yellow' },
      { sector: 'Software / SaaS (mature)', value: '20–35x', signal: 'green' },
      { sector: 'Semiconductors', value: '15–30x', signal: 'green' },
      { sector: 'Consumer Staples', value: '20–30x', signal: 'green' },
      { sector: 'S&P 500 median', value: '18–25x', signal: 'green' },
      { sector: 'IT Hardware', value: '12–20x', signal: 'green' },
      { sector: 'Industrials', value: '15–25x', signal: 'green' },
      { sector: 'Banks / Financials', value: 'N/A (use P/E or P/B)', signal: 'yellow' },
    ],
    investorNote: `FCF yield > 5% (P/FCF < 20x) is generally considered attractively valued in today's market. Compare FCF yield to the 10-year treasury yield — if the gap is narrow, stocks may be overvalued on a risk-adjusted basis. Also check if FCF is growing: a 20x P/FCF growing 20% annually is cheap; 20x on declining FCF is a trap.`,
  },

  // ── GROWTH ────────────────────────────────────────────────
  {
    id: 'revenue-growth',
    name: 'Revenue Growth Rate',
    formula: '(Current Period Revenue − Prior Period Revenue) ÷ Prior Period Revenue',
    summary: 'Year-over-year top-line expansion (or contraction)',
    category: 'growth',
    definition: `Revenue growth is the most fundamental indicator of business momentum. It tells you whether the company is winning new customers, expanding in existing accounts, or losing ground. Sustainable organic revenue growth (not driven by acquisitions) is the clearest signal that a product or service is in demand.

Watch for the quality of growth: organic vs. acquisition-driven, volume vs. price increases, geographic mix. Also monitor deceleration — a company growing at 40% that guided to 30% is decelerating, which valuation multiples will punish even if 30% is objectively fast. For cyclical industries, compare to the industry growth rate to assess market share gains.`,
    ranges: [
      { sector: 'Hyper-growth startups', value: '50–100%+', signal: 'green' },
      { sector: 'High-growth SaaS / Cloud', value: '20–50%', signal: 'green' },
      { sector: 'Emerging market consumer', value: '15–25%', signal: 'green' },
      { sector: 'Semiconductors (upcycle)', value: '10–30%', signal: 'green' },
      { sector: 'S&P 500 average', value: '5–10%', signal: 'yellow' },
      { sector: 'Mature / GDP-linked', value: '2–5%', signal: 'yellow' },
      { sector: 'Utilities / Telecom', value: '1–3%', signal: 'yellow' },
      { sector: 'Secular decline', value: '<0%', signal: 'red' },
    ],
    investorNote: `Consistently compare to management guidance and analyst estimates — beats vs. misses drive near-term stock price. For SaaS companies, watch ARR (Annual Recurring Revenue) growth and Net Revenue Retention (NRR > 120% signals strong expansion within the existing customer base).`,
  },
  {
    id: 'eps-growth',
    name: 'EPS Growth',
    formula: '(Current EPS − Prior EPS) ÷ |Prior EPS|',
    summary: 'Per-share earnings expansion — the key P/E driver',
    category: 'growth',
    definition: `EPS growth is the primary driver of stock price appreciation over the long run. In its simplest form: if EPS doubles, a stock trading at the same multiple will also double. The two levers are earnings growth and multiple expansion (re-rating) — the best stocks deliver both.

Distinguish between organic EPS growth (margin expansion, revenue growth) and financial engineering (buybacks reducing share count, debt leverage amplifying returns). A company shrinking share count 5% per year mechanically grows EPS 5% even if net income is flat. Both can be legitimate, but sustainable earnings quality comes from the operating business, not financial engineering.`,
    ranges: [
      { sector: 'High-growth tech', value: '20–50%+', signal: 'green' },
      { sector: 'Compounders (MSFT, AAPL era)', value: '15–25%', signal: 'green' },
      { sector: 'S&P 500 long-run average', value: '7–10%', signal: 'yellow' },
      { sector: 'Mature large-cap', value: '5–12%', signal: 'yellow' },
      { sector: 'Value / cyclical', value: '0–8%', signal: 'yellow' },
      { sector: 'Turnarounds', value: 'Highly variable', signal: 'yellow' },
      { sector: 'Declining businesses', value: '<0%', signal: 'red' },
      { sector: 'Deep value traps', value: 'Negative, no catalyst', signal: 'red' },
    ],
    investorNote: `The PEG ratio (P/E ÷ EPS growth rate) normalizes valuation for growth. PEG < 1.0 is traditionally considered cheap (Peter Lynch's rule of thumb). A stock with P/E = 25x and 25% EPS growth (PEG = 1.0) is more attractive than P/E = 15x with 5% growth (PEG = 3.0).`,
  },
];

const CATEGORIES = [
  { key: 'profitability', label: 'Profitability', color: '#10b981' },
  { key: 'efficiency', label: 'Returns & Efficiency', color: '#6366f1' },
  { key: 'leverage', label: 'Liquidity & Leverage', color: '#f59e0b' },
  { key: 'valuation', label: 'Valuation Multiples', color: '#3b82f6' },
  { key: 'growth', label: 'Growth Metrics', color: '#8b5cf6' },
];

const SIGNAL_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function StocksGlossary() {
  const [openAll, setOpenAll] = useState(false);

  return (
    <div className="page-wrap">
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
          Stock Ratios — Investor Reference
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>
          Financial ratios explained in depth — what they measure, how to use them, and what's healthy across industries.
        </p>
      </div>

      {/* Signal legend */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 20, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.7px', textTransform: 'uppercase' }}>
        {(['green', 'yellow', 'red'] as const).map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: SIGNAL_COLORS[s] }} />
            {s === 'green' ? 'Healthy / above average' : s === 'yellow' ? 'Acceptable / watch' : 'Weak / concern'}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[{ label: 'Expand all', val: true }, { label: 'Collapse all', val: false }].map(({ label, val }) => (
          <button
            key={label}
            onClick={() => setOpenAll(val)}
            style={{
              fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.8px',
              textTransform: 'uppercase', background: 'var(--bg-card)',
              border: '1px solid var(--border)', color: 'var(--text-muted)',
              borderRadius: 5, padding: '5px 14px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-h)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {label}
          </button>
        ))}
      </div>

      {CATEGORIES.map(cat => (
        <section key={cat.key} style={{ marginBottom: 48 }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            fontFamily: 'system-ui', fontWeight: 700, fontSize: 11,
            letterSpacing: '2px', textTransform: 'uppercase', color: cat.color,
          }}>
            {cat.label}
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {RATIOS.filter(r => r.category === cat.key).map(ratio => (
            <RatioAccordionControlled key={ratio.id} ratio={ratio} forceOpen={openAll} />
          ))}
        </section>
      ))}
    </div>
  );
}

function RatioAccordionControlled({ ratio, forceOpen }: { ratio: RatioCard; forceOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORIES.find(c => c.key === ratio.category)!;

  const isOpen = open || forceOpen;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isOpen ? cat.color + '50' : 'var(--border)'}`,
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 18px 12px', display: 'flex', alignItems: 'center',
          gap: 12, textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', whiteSpace: 'nowrap' }}>
            {ratio.name}
          </span>
          {ratio.formula && (
            <span style={{
              fontSize: 10, color: cat.color,
              background: cat.color + '15',
              border: `1px solid ${cat.color}35`,
              borderRadius: 4, padding: '2px 7px',
              fontFamily: 'monospace',
            }}>
              {ratio.formula}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 14, color: 'var(--text-muted)',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.22s', flexShrink: 0,
        }}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '14px 0 18px', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
            {ratio.definition}
          </p>

          <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            Sector benchmarks
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
            {ratio.ranges.map(r => (
              <div key={r.sector} style={{
                background: 'var(--bg-card2)',
                borderRadius: 6, padding: '8px 10px',
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                  {r.sector}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: SIGNAL_COLORS[r.signal], flexShrink: 0,
                  }} />
                  {r.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            padding: '10px 14px',
            background: 'rgba(96,165,250,0.07)',
            borderLeft: '2px solid #60a5fa',
            borderRadius: '0 6px 6px 0',
            fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.65,
          }}>
            <strong style={{ color: '#60a5fa' }}>How investors use it: </strong>
            {ratio.investorNote}
          </div>
        </div>
      )}
    </div>
  );
}
