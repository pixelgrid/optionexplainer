import { useNavigate } from 'react-router-dom';

interface Tool {
  to: string;
  name: string;
  desc: string;
  tag?: string;
  tagColor?: string;
}

const OPTIONS_TOOLS: { group: string; color: string; tools: Tool[] }[] = [
  {
    group: 'Strategies & Guides',
    color: '#6366f1',
    tools: [
      { to: '/strategies', name: 'Strategy Library', desc: '47 options strategies with live P&L charts — long calls to iron condors.' },
      { to: '/wheel', name: 'The Wheel', desc: 'Step-by-step guide to the cash-secured put → covered call cycle.' },
      { to: '/pmcc', name: "Poor Man's Covered Call", desc: 'LEAPS + short call strategy for leveraged income with less capital.' },
      { to: '/risk', name: 'Risk Management', desc: 'Position sizing, stop losses, and portfolio-level options risk.' },
      { to: '/mistakes', name: 'Common Mistakes', desc: 'The most costly errors new options traders make and how to avoid them.' },
    ],
  },
  {
    group: 'Concepts',
    color: '#3b82f6',
    tools: [
      { to: '/greeks', name: 'The Greeks', desc: 'Delta, gamma, theta, vega, rho — what they mean and how to use them.' },
      { to: '/pricing', name: 'Options Pricing', desc: 'Black-Scholes model, intrinsic vs time value, and what drives premium.' },
      { to: '/volatility', name: 'IV & Volatility', desc: 'Implied vs historical vol, IV rank, IV percentile, and term structure.' },
      { to: '/options-chain', name: 'Options Chain', desc: 'How to read a chain, open interest, bid-ask spread, and strike selection.' },
      { to: '/lifecycle', name: 'Trade Lifecycle', desc: 'From entry to expiration — exercise, assignment, and early exercise risk.' },
      { to: '/earnings', name: 'Earnings Playbook', desc: 'IV crush mechanics, straddle pricing, and how to trade around earnings.' },
    ],
  },
  {
    group: 'Advanced',
    color: '#8b5cf6',
    tools: [
      { to: '/vrp', name: 'Volatility Risk Premium', desc: 'Harvesting the spread between implied and realized vol systematically.' },
      { to: '/dte45', name: '45/21 DTE System', desc: 'The tastytrade framework for managing short premium by days to expiry.' },
      { to: '/vix-regime', name: 'VIX Regime Trading', desc: 'Adjusting strategy and sizing based on current volatility regime.' },
      { to: '/dispersion', name: 'Dispersion Trading', desc: 'Selling index vol vs buying single-stock vol to capture correlation risk.' },
      { to: '/gamma-scalping', name: 'Gamma Scalping', desc: 'Delta-hedging a long gamma position to extract realized volatility.' },
      { to: '/put-write', name: 'Systematic Put-Write', desc: 'Institutional-grade put-selling with rules-based strike and size.' },
    ],
  },
];

const STOCK_TOOLS: Tool[] = [
  { to: '/financials', name: 'Financial Statements', desc: 'Income, balance sheet, cash flow with auto-detected flags, computed ratios, Piotroski F-Score, and Altman Z-Score.', tag: 'AV · 3 calls', tagColor: '#6366f1' },
  { to: '/earnings-history', name: 'Earnings Surprises', desc: 'Historical EPS beat/miss chart, beat rate, streak counter, and quarterly detail table.', tag: 'AV · 1 call', tagColor: '#10b981' },
  { to: '/valuation', name: 'Valuation Snapshot', desc: 'Full ratio dashboard — PE, PB, PS, PEG, EV/EBITDA, margins, analyst target, 52-week range.', tag: 'AV · 2 calls', tagColor: '#3b82f6' },
  { to: '/dcf', name: 'DCF Calculator', desc: 'Interactive 5-year discounted cash flow model with sensitivity table and margin of safety.', tag: 'AV · 2 calls', tagColor: '#f59e0b' },
  { to: '/dividends', name: 'Dividend Safety', desc: 'Payout ratio, FCF coverage, Safe/Watch/At Risk badge, and annual dividend history chart.', tag: 'AV · 3 calls', tagColor: '#10b981' },
];

function ToolCard({ tool, accent }: { tool: Tool; accent: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(tool.to)}
      style={{
        background: '#1a1d27',
        border: `1px solid #2a2d3e`,
        borderRadius: 12,
        padding: '16px 18px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s',
        width: '100%',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = accent;
        (e.currentTarget as HTMLButtonElement).style.background = '#1f2335';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2d3e';
        (e.currentTarget as HTMLButtonElement).style.background = '#1a1d27';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{tool.name}</div>
        {tool.tag && (
          <span style={{ background: (tool.tagColor ?? accent) + '20', color: tool.tagColor ?? accent, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.03em' }}>
            {tool.tag}
          </span>
        )}
      </div>
      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{tool.desc}</div>
    </button>
  );
}

export function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h1 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Option<span style={{ color: '#6366f1' }}>IQ</span>
        </h1>
        <p style={{ margin: '0 auto 28px', color: '#64748b', fontSize: 'clamp(14px, 2vw, 17px)', maxWidth: 560, lineHeight: 1.6 }}>
          A free toolkit for options traders — strategy education, volatility analysis, and fundamental stock research, all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/strategies')}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Options Tools →
          </button>
          <button onClick={() => navigate('/financials')}
            style={{ background: 'none', color: '#94a3b8', border: '1px solid #2a2d3e', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Stock Research →
          </button>
        </div>
      </div>

      {/* ── OPTIONS SECTION ── */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 5, height: 32, borderRadius: 3, background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }} />
          <div>
            <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 26, fontWeight: 700 }}>Options</h2>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{OPTIONS_TOOLS.reduce((s, g) => s + g.tools.length, 0)} tools across strategies, concepts, and advanced techniques</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 28 }}>
          {OPTIONS_TOOLS.map(group => (
            <div key={group.group}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: group.color }} />
                <span style={{ color: group.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{group.group}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {group.tools.map(tool => (
                  <ToolCard key={tool.to} tool={tool} accent={group.color} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #2a2d3e, transparent)', marginBottom: 56 }} />

      {/* ── STOCK SECTION ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 5, height: 32, borderRadius: 3, background: 'linear-gradient(180deg, #10b981, #3b82f6)' }} />
          <div>
            <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 26, fontWeight: 700 }}>Stock Research</h2>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Fundamental analysis tools powered by Alpha Vantage — requires a free API key</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {STOCK_TOOLS.map(tool => (
            <ToolCard key={tool.to} tool={tool} accent="#10b981" />
          ))}
        </div>

        <div style={{ marginTop: 16, background: '#10b98110', border: '1px solid #10b98130', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ color: '#10b981', fontSize: 16, flexShrink: 0 }}>ⓘ</span>
          <div style={{ color: '#64748b', fontSize: 13 }}>
            Stock tools use the <strong style={{ color: '#e2e8f0' }}>Alpha Vantage free tier</strong> (25 calls/day, no credit card).
            Your API key is saved locally in the browser and shared across all stock tools.
            Get a free key at <strong style={{ color: '#e2e8f0' }}>alphavantage.co/support/#api-key</strong>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 64, textAlign: 'center', color: '#334155', fontSize: 12 }}>
        <button onClick={() => navigate('/glossary')}
          style={{ background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', marginRight: 20 }}>
          Options Glossary
        </button>
        Built for independent traders · Free forever
      </div>
    </div>
  );
}
