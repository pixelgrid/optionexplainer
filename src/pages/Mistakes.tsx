
interface Mistake {
  num: number;
  title: string;
  what: string;
  avoid: string;
  severity: 'high' | 'medium';
}

const mistakes: Mistake[] = [
  {
    num: 1,
    title: 'Buying Cheap OTM Options — "Lottery Tickets"',
    severity: 'high',
    what: 'That $0.10 call on a $100 stock looks like free money — a 10× potential return! But you need the stock to move dramatically AND do it quickly. You\'re fighting both delta (the option barely moves) and theta (it\'s losing value every day). Studies show OTM buyers lose money roughly 75–80% of the time. The house always wins on lottery tickets.',
    avoid: 'Buy options with 0.30+ delta and 30–60 DTE minimum. If you want leverage, buy ITM or ATM options where you at least have delta working for you. Better yet, use debit spreads to reduce your IV exposure.',
  },
  {
    num: 2,
    title: 'Ignoring IV Rank — Buying Expensive Options',
    severity: 'high',
    what: 'You buy a call on a stock that looks ready to move. What you didn\'t check: IV Rank is 85. The option is priced for maximum uncertainty. Even if you\'re right about direction, IV will likely decline, creating a headwind that partially offsets your directional gain. You\'re buying insurance at the highest possible price.',
    avoid: 'Always check IVR before buying options. For buying strategies, target IVR below 25. For selling strategies, target IVR above 50. Tools like tastytrade, ThinkorSwim, or Market Chameleon show IVR on every ticker.',
  },
  {
    num: 3,
    title: 'Holding Short Options Through Expiration',
    severity: 'high',
    what: 'You\'ve been right all month — your short put is safely OTM with 1 DTE. You decide to hold for the last few cents of theta. Then in the last 30 minutes of trading, a headline drops, the stock crashes 3%, and you\'re suddenly deep ITM. Gamma is enormous near expiry — small moves become huge P&L swings. Assignment can happen over the weekend without warning.',
    avoid: 'Have a hard rule: close short options at 1–2 DTE unless they\'re so far OTM that assignment is essentially impossible. The few extra dollars of theta are never worth the risk of an unexpected assignment.',
  },
  {
    num: 4,
    title: 'No Exit Plan — Entering Without Rules',
    severity: 'high',
    what: 'You buy a call, it doubles. Exciting! But do you hold for a 3×? Take profit now? If the stock reverses and it gives back half, do you sell? Without rules, you\'ll make emotional decisions. You\'ll hold winners too long (greed) and close losers too early (fear) — the exact opposite of what successful traders do.',
    avoid: 'Before entering any trade, write down: (1) Your profit target, (2) Your max loss trigger, (3) Your time stop (close by X days regardless). Literally write these down before you press the button. Then honor them.',
  },
  {
    num: 5,
    title: 'Overleveraging — Sizing Too Large',
    severity: 'high',
    what: 'A string of winners makes you confident. You size up to 10% of your account on a single trade. The trade works, you made a huge gain. Then the next big trade goes wrong and wipes out the last 3 months of smaller wins plus more. One oversized loss can psychologically destroy a trader even when they were "right" about the direction just too early.',
    avoid: 'Enforce the 1–2% rule on every single trade, no exceptions. The compounding math is brutal: a 25% loss requires a 33% gain to recover. A 50% loss requires a 100% gain. Never let a single position be able to meaningfully damage your account.',
  },
  {
    num: 6,
    title: 'Trading Illiquid Options — The Hidden Tax',
    severity: 'medium',
    what: 'You find a stock with a huge options play. You buy the call for $0.30 (ask). The bid is $0.05. The bid-ask spread is $0.25 — you\'re already down 83% the moment you buy. Even if you\'re right about direction, you need the option to move dramatically just to get back to even. Wide spreads are a silent killer of options P&L.',
    avoid: 'Only trade options where the bid-ask spread is less than 10% of the mid-price, or less than $0.10 absolute. Stick to options on high-volume underlyings: SPY, QQQ, AAPL, MSFT, TSLA, AMZN, etc. Check Open Interest — you want 100+ contracts minimum, ideally 1000+.',
  },
  {
    num: 7,
    title: 'Selling Naked Options Without Understanding the Risk',
    severity: 'high',
    what: 'Selling a naked call on a $100 stock for $1.00 seems easy money. If the stock gets acquired at $180 overnight, you owe $80/share × 100 = $8,000 — for collecting $100. Naked options carry theoretically unlimited risk. Stock gaps, earnings surprises, acquisitions, and FDA decisions can happen overnight without warning.',
    avoid: 'Until you have significant experience and capital, only sell options as part of defined-risk structures: cash-secured puts (you can afford the shares), covered calls (you own the shares), or vertical spreads (max loss is capped). Never sell naked calls on stocks susceptible to acquisition.',
  },
  {
    num: 8,
    title: 'Not Understanding IV Crush on Earnings',
    severity: 'high',
    what: 'NVDA earnings are tomorrow. It\'s been on a tear. You buy the ATM call for $8. The next morning NVDA beats estimates and the stock gaps up 5% to $105. But your call is now worth $5.50. IV collapsed from 90% to 35% overnight. The $5 stock move added maybe $2.50 to your call; the IV drop removed $5. Net: you lost $2.50 despite being right.',
    avoid: 'Understand the math before earnings: calculate how large the stock needs to move to overcome IV crush. If IV suggests a ±$8 implied move and your cost is $8, you need the stock to move more than $8 to profit. Often, the implied move accurately prices the options — buying straddles into earnings is generally negative expected value.',
  },
  {
    num: 9,
    title: 'Over-Managing Positions — Adding to Losers',
    severity: 'medium',
    what: 'Your short put is tested. Instead of following your loss rules, you "roll down" for a small credit, adding more risk. Then you roll again. Now you have a much larger position at a worse strike, with a trade that\'s been wrong from the start. You\'ve turned a manageable loss into a potentially catastrophic one while telling yourself you\'re "managing the trade."',
    avoid: 'Distinguish between legitimate adjustments (rolling for a credit when you have clear reason to be constructive) and "hoping" (rolling to avoid booking a loss). When you catch yourself rolling primarily to avoid realizing a loss — just take the loss. Fresh capital deserves to go into fresh trades, not losers.',
  },
  {
    num: 10,
    title: 'Neglecting the Underlying — Ignoring the Stock',
    severity: 'high',
    what: 'Options are leveraged bets on the underlying stock. You\'re not just trading volatility — you\'re trading the company. If you can\'t articulate why the stock should go up/down/sideways, you\'re gambling on something you don\'t understand. A technically perfect options trade fails if the stock you chose goes bankrupt, misses earnings, has an FDA trial fail, or gets delisted.',
    avoid: 'Before trading any option, know: the company\'s earnings date, any upcoming catalysts (FDA dates, FOMC, product launches), the stock\'s trend and support/resistance, and its sector correlation. For premium selling, only use stocks you\'d be comfortable owning at the strike price. Quality underlying selection is more important than any options strategy.',
  },
];

export function Mistakes() {
  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
        Common Mistakes
      </h1>
      <p style={{ margin: '0 0 32px', color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
        The 10 most common ways beginner option traders lose money — and exactly how to avoid each one.
      </p>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <div style={{ padding: '6px 14px', background: '#ef444418', border: '1px solid #ef444440', borderRadius: 6, fontSize: 12, color: '#ef4444' }}>
          High Severity — account-threatening
        </div>
        <div style={{ padding: '6px 14px', background: '#f59e0b18', border: '1px solid #f59e0b40', borderRadius: 6, fontSize: 12, color: '#f59e0b' }}>
          Medium Severity — costly but recoverable
        </div>
      </div>

      <div className="g-2" style={{ gap: 20 }}>
        {mistakes.map((m) => {
          const borderColor = m.severity === 'high' ? '#ef4444' : '#f59e0b';
          const bgColor = m.severity === 'high' ? '#ef444408' : '#f59e0b08';
          const badgeColor = m.severity === 'high' ? '#ef4444' : '#f59e0b';

          return (
            <div
              key={m.num}
              style={{
                background: '#1a1d27',
                border: `1px solid ${borderColor}40`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Card header */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${borderColor}30`, background: bgColor, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: '50%',
                  background: borderColor, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                  flexShrink: 0, marginTop: 1,
                }}>
                  {m.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4 }}>{m.title}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4, padding: '1px 7px', borderRadius: 4,
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                    color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}40`,
                  }}>
                    {m.severity} severity
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: borderColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  What happens
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{m.what}</p>

                <div style={{ padding: '10px 12px', background: '#0f1117', borderRadius: 8, borderLeft: `3px solid #10b981` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    How to avoid it
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{m.avoid}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40, padding: '20px 24px', background: '#1a1d27', border: '1px solid #6366f140', borderRadius: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>The Pattern Behind All 10 Mistakes</div>
        <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          Every mistake above has a common thread: <strong style={{ color: '#e2e8f0' }}>hope over process</strong>. Hoping the stock will recover. Hoping IV won't crush. Hoping that lottery ticket will hit. Hoping the position will come back. Successful options trading replaces hope with rules: pre-defined entries based on IVR, fixed profit targets, automatic loss stops, and position sizes that can survive being wrong 30% of the time. Process over prediction.
        </p>
      </div>
    </div>
  );
}
