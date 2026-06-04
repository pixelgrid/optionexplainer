
function StepCard({
  number, title, color, children,
}: { number: number | string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
      overflow: 'hidden', marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: `${color}08` }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {number}
        </div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h3>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function InfoBox({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, borderLeft: `3px solid ${color}`, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 4 }}>{label}</div>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function OutcomeCard({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg)', border: `1px solid ${color}40`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

export function Lifecycle() {
  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        Trade Lifecycle
      </h1>
      <p style={{ margin: '0 0 40px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        From the moment you enter an options trade to the moment it resolves, there are distinct phases — each with its own decisions and risks. Most beginners focus only on entry. The professionals focus on position management, exit rules, and what happens at expiration.
      </p>

      {/* Visual timeline stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
        {[
          { label: 'Entry', color: '#6366f1' },
          { label: 'Management', color: '#10b981' },
          { label: 'Expiration', color: '#f59e0b' },
          { label: 'Post-Expiry', color: '#ef4444' },
        ].map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              textAlign: 'center',
              padding: '10px 20px',
              background: `${step.color}18`,
              border: `1px solid ${step.color}40`,
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 11, color: step.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Phase {i + 1}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginTop: 2 }}>{step.label}</div>
            </div>
            {i < 3 && (
              <div style={{ fontSize: 18, color: 'var(--border)', padding: '0 4px' }}>→</div>
            )}
          </div>
        ))}
      </div>

      {/* Phase 1: Entry */}
      <StepCard number={1} title="Entry — Getting In Right" color="#6366f1">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          How you enter a trade largely determines whether you can manage it profitably. Three key decisions at entry:
        </p>
        <InfoBox
          label="Choosing Your Expiry — 30-60 DTE Sweet Spot"
          color="#6366f1"
          text="For premium sellers (short strategies), the 30–45 DTE range captures the steepest theta decay while giving you enough time to react and adjust if the trade goes wrong. Going shorter (under 21 DTE) gives you less theta but extreme gamma risk — small stock moves have oversized effects. Going longer (60+ DTE) gives less daily theta, more capital tied up."
        />
        <InfoBox
          label="Strike Selection — Delta as Probability Proxy"
          color="#8b5cf6"
          text="Delta is roughly the probability the option expires in the money. Selling a 0.30 delta put means there's approximately a 30% chance you take assignment (70% chance of keeping full premium). Most premium sellers target the 0.16–0.30 delta range — high enough to collect meaningful premium, low enough to win frequently. The 0.16 delta corresponds to 1 standard deviation OTM."
        />
        <InfoBox
          label="Debit vs Credit Entry"
          color="#10b981"
          text="Credit entries (selling spreads, selling puts/calls) collect premium upfront — you profit if nothing happens. Debit entries (buying spreads, buying options) cost money upfront — you need the stock to move your direction AND by enough to overcome theta. Credit trades have a statistical edge because of the volatility risk premium (IV tends to exceed realized vol over time)."
        />
      </StepCard>

      {/* Phase 2: Management */}
      <StepCard number={2} title="During the Trade — Position Management" color="#10b981">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          The golden rules of position management. Having these rules in advance (before you're emotional about a live trade) is essential.
        </p>
        <InfoBox
          label="When to Take Profit — The 50% Rule"
          color="#10b981"
          text="For credit trades: close when you've captured 50% of the max profit (e.g., sold a spread for $1.00, buy it back at $0.50). Research shows this dramatically improves risk-adjusted returns — you eliminate the remaining 50% of risk (which requires the trade to go perfectly from here) in exchange for the first 50% of profit (which the trade has already proven it can reach). It's asymmetric in your favor."
        />
        <InfoBox
          label="When to Cut Losses — The 2x Rule"
          color="#ef4444"
          text="For credit trades: if the loss reaches 2× the credit received, close the position. If you collected $1.00, close at $2.00 debit (a $1.00 loss). This prevents small losses from becoming catastrophic. Don't wait for a 'comeback' — take the loss and redeploy capital into a fresh high-probability trade."
        />
        <InfoBox
          label="Rolling — Extending Duration Under Pressure"
          color="#f59e0b"
          text="When a short option position is tested (stock approaches your strike), you can 'roll' — buy back the current position and sell a new one further OTM and/or further in time. Rolling for a credit (you collect more premium than you pay) is sustainable. Rolling for a debit (paying to extend) should only be done if you genuinely believe the trade can recover and the net credit-to-date justifies the risk."
        />
      </StepCard>

      {/* Phase 3: Expiration */}
      <StepCard number={3} title="At Expiration — Three Outcomes" color="#f59e0b">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          The most important rule: do not hold short options into expiration day unless you have a very specific reason. The final few hours bring extreme gamma risk and assignment uncertainty.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <OutcomeCard icon="✓" title="Expires OTM — Best Case" color="#10b981">
            The stock price stays on the right side of your strike at expiry. The option expires worthless, you keep 100% of the premium collected. For defined-risk spreads, both legs expire worthless.
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#10b98118', borderRadius: 6, fontSize: 12, color: '#10b981' }}>
              Action: Usually close for $0.01–0.05 the day before rather than holding to expiry.
            </div>
          </OutcomeCard>
          <OutcomeCard icon="⚠" title="Expires Slightly ITM — Assignment Risk" color="#f59e0b">
            The stock price is just past your strike by a small amount. The option may or may not be exercised — you face "pin risk." Brokers often auto-exercise options that are $0.01+ ITM at expiration. If you're short, you could receive an unexpected assignment over the weekend.
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#f59e0b18', borderRadius: 6, fontSize: 12, color: '#f59e0b' }}>
              Action: Close early to avoid the uncertainty. Never hold short options through expiry if near the money.
            </div>
          </OutcomeCard>
          <OutcomeCard icon="✗" title="Expires Deep ITM — Assignment/Exercise" color="#ef4444">
            The option is significantly in the money. Assignment (for short options) or exercise (for long options) will occur. For a short put: you buy 100 shares at the strike price. For a short call: you sell 100 shares at the strike price. Be sure you have the capital or shares to fulfill this obligation.
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#ef444418', borderRadius: 6, fontSize: 12, color: '#ef4444' }}>
              Action: Close or roll before expiry if you don't want the shares.
            </div>
          </OutcomeCard>
        </div>
      </StepCard>

      {/* Phase 4: Assignment & Exercise */}
      <StepCard number={4} title="Assignment &amp; Exercise — What Actually Happens" color="#ef4444">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          Understanding the mechanics of assignment removes the fear. It's not an emergency — it's a known outcome you should plan for.
        </p>
        <div className="g-2" style={{ gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Short Put → Assigned', color: '#ef4444', text: 'You are obligated to buy 100 shares at the strike price. Your broker debits your account the purchase amount ($strike × 100). You now own stock at your strike price — your effective cost basis is the strike minus the premium collected.' },
            { label: 'Short Call → Assigned', color: '#ef4444', text: 'You are obligated to sell 100 shares at the strike price. If you own the shares (covered call), they are sold. If you don\'t own them (naked call — very risky), your broker may force a buy-in at market price.' },
            { label: 'Long Put → Exercise', color: '#10b981', text: 'You choose to sell 100 shares at the strike price. Only rational to exercise when the put is deep ITM and the extrinsic value is near zero (you\'d give up more by selling the option vs exercising).' },
            { label: 'Early Exercise Risk (Calls)', color: '#f59e0b', text: 'American-style calls are rarely exercised early, except just before an ex-dividend date. A deep ITM call holder may exercise the day before ex-div to capture the dividend. Be aware of this on any short deep-ITM call position.' },
          ].map(({ label, color, text }) => (
            <div key={label} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 6 }}>{label}</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </StepCard>

      {/* Rolling */}
      <StepCard number="↺" title="Rolling — When to Extend vs Accept the Loss" color="#8b5cf6">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          Rolling is the act of closing your current position and re-opening a similar one at a different expiry, strike, or both. It's a management tool — not a way to avoid losses.
        </p>
        <div className="g-2" style={{ gap: 14 }}>
          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>Roll When</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>
              <li>You can roll for a credit (collect more premium)</li>
              <li>You still believe the thesis (stock direction)</li>
              <li>The net credit-to-date covers your risk</li>
              <li>30+ DTE remains after rolling (avoids pin risk)</li>
            </ul>
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Take the Loss When</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>
              <li>Rolling costs a debit and you'd be "averaging down"</li>
              <li>The fundamental thesis has changed</li>
              <li>The position is eating disproportionate margin</li>
              <li>You've already rolled 2+ times on same position</li>
            </ul>
          </div>
        </div>
      </StepCard>
    </div>
  );
}
