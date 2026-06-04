import { useState } from 'react';

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

interface ChainRow {
  strike: number;
  call: { bid: number; ask: number; last: number; iv: number; delta: number; oi: number; vol: number };
  put:  { bid: number; ask: number; last: number; iv: number; delta: number; oi: number; vol: number };
}

const chainData: ChainRow[] = [
  {
    strike: 85,
    call: { bid: 15.20, ask: 15.50, last: 15.35, iv: 32, delta: 0.94, oi: 310, vol: 45 },
    put:  { bid: 0.15, ask: 0.20, last: 0.18, iv: 38, delta: -0.06, oi: 890, vol: 120 },
  },
  {
    strike: 90,
    call: { bid: 10.30, ask: 10.60, last: 10.45, iv: 30, delta: 0.87, oi: 520, vol: 88 },
    put:  { bid: 0.35, ask: 0.45, last: 0.40, iv: 36, delta: -0.13, oi: 1240, vol: 210 },
  },
  {
    strike: 95,
    call: { bid: 5.80, ask: 6.00, last: 5.90, iv: 28, delta: 0.72, oi: 1800, vol: 340 },
    put:  { bid: 0.90, ask: 1.05, last: 0.97, iv: 33, delta: -0.28, oi: 2100, vol: 480 },
  },
  {
    strike: 100,
    call: { bid: 2.40, ask: 2.60, last: 2.50, iv: 26, delta: 0.51, oi: 4200, vol: 1850 },
    put:  { bid: 2.30, ask: 2.50, last: 2.40, iv: 28, delta: -0.49, oi: 3900, vol: 1620 },
  },
  {
    strike: 105,
    call: { bid: 0.75, ask: 0.90, last: 0.82, iv: 27, delta: 0.27, oi: 3100, vol: 920 },
    put:  { bid: 5.60, ask: 5.85, last: 5.72, iv: 32, delta: -0.73, oi: 680, vol: 105 },
  },
  {
    strike: 110,
    call: { bid: 0.20, ask: 0.30, last: 0.25, iv: 29, delta: 0.10, oi: 1750, vol: 440 },
    put:  { bid: 10.10, ask: 10.40, last: 10.25, iv: 34, delta: -0.90, oi: 390, vol: 52 },
  },
  {
    strike: 115,
    call: { bid: 0.05, ask: 0.10, last: 0.07, iv: 31, delta: 0.04, oi: 820, vol: 110 },
    put:  { bid: 14.90, ask: 15.20, last: 15.05, iv: 39, delta: -0.96, oi: 180, vol: 25 },
  },
];

const SPOT = 100;

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

const columnDescriptions: Record<string, string> = {
  Bid: 'The highest price a buyer is currently willing to pay. You can sell at this price immediately.',
  Ask: 'The lowest price a seller will accept. You can buy at this price immediately. Trade near the mid-price to reduce slippage.',
  Last: 'The price of the most recent trade. May be stale if the option is illiquid — always look at Bid/Ask.',
  'IV%': 'Implied Volatility for this specific contract. Notice how OTM puts have higher IV than OTM calls — this is the volatility skew.',
  Delta: 'Approximate probability the option expires in the money, and also the $ change per $1 stock move. Call delta is positive, put delta is negative.',
  OI: 'Open Interest — total outstanding contracts. High OI strikes often act as price magnets near expiry (max pain concept).',
  Vol: 'Volume today — contracts traded this session. Vol >> OI may signal fresh positioning rather than closing trades.',
};

export function OptionsChain() {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, text: '', x: 0, y: 0 });

  const showTip = (text: string, e: React.MouseEvent) => {
    setTooltip({ visible: true, text, x: e.clientX, y: e.clientY });
  };
  const hideTip = () => setTooltip((t) => ({ ...t, visible: false }));

  const th = (label: string, align: 'left' | 'right' | 'center' = 'right') => (
    <th
      key={label}
      onMouseEnter={(e) => showTip(columnDescriptions[label] ?? '', e)}
      onMouseLeave={hideTip}
      style={{
        padding: '8px 10px',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textAlign: align,
        cursor: columnDescriptions[label] ? 'help' : 'default',
        borderBottom: columnDescriptions[label] ? '1px dashed var(--border)' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {label}{columnDescriptions[label] ? ' ⓘ' : ''}
    </th>
  );

  const fmt = (v: number, decimals = 2) => v.toFixed(decimals);

  return (
    <div className="page-wrap" style={{ maxWidth: 1100 }}>
      {/* Tooltip */}
      {tooltip.visible && tooltip.text && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y + 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          maxWidth: 260,
          fontSize: 12,
          color: 'var(--text)',
          lineHeight: 1.5,
          zIndex: 100,
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {tooltip.text}
        </div>
      )}

      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        Reading an Options Chain
      </h1>
      <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        An options chain displays all available contracts for a given underlying and expiry. Calls are on the left, puts on the right, strikes in the middle. Hover over any column header to see what it means. ITM rows are highlighted to help you quickly identify moneyness.
      </p>

      {/* Stock info bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 20px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-h)' }}>XYZ</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>@ $100.00</span>
        </div>
        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Expiry: <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>Jun 20</span></div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>DTE: <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>21</span></div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>IV: <span style={{ color: '#f59e0b', fontWeight: 500 }}>26%</span></div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 8px', background: '#10b98118', borderRadius: 4, color: '#10b981' }}>ITM Call</span>
          <span style={{ padding: '3px 8px', background: '#6366f118', borderRadius: 4, color: '#6366f1' }}>ATM</span>
          <span style={{ padding: '3px 8px', background: '#ef444418', borderRadius: 4, color: '#ef4444' }}>ITM Put</span>
        </div>
      </div>

      {/* Chain table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto', marginBottom: 40 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th colSpan={7} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#10b981', textAlign: 'center', background: '#10b98108', borderRight: '2px solid var(--border)', letterSpacing: '0.08em' }}>
                CALLS
              </th>
              <th style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textAlign: 'center', background: 'var(--bg)' }}>
                STRIKE
              </th>
              <th colSpan={7} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#ef4444', textAlign: 'center', background: '#ef444408', borderLeft: '2px solid var(--border)', letterSpacing: '0.08em' }}>
                PUTS
              </th>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Vol', 'OI', 'Delta', 'IV%', 'Last', 'Ask', 'Bid'].map((h) => th(h))}
              <th style={{ padding: '8px 16px', textAlign: 'center', fontSize: 11, color: '#475569', background: 'var(--bg)' }}></th>
              {['Bid', 'Ask', 'Last', 'IV%', 'Delta', 'OI', 'Vol'].map((h) => th(h))}
            </tr>
          </thead>
          <tbody>
            {chainData.map((row) => {
              const isAtm = row.strike === SPOT;
              const callItm = row.strike < SPOT;
              const putItm = row.strike > SPOT;
              const rowBg = isAtm
                ? '#6366f110'
                : callItm
                ? '#10b98108'
                : 'transparent';
              const putBg = isAtm
                ? '#6366f110'
                : putItm
                ? '#ef444408'
                : 'transparent';

              return (
                <tr
                  key={row.strike}
                  style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#ffffff08')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace', background: rowBg }}>{row.call.vol.toLocaleString()}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', background: rowBg }}>{row.call.oi.toLocaleString()}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: '#10b981', fontFamily: 'monospace', background: rowBg }}>{fmt(row.call.delta, 2)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: '#f59e0b', fontFamily: 'monospace', background: rowBg }}>{row.call.iv}%</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', background: rowBg }}>{fmt(row.call.last)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text-h)', fontFamily: 'monospace', background: rowBg }}>{fmt(row.call.ask)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', background: rowBg, borderRight: '2px solid var(--border)' }}>{fmt(row.call.bid)}</td>

                  <td style={{
                    padding: '9px 16px',
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: isAtm ? '#6366f1' : 'var(--text-h)',
                    background: isAtm ? '#6366f120' : 'var(--bg)',
                    borderLeft: '2px solid var(--border)',
                    borderRight: '2px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    {row.strike}{isAtm ? ' ★' : ''}
                  </td>

                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', background: putBg, borderLeft: '2px solid var(--border)' }}>{fmt(row.put.bid)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text-h)', fontFamily: 'monospace', background: putBg }}>{fmt(row.put.ask)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', background: putBg }}>{fmt(row.put.last)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: '#f59e0b', fontFamily: 'monospace', background: putBg }}>{row.put.iv}%</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: '#ef4444', fontFamily: 'monospace', background: putBg }}>{fmt(row.put.delta, 2)}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text)', fontFamily: 'monospace', background: putBg }}>{row.put.oi.toLocaleString()}</td>
                  <td style={{ padding: '9px 10px', textAlign: 'right', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace', background: putBg }}>{row.put.vol.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Key things to look for */}
      <section>
        <SectionHeader title="Key Things to Look For" color="#6366f1" />
        <div className="g-2" style={{ gap: 16 }}>
          {[
            {
              title: 'Bid-Ask Spread Quality',
              color: '#10b981',
              text: 'A tight bid-ask spread (e.g., $2.40/$2.60 = $0.20 wide) means you\'re not giving away much on entry. A $0.05/$0.40 spread means you\'re immediately down 35 cents the moment you enter. Avoid illiquid options — trade where the spread is less than 10% of the mid-price.',
            },
            {
              title: 'OI vs Volume',
              color: '#6366f1',
              text: 'High Open Interest at a strike ($100 here has 4,200 calls OI) signals institutional activity and acts as a price magnet near expiry — this is the "max pain" level. When Volume exceeds OI significantly, it likely represents fresh directional positioning (someone is making a new bet), not closing trades.',
            },
            {
              title: 'IV Skew Across Strikes',
              color: '#f59e0b',
              text: 'Notice how the $85 put has IV of 38% while the $115 call is only 31%. This put skew is normal for equities — downside protection is more in demand. If skew is unusually steep (OTM puts >> ATM), the market is pricing in crash risk. Traders exploit this by selling overpriced OTM puts when IVR is high.',
            },
            {
              title: 'Where the Big OI Is (Max Pain)',
              color: '#ef4444',
              text: 'The $100 strike has 4,200 call OI and 3,900 put OI — by far the highest. This is the "max pain" strike, the price at which the most open options expire worthless. In the final week before expiry, some traders believe market makers exert gravitational pull toward this level. It\'s not a reliable timing tool but worth watching.',
            },
          ].map(({ title, color, text }) => (
            <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color, marginBottom: 8 }}>{title}</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
