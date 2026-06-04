import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { blackScholes } from '../lib/blackScholes';

/* ── shared styles ───────────────────────────────────────── */
const CHART_STYLE = {
  grid: { strokeDasharray: '3 3', stroke: 'var(--border)' },
  xAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  yAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  tooltip: { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 } },
};

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function StepCard({ number, title, color, children }: { number: number; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--border)', background: `${color}0d` }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {number}
        </div>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h3>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function Slider({ label, min, max, step = 1, value, onChange, format }: {
  label: string; min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: 'var(--text)' }}>{label}</span>
        <span style={{ color: 'var(--text-h)', fontWeight: 600, fontFamily: 'monospace' }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#6366f1' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569', marginTop: 2 }}>
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', flex: '1 1 120px', minWidth: 0 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-h)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#475569' }}>{sub}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DECISION TREE
══════════════════════════════════════════════════════════ */

type NodeOption = { label: string; desc: string; next: string; color: string };
type TreeNode = {
  id: string;
  title: string;
  question?: string;
  context?: string;
  options?: NodeOption[];
  action?: string;
  actionColor?: string;
  tip?: string;
  isTerminal?: boolean;
};

const TREE: Record<string, TreeNode> = {
  root: {
    id: 'root',
    title: 'Position Check-In',
    question: 'What is your short call doing right now?',
    context: 'Pick the scenario that best describes your current PMCC position. You will be walked through the optimal next action.',
    options: [
      { label: 'Expired / expiring OTM — stock is below my short strike', desc: 'The short call will expire worthless. I keep the premium.', next: 'otm_stock', color: '#10b981' },
      { label: 'Stock is at or above my short call strike', desc: 'The short call is ITM or very close. Assignment risk is real.', next: 'tested', color: '#f59e0b' },
      { label: 'Stock dropped hard — my LEAPS is losing value', desc: 'The underlying fell 10%+ since I opened the position.', next: 'leaps_down', color: '#ef4444' },
      { label: 'I want to roll my short call proactively (it has time left)', desc: 'I want to adjust before expiry — capture profit or move the strike.', next: 'roll_proactive', color: '#6366f1' },
    ],
  },

  otm_stock: {
    id: 'otm_stock',
    title: 'Short Call Expired OTM ✓',
    question: 'Where did the stock finish relative to where you opened?',
    context: 'The short call expired worthless — you keep 100% of the premium. Now decide what to do for the next cycle.',
    options: [
      { label: 'Stock is flat or slightly down from my entry', desc: "Stock hasn't moved much. Looking at starting a new cycle.", next: 'otm_flat_iv', color: '#10b981' },
      { label: 'Stock rose, but stayed below my strike', desc: 'Nice — the stock moved in my direction. I may want to adjust my strike up.', next: 'otm_rose', color: '#6366f1' },
    ],
  },

  otm_flat_iv: {
    id: 'otm_flat_iv',
    title: 'New Cycle — IV Check',
    question: 'What is the current Implied Volatility Rank (IVR)?',
    context: 'IVR tells you whether current IV is cheap or expensive relative to its own history. It changes what strike / DTE to use.',
    options: [
      { label: 'IVR > 30 (elevated — IV is relatively rich)', desc: 'Options are more expensive than usual. This is a seller\'s market.', next: 'sell_normal', color: '#10b981' },
      { label: 'IVR < 25 (low — IV is compressed)', desc: 'Options are cheap. We adjust strike / DTE to compensate.', next: 'sell_low_iv', color: '#f59e0b' },
    ],
  },

  sell_normal: {
    id: 'sell_normal',
    title: '✅ Action: Sell Standard Short Call',
    isTerminal: true,
    action: 'Sell a 30–45 DTE call at the 25–30 delta strike. This sits roughly 1 standard deviation OTM. In a normal-to-elevated IV environment this collects enough premium to be worth the trade while leaving room for upside.\n\nTarget: premium ≥ 2% of stock price per month. If you can\'t get that at 25 delta, widen to 30 delta.',
    actionColor: '#10b981',
    tip: 'IVR > 30 is the sweet spot. Do not skip cycles waiting for "perfect" IV — consistent selling beats timing.',
  },

  sell_low_iv: {
    id: 'sell_low_iv',
    title: '⚠️ Action: Sell Tighter / Shorter Dated',
    isTerminal: true,
    action: 'When IV is compressed, there are two approaches:\n\n1. Sell closer to the money (30–35 delta) to capture more premium, accepting slightly more assignment risk.\n2. Shorten duration to 21 DTE — you collect less but theta burns faster proportionally.\n\nAvoid going very short DTE if the stock has an event (earnings, FDA) in that window.',
    actionColor: '#f59e0b',
    tip: 'If IVR is below 15, consider skipping this cycle entirely and waiting 1–2 weeks for IV to pop. Selling cheap premium is the #1 PMCC mistake.',
  },

  otm_rose: {
    id: 'otm_rose',
    title: 'Stock Rose — Move Strike Up',
    isTerminal: true,
    action: 'The stock appreciated and you want to capture that in your next cycle. Roll your short call strike UP to stay at roughly 25 delta on the new stock price.\n\nExample: stock at $105 → $110 since entry, short strike was $107. New ATM is $110. Sell the $115–$118 call (25 delta) for the next 30–45 DTE cycle.\n\nThis lets the LEAPS compound its gains while continuing to collect premium at the new elevated level.',
    actionColor: '#6366f1',
    tip: 'Never leave your short strike at a level where the stock has already passed it. You\'d be selling an OTM call with almost no delta — useless.',
  },

  tested: {
    id: 'tested',
    title: 'Short Call Tested / ITM',
    question: 'How much time is left until expiry?',
    context: 'Your short call is at or above the strike. The right move depends critically on how much time premium remains.',
    options: [
      { label: '> 10 days to expiry (time to manage)', desc: 'You have room to act before things get urgent.', next: 'tested_time', color: '#f59e0b' },
      { label: '< 10 days to expiry (late stage)', desc: 'Close to expiry with stock through your strike.', next: 'tested_late', color: '#ef4444' },
    ],
  },

  tested_time: {
    id: 'tested_time',
    title: 'Can You Roll for a Credit?',
    question: 'If you buy back the current short call and sell the next month (same or +1 strike), is it a NET CREDIT?',
    context: 'A credit roll means you collect more from the new short than you pay to close the current one — you are never "paying to roll." This is a hard rule.',
    options: [
      { label: 'Yes — I can roll out 4+ weeks for a net credit ≥ $0.05', desc: 'The time premium in the next expiry is high enough.', next: 'roll_for_credit', color: '#10b981' },
      { label: 'No — rolling costs a net debit (I\'d be paying)', desc: 'The stock moved too fast or too far.', next: 'tested_no_credit', color: '#ef4444' },
    ],
  },

  roll_for_credit: {
    id: 'roll_for_credit',
    title: '✅ Action: Roll Up & Out for Credit',
    isTerminal: true,
    action: 'Buy back your current short call and simultaneously sell a new call:\n• DTE: 4–8 weeks out (farther if credit is marginal)\n• Strike: Same or 1 step higher\n• Net result: credit received ≥ $0.05\n\nThis reduces your effective cost basis by the credit collected, extends duration, and gives the stock more room to move. You can repeat this process as long as the stock keeps rising and credits are available.',
    actionColor: '#10b981',
    tip: 'Never roll for a debit. If you cannot roll for a credit at the same or higher strike, the stock has likely run past the point where the PMCC mechanics work — see the "no credit" branch.',
  },

  tested_no_credit: {
    id: 'tested_no_credit',
    title: 'No Credit Available — Evaluate LEAPS',
    question: 'The short call is deep ITM and rolling costs a debit. Check your LEAPS delta:',
    context: 'When rolling for credit becomes impossible, the position has often reached max profit or close to it. The LEAPS has appreciated significantly.',
    options: [
      { label: 'LEAPS delta > 85 (deep ITM, acting like stock)', desc: 'Most of the LEAPS\'s potential has been realized. It\'s all intrinsic now.', next: 'close_position', color: '#6366f1' },
      { label: 'LEAPS delta 65–85 (still has time value)', desc: 'The LEAPS has time value left to protect.', next: 'roll_leaps_up', color: '#f59e0b' },
    ],
  },

  close_position: {
    id: 'close_position',
    title: '✅ Action: Close the Entire Spread',
    isTerminal: true,
    action: 'Your PMCC is near maximum value. Close both legs simultaneously:\n1. Buy back the short call\n2. Sell the LEAPS\n\nYou have collected most of the spread\'s theoretical max profit. Reinvest the capital into a new PMCC at fresh strikes. This resets your theta clock and capital efficiency.\n\nMax profit = (Short strike − LEAPS strike) × 100 − original net debit.',
    actionColor: '#6366f1',
    tip: 'Book the win. The risk/reward of holding a maxed-out spread with no room to collect more is poor. Fresh capital into a new position is more efficient.',
  },

  roll_leaps_up: {
    id: 'roll_leaps_up',
    title: '✅ Action: Roll the LEAPS Up, Then Close Short',
    isTerminal: true,
    action: 'The stock has moved significantly in your favor. Execute in order:\n\n1. Buy back the short call (accept the loss on it — your LEAPS gain covers it)\n2. "Roll up" the LEAPS: sell your current LEAPS and buy a new ATM LEAPS (70-80 delta, 12+ months out) at the new higher stock price\n\nThis locks in the LEAPS gain, lowers your new net debit (you\'re buying a cheaper-relative-to-stock LEAPS), and resets the position at the current stock level.\n\nThen restart the short call selling cycle from scratch.',
    actionColor: '#f59e0b',
    tip: 'Rolling the LEAPS up is like "taking profits on the long side" while staying in the trade. This is the most capital-efficient move when the stock runs hard.',
  },

  tested_late: {
    id: 'tested_late',
    title: 'Late Stage: Short ITM < 10 Days',
    question: 'What is the stock doing right now?',
    context: 'With < 10 days to go and the call ITM, gamma is high. Small stock moves have large effects on the short call price.',
    options: [
      { label: 'Stock is still rising / has momentum', desc: 'Upward trend intact. Risk of going further ITM.', next: 'late_rising', color: '#10b981' },
      { label: 'Stock has stalled or reversed slightly', desc: 'Momentum fading. Short call may expire just ITM or slip back OTM.', next: 'late_stalled', color: '#f59e0b' },
    ],
  },

  late_rising: {
    id: 'late_rising',
    title: '✅ Action: Roll to Next Week for Small Credit',
    isTerminal: true,
    action: 'With momentum continuing, roll the short call to the same strike but 1–2 weeks out for whatever credit you can get (even $0.10). This avoids the "let it ride" risk of the stock running another $5–10.\n\nAlternatively: if your LEAPS delta is > 80 and the spread is near max profit, simply close both legs now and take the gain. Do not let gamma risk linger into the final days.',
    actionColor: '#10b981',
    tip: 'In the last week before expiry, gamma spikes. A $2 move in the stock can change the short call value by $1+. Act early rather than waiting for expiry.',
  },

  late_stalled: {
    id: 'late_stalled',
    title: '✅ Action: Hold or Roll 1 Week',
    isTerminal: true,
    action: 'If the stock has stalled just above your strike with < 10 days left:\n\n• If the short call still has $0.30+ of time value: roll to next week, same strike, for a credit. Collect the remaining time premium.\n• If the short call is mostly intrinsic (< $0.10 time value): let it ride. Your LEAPS gain should offset the short call loss, landing near max profit.\n\nAvoid closing the short call for a big loss when expiry is this close — time is working for you.',
    actionColor: '#f59e0b',
    tip: 'An ITM short call at expiry + long LEAPS = you\'re realizing near-max spread profit. This is a good outcome, not a crisis.',
  },

  roll_proactive: {
    id: 'roll_proactive',
    title: 'Proactive Roll',
    question: 'Why do you want to roll early?',
    context: 'Proactive rolls are best done when you have reached 50%+ of max profit on the short call, or when the stock has moved enough to warrant adjusting strikes.',
    options: [
      { label: 'I\'ve collected 50%+ of the short call premium already', desc: 'Short call has decayed from $1.80 → $0.80 for example.', next: 'proactive_50pct', color: '#10b981' },
      { label: 'Stock moved up, my strike looks too close to ATM now', desc: 'I want to move the strike up while I have time.', next: 'proactive_strike', color: '#6366f1' },
      { label: 'IV spiked — I want to sell a new call at richer premium', desc: 'Current short was sold at IVR 20, now IVR is 50.', next: 'proactive_iv_spike', color: '#f59e0b' },
    ],
  },

  proactive_50pct: {
    id: 'proactive_50pct',
    title: '✅ Action: Take 50% and Re-Sell',
    isTerminal: true,
    action: 'The 50% profit rule: close your short call when it has decayed to 50% of the credit you received. Immediately sell a new 30–45 DTE call at the current 25–30 delta.\n\nWhy this works: the remaining 50% of premium takes longer to decay (exponential curve). Closing early and re-opening at full premium is more efficient than grinding out the last $0.40.',
    actionColor: '#10b981',
    tip: 'tastytrade research shows taking profits at 50% and re-entering beats holding to expiry in risk-adjusted terms. This keeps your theta engine running faster.',
  },

  proactive_strike: {
    id: 'proactive_strike',
    title: '✅ Action: Roll Strike Up for Credit',
    isTerminal: true,
    action: 'Buy back your current short call (at a profit since stock is still below it) and sell a new call:\n• New strike: current stock price + target OTM cushion (25 delta)\n• New DTE: 30–45 days\n• Ensure: net transaction is a credit or breakeven\n\nThis re-centers your position around the new stock price. You\'re essentially "following the stock up" with your short call, locking in the appreciation.',
    actionColor: '#6366f1',
    tip: 'Moving the strike up when the stock rises is how PMCC compounds. Every roll-up trades your short call\'s position for a higher one, growing the spread\'s max profit.',
  },

  proactive_iv_spike: {
    id: 'proactive_iv_spike',
    title: '✅ Action: Buy Back Cheap Call, Re-Sell at High IV',
    isTerminal: true,
    action: 'IV spiked, which means your current short call is now worth more — but the new IV-rich environment means you can collect even more by selling a fresh one.\n\nStep 1: Close your current short call. During an IV spike the stock likely fell, making the short call cheaper.\nStep 2: Sell a new 30–45 DTE call at the same or slightly lower strike (since the stock moved down) at the elevated IV.\n\nThis effectively "resets" your position to capture the new, higher premium environment.',
    actionColor: '#f59e0b',
    tip: 'IV spikes are PMCC opportunities if you manage them correctly. The LEAPS delta may have dropped due to the stock fall, but high IV on the short call compensates.',
  },

  leaps_down: {
    id: 'leaps_down',
    title: 'Stock Dropped — LEAPS Under Pressure',
    question: 'How severe is the drop, and what is your LEAPS delta now?',
    context: 'A falling stock hurts the LEAPS but your collected short call credits cushion the blow. The right action depends on how far things have moved.',
    options: [
      { label: 'Down 10–15% — LEAPS delta still 55–70', desc: 'Significant but manageable. LEAPS has time/value left.', next: 'leaps_moderate', color: '#f59e0b' },
      { label: 'Down > 20% — LEAPS delta now 40–55 or lower', desc: 'The LEAPS is approaching ATM territory. Thesis is seriously challenged.', next: 'leaps_severe', color: '#ef4444' },
    ],
  },

  leaps_moderate: {
    id: 'leaps_moderate',
    title: 'Moderate Drop — Check Your Thesis',
    question: 'Is the drop news-driven or just market noise?',
    options: [
      { label: 'Market or sector pullback — fundamentals unchanged', desc: 'Nothing company-specific. I\'m still bullish long term.', next: 'leaps_hold', color: '#10b981' },
      { label: 'Company-specific bad news — thesis may be broken', desc: 'Earnings miss, downgrade, guidance cut, scandal, etc.', next: 'leaps_exit', color: '#ef4444' },
    ],
  },

  leaps_hold: {
    id: 'leaps_hold',
    title: '✅ Action: Hold LEAPS, Pause Short Calls',
    isTerminal: true,
    action: 'If the drop is market-driven and your thesis is intact:\n\n1. Stop selling short calls temporarily — do NOT sell a call when you need the LEAPS to recover. You would be capping your upside at the worst time.\n2. Let the LEAPS recover. At 55–70 delta you have substantial recovery potential.\n3. Resume selling short calls once the stock has stabilized and bounced 5%+.\n\nYour collected premiums to date have reduced your cost basis — check your actual break-even before panicking.',
    actionColor: '#10b981',
    tip: 'The LEAPS is your long-term equity substitute. Short-term noise is the price you pay for the leverage it provides. Selling calls during a drop locks in losses at the worst time.',
  },

  leaps_exit: {
    id: 'leaps_exit',
    title: '✅ Action: Exit the Position',
    isTerminal: true,
    action: 'When the thesis is broken, exit cleanly:\n\n1. Buy back the short call first (it should be cheap — stock fell so OTM call lost value)\n2. Sell the LEAPS immediately after (don\'t wait, theta is eroding it daily)\n\nDo not "wait for recovery" on a thesis-broken position. The LEAPS will continue losing value every day regardless of whether the stock moves.\n\nCapital freed from a broken trade is better deployed elsewhere.',
    actionColor: '#ef4444',
    tip: 'The hardest part of the PMCC is accepting losses on the LEAPS. Your max loss is the net debit paid. Once you hit 50% of that as a loss, cutting is usually correct.',
  },

  leaps_severe: {
    id: 'leaps_severe',
    title: 'Severe Drop — Emergency Decision',
    question: 'Is your LEAPS still worth more than 50% of what you paid?',
    options: [
      { label: 'Yes — LEAPS still worth > 50% of original cost', desc: 'Still meaningful value to preserve.', next: 'leaps_roll_down', color: '#f59e0b' },
      { label: 'No — LEAPS has lost > 50% of its value', desc: 'Substantial loss has already occurred.', next: 'leaps_cut', color: '#ef4444' },
    ],
  },

  leaps_roll_down: {
    id: 'leaps_roll_down',
    title: '✅ Action: Roll LEAPS Down-and-Out',
    isTerminal: true,
    action: 'To reduce further downside exposure while staying in the trade:\n\n1. Sell your current LEAPS (deep ITM if stock fell far)\n2. Buy a new LEAPS at or slightly below current stock price (ATM or 10% ITM) with 12+ months remaining\n3. The roll usually generates a credit (you\'re selling a higher-strike, buying a lower one)\n\nThis lowers your break-even, retains upside if the stock recovers, but reduces max profit from previous levels. It is the defensive version of rolling.',
    actionColor: '#f59e0b',
    tip: 'Rolling down costs you some max profit upside, but it\'s better than riding a deep-ITM LEAPS through a prolonged bear move. Think of it as "resetting the long strike."',
  },

  leaps_cut: {
    id: 'leaps_cut',
    title: '✅ Action: Cut the Entire Position',
    isTerminal: true,
    action: 'A > 50% loss on the LEAPS is a clear signal to exit:\n\n1. Buy back short call immediately (it is likely cheap since stock dropped)\n2. Sell the LEAPS — accept the loss\n3. Do not add to a losing position trying to dollar-cost average\n\nThe LEAPS has limited remaining value and its theta decay will accelerate from here. The capital redeployed elsewhere has a better expected value than holding a damaged LEAPS.',
    actionColor: '#ef4444',
    tip: 'Hard stop on LEAPS at -50% is mechanical but correct. Accepting a defined loss is part of the strategy design — the short call premiums collected reduced your real loss below what the LEAPS alone shows.',
  },
};

function DecisionTree() {
  const [path, setPath] = useState<string[]>(['root']);
  const currentId = path[path.length - 1];
  const node = TREE[currentId];

  const goTo = (nextId: string) => setPath((p) => [...p, nextId]);
  const goBack = () => setPath((p) => p.length > 1 ? p.slice(0, -1) : p);
  const reset = () => setPath(['root']);

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* breadcrumb */}
      <div style={{ padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {path.map((id, i) => (
          <span key={id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ color: 'var(--border)', fontSize: 12 }}>›</span>}
            <span style={{
              fontSize: 11,
              fontWeight: i === path.length - 1 ? 600 : 400,
              color: i === path.length - 1 ? 'var(--text-h)' : '#475569',
              cursor: i < path.length - 1 ? 'pointer' : 'default',
            }}
              onClick={() => i < path.length - 1 && setPath(path.slice(0, i + 1))}
            >
              {TREE[id]?.title ?? id}
            </span>
          </span>
        ))}
      </div>

      <div style={{ padding: '24px 24px 20px' }}>
        {/* Question node */}
        {!node.isTerminal && (
          <>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#6366f1', textTransform: 'uppercase' }}>
                Decision Point
              </span>
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 600, color: 'var(--text-h)' }}>
              {node.question}
            </h3>
            {node.context && (
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {node.context}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {node.options?.map((opt) => (
                <button
                  key={opt.next}
                  onClick={() => goTo(opt.next)}
                  style={{
                    background: 'var(--bg)',
                    border: `1px solid ${opt.color}30`,
                    borderLeft: `4px solid ${opt.color}`,
                    borderRadius: 8,
                    padding: '14px 16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${opt.color}10`; e.currentTarget.style.borderColor = `${opt.color}60`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.border = `1px solid ${opt.color}30`; e.currentTarget.style.borderLeft = `4px solid ${opt.color}`; }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Terminal action node */}
        {node.isTerminal && (
          <>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: node.actionColor ?? '#10b981', textTransform: 'uppercase' }}>
                Recommended Action
              </span>
            </div>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: 'var(--text-h)' }}>
              {node.title}
            </h3>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px 18px', marginBottom: 16, borderLeft: `4px solid ${node.actionColor ?? '#10b981'}` }}>
              {(node.action ?? '').split('\n').map((line, i) => (
                line.trim() === '' ? <br key={i} /> :
                line.startsWith('Step') || /^\d+\./.test(line) || line.startsWith('•') || line.startsWith('Example') ?
                  <p key={i} style={{ margin: '6px 0', fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{line}</p> :
                  <p key={i} style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{line}</p>
              ))}
            </div>
            {node.tip && (
              <div style={{ padding: '10px 14px', background: '#6366f110', border: '1px solid #6366f130', borderRadius: 8, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                <strong style={{ color: '#6366f1' }}>💡 Pro tip: </strong>{node.tip}
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        {path.length > 1 && (
          <button onClick={goBack} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, padding: '7px 16px', borderRadius: 6, cursor: 'pointer' }}>
            ← Back
          </button>
        )}
        <button onClick={reset} style={{ background: 'none', border: '1px solid var(--border)', color: '#475569', fontSize: 12, padding: '7px 16px', borderRadius: 6, cursor: 'pointer' }}>
          Start Over
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SETUP CALCULATOR
══════════════════════════════════════════════════════════ */
function SetupCalculator() {
  const [stock, setStock] = useState(150);
  const [leapsStrike, setLeapsStrike] = useState(120);
  const [leapsDte, setLeapsDte] = useState(365);
  const [shortStrike, setShortStrike] = useState(160);
  const [shortDte, setShortDte] = useState(45);
  const [iv, setIv] = useState(30);
  const r = 0.05;

  const sigma = iv / 100;

  // LEAPS: long deep ITM call
  const leapsResult = useMemo(() =>
    blackScholes({ S: stock, K: leapsStrike, T: leapsDte / 365, r, sigma }),
    [stock, leapsStrike, leapsDte, sigma]
  );

  // Short call: short OTM call
  const shortResult = useMemo(() =>
    blackScholes({ S: stock, K: shortStrike, T: shortDte / 365, r, sigma }),
    [stock, shortStrike, shortDte, sigma]
  );

  const netDebit = leapsResult.call - shortResult.call;
  const maxProfit = (shortStrike - leapsStrike) * 100 - netDebit * 100;
  const breakeven = leapsStrike + netDebit;
  const capitalVsShares = netDebit * 100;
  const sharesCapital = stock * 100;
  const capitalSaving = ((sharesCapital - capitalVsShares) / sharesCapital) * 100;
  const spreadWidth = shortStrike - leapsStrike;
  const riskReward = maxProfit > 0 ? (netDebit * 100 / maxProfit).toFixed(2) : '—';

  // Validate: short strike must be > leaps strike, leaps DTE > short DTE
  const valid = shortStrike > leapsStrike && leapsDte > shortDte && leapsStrike < stock;
  const warnings: string[] = [];
  if (leapsStrike >= stock) warnings.push('LEAPS strike must be BELOW current stock price (deep ITM).');
  if (shortStrike <= leapsStrike) warnings.push('Short call strike must be ABOVE the LEAPS strike.');
  if (leapsDte <= shortDte) warnings.push('LEAPS must expire AFTER the short call.');
  if (leapsResult.delta_call < 0.70 && valid) warnings.push(`LEAPS delta is ${leapsResult.delta_call.toFixed(2)} — ideally ≥ 0.70 for good stock proxy exposure.`);
  if (shortResult.delta_call > 0.35 && valid) warnings.push(`Short call delta is ${shortResult.delta_call.toFixed(2)} — ideally ≤ 0.35 to leave room for upside.`);

  // P&L at short call expiration across stock prices
  const pnlData = useMemo(() => {
    if (!valid) return [];
    const remainingLeapsT = Math.max((leapsDte - shortDte) / 365, 1 / 365);
    return Array.from({ length: 61 }, (_, i) => {
      const s = stock * 0.7 + i * stock * 0.01; // 70% to 130% of stock
      const leapsAtExpiry = blackScholes({ S: s, K: leapsStrike, T: remainingLeapsT, r, sigma }).call;
      const leapsPnl = leapsAtExpiry - leapsResult.call;
      const shortPnl = Math.min(shortResult.call, shortResult.call - Math.max(s - shortStrike, 0));
      const total = leapsPnl + shortPnl;
      return {
        price: +s.toFixed(1),
        total: +total.toFixed(2),
        leaps: +leapsPnl.toFixed(2),
        short: +shortPnl.toFixed(2),
      };
    });
  }, [stock, leapsStrike, leapsDte, shortStrike, shortDte, sigma, valid, leapsResult.call, shortResult.call]);

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 20 }}>
        Interactive PMCC Builder
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
        <Slider label="Stock Price" min={50} max={300} value={stock} onChange={setStock} format={(v) => `$${v}`} />
        <Slider label="LEAPS Strike (deep ITM)" min={30} max={stock - 1} value={Math.min(leapsStrike, stock - 1)} onChange={setLeapsStrike} format={(v) => `$${v}`} />
        <Slider label="LEAPS DTE" min={shortDte + 30} max={730} value={leapsDte} onChange={setLeapsDte} format={(v) => `${v}d`} />
        <Slider label="Short Call Strike (OTM)" min={stock + 1} max={stock * 1.5 | 0} value={Math.max(shortStrike, stock + 1)} onChange={setShortStrike} format={(v) => `$${v}`} />
        <Slider label="Short Call DTE" min={7} max={90} value={shortDte} onChange={setShortDte} format={(v) => `${v}d`} />
        <Slider label="Implied Volatility" min={10} max={80} value={iv} onChange={setIv} format={(v) => `${v}%`} />
      </div>

      {/* Warnings */}
      {warnings.map((w) => (
        <div key={w} style={{ padding: '8px 12px', background: '#f59e0b10', border: '1px solid #f59e0b30', borderRadius: 6, fontSize: 12, color: '#f59e0b', marginBottom: 8 }}>
          ⚠️ {w}
        </div>
      ))}

      {/* Metrics */}
      {valid && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <MetricBox label="LEAPS Cost" value={`$${(leapsResult.call * 100).toFixed(0)}`} sub={`Delta ${leapsResult.delta_call.toFixed(2)}`} color="#6366f1" />
            <MetricBox label="Short Call Credit" value={`$${(shortResult.call * 100).toFixed(0)}`} sub={`Delta ${shortResult.delta_call.toFixed(2)}`} color="#10b981" />
            <MetricBox label="Net Debit" value={`$${(netDebit * 100).toFixed(0)}`} sub="Max possible loss" color="#ef4444" />
            <MetricBox label="Max Profit" value={`$${maxProfit.toFixed(0)}`} sub={`${spreadWidth} pt spread`} color="#10b981" />
            <MetricBox label="Breakeven" value={`$${breakeven.toFixed(1)}`} sub="at LEAPS expiry" color="#f59e0b" />
            <MetricBox label="Capital Saved" value={`${capitalSaving.toFixed(0)}%`} sub="vs owning 100 shares" color="#06b6d4" />
          </div>

          {/* P&L chart */}
          <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            P&L at short call expiry (LEAPS still has {leapsDte - shortDte}d remaining)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={pnlData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid {...CHART_STYLE.grid} />
              <XAxis dataKey="price" {...CHART_STYLE.xAxis}
                tickFormatter={(v) => `$${v}`}
                label={{ value: 'Stock Price at Short Expiry', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 10 }}
                height={40} />
              <YAxis {...CHART_STYLE.yAxis} tickFormatter={(v) => `$${v}`} />
              <Tooltip {...CHART_STYLE.tooltip}
                formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n.toFixed(2)}`]; }}
                labelFormatter={(l) => `Stock @ $${l}`} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text)' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <ReferenceLine x={stock} stroke="#6366f140" strokeDasharray="3 3" label={{ value: 'Current', fill: '#6366f1', fontSize: 9 }} />
              <ReferenceLine x={shortStrike} stroke="#f59e0b40" strokeDasharray="3 3" label={{ value: 'Short', fill: '#f59e0b', fontSize: 9 }} />
              <ReferenceLine x={breakeven} stroke="#ef444440" strokeDasharray="3 3" label={{ value: 'B/E', fill: '#ef4444', fontSize: 9 }} />
              <Line type="monotone" dataKey="total" name="Total P&L" stroke="#6366f1" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="leaps" name="LEAPS P&L" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="short" name="Short Call P&L" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {[
              { label: `Risk/Reward: ${riskReward}:1`, color: 'var(--text)' },
              { label: `Max loss: $${(netDebit * 100).toFixed(0)} (net debit)`, color: '#ef4444' },
              { label: `Max profit: $${maxProfit.toFixed(0)} if above $${shortStrike} at LEAPS expiry`, color: '#10b981' },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: 11, color, background: 'var(--bg)', padding: '3px 8px', borderRadius: 4 }}>{label}</span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export function PMCC() {
  return (
    <div className="page-wrap">
      <div className="badge-row">
        <div style={{ padding: '4px 10px', background: '#10b98115', border: '1px solid #10b98130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#10b981', letterSpacing: '0.05em' }}>BULLISH</div>
        <div style={{ padding: '4px 10px', background: '#6366f115', border: '1px solid #6366f130', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.05em' }}>INCOME GENERATION</div>
        <div style={{ padding: '4px 10px', background: '#f59e0b15', border: '1px solid #f59e0b30', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.05em' }}>LOW CAPITAL REQUIRED</div>
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        Dynamic Poor Man's Covered Call
      </h1>
      <p style={{ margin: '0 0 32px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        A Poor Man's Covered Call (PMCC) replaces the 100-share stock requirement of a traditional covered call with a deep-in-the-money LEAPS call, reducing capital requirements by 60–80%. The "dynamic" part is the ongoing management: rolling the short call up as the stock rises, adjusting after tests, and compounding gains across multiple cycles on the same LEAPS.
      </p>

      {/* How it works — structure diagram */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Structure at a Glance" color="#6366f1" />
        <Card>
          <div className="g-2" style={{ gap: 20, marginBottom: 20 }}>
            <div style={{ padding: '16px 18px', background: '#6366f110', border: '1px solid #6366f130', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.05em', marginBottom: 10 }}>LEG 1 — BUY (Long)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-h)', marginBottom: 6 }}>Deep ITM LEAPS Call</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {['Strike: 70–80 delta (roughly 20–30% below stock price)', 'Expiry: 9–24 months out', 'Acts as a "synthetic stock" substitute', 'This is your cost — the debit you pay'].map(p => (
                  <li key={p} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8 }}>{p}</li>
                ))}
              </ul>
            </div>
            <div style={{ padding: '16px 18px', background: '#10b98110', border: '1px solid #10b98130', borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', letterSpacing: '0.05em', marginBottom: 10 }}>LEG 2 — SELL (Short, each cycle)</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-h)', marginBottom: 6 }}>OTM Short-Dated Call</div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {['Strike: 25–35 delta (~5–10% above stock price)', 'Expiry: 30–45 DTE', 'Generates income that reduces your LEAPS cost basis', 'Renewed each cycle — this is the engine'].map(p => (
                  <li key={p} style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8 }}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text-h)' }}>The key rule: </strong>
            the short call strike must always be <em>above</em> the LEAPS strike, and the LEAPS must expire <em>after</em> the short call. This ensures the long call can cover any assignment on the short.
          </div>
        </Card>
      </section>

      {/* Step-by-step guide */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Step-by-Step Setup Guide" color="#10b981" />

        <StepCard number={1} title="Pick a Bullish Underlying" color="#10b981">
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            The PMCC requires a bullish-to-neutral view. Choose a stock or ETF where you expect modest upside over the LEAPS duration. ETFs (QQQ, SPY, IWM) are ideal for beginners — liquid, no earnings risk on the LEAPS.
          </p>
          <div className="g-2" style={{ gap: 12 }}>
            {[
              { emoji: '✅', title: 'Good candidates', items: ['Liquid ETFs (QQQ, SPY, IWM, GLD)', 'Large-cap stocks with continuous options (AAPL, MSFT, NVDA)', 'IVR 25–50 at entry — not too cheap, not blowing up', 'Uptrend or strong support level visible'] },
              { emoji: '❌', title: 'Avoid', items: ['Stocks with earnings inside LEAPS window (IV crush risk)', 'Low-liquidity names with wide spreads (costs kill the math)', 'Stocks in a clear downtrend', 'IVR > 60 — LEAPS too expensive to make sense'] },
            ].map(({ emoji, title, items }) => (
              <div key={title} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', marginBottom: 8 }}>{emoji} {title}</div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {items.map(i => <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </StepCard>

        <StepCard number={2} title="Buy the LEAPS Call" color="#6366f1">
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Buy 1 LEAPS call with high delta and long time to expiry. This is your "synthetic stock" — it should move nearly dollar-for-dollar with the stock.
          </p>
          <div className="g-3" style={{ gap: 12 }}>
            {[
              { label: 'Target Delta', value: '0.70 – 0.85', desc: 'Each $1 stock move ≈ $0.70–$0.85 option move' },
              { label: 'Target DTE', value: '270 – 540 days', desc: 'LEAPS expiry 9–18 months out minimum' },
              { label: 'Strike depth', value: '15–25% ITM', desc: 'Deep enough that time value is minimal vs intrinsic' },
            ].map(({ label, value, desc }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{desc}</div>
              </div>
            ))}
          </div>
        </StepCard>

        <StepCard number={3} title="Sell the Short Call" color="#f59e0b">
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Immediately sell a short-dated OTM call against your LEAPS. This credit reduces your cost basis. You repeat this step every 30–45 days for the life of the LEAPS.
          </p>
          <div className="g-2" style={{ gap: 12 }}>
            {[
              { label: 'Strike', value: '25–35 delta OTM', desc: 'Roughly 5–10% above current stock price. Gives room to run.' },
              { label: 'DTE', value: '30–45 days', desc: 'Optimal theta-per-gamma-risk zone.' },
              { label: 'Min credit', value: '2%+ of stock price/mo', desc: 'E.g., stock at $150 → collect ≥ $3.00 ($300/contract).' },
              { label: 'IVR check', value: '> 25 preferred', desc: 'Skip this cycle if IVR < 15 — premium too thin.' },
            ].map(({ label, value, desc }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </StepCard>

        <StepCard number={4} title="Manage Each Cycle (The Dynamic Part)" color="#8b5cf6">
          <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            This is what makes the PMCC "dynamic" — you don't passively wait. Each 30–45 day cycle requires a decision. Use the Interactive Decision Tool below to navigate your specific situation.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { trigger: 'Short call hits 50% profit early', action: 'Close it, immediately sell a fresh 30–45 DTE call. Reset the theta clock.', color: '#10b981' },
              { trigger: 'Short call expires OTM', action: 'Sell a new OTM call for the next cycle. Check IVR first.', color: '#10b981' },
              { trigger: 'Stock rises toward your short strike', action: 'Roll up & out for a credit: buy back short, sell higher strike / further expiry.', color: '#f59e0b' },
              { trigger: 'Short call is ITM near expiry', action: 'Roll to next cycle at same or +1 strike for credit. Never pay to roll.', color: '#f59e0b' },
              { trigger: 'Stock drops 10–20%', action: 'Stop selling short calls. Hold LEAPS for recovery. Re-enter when stock stabilizes.', color: '#ef4444' },
            ].map(({ trigger, action, color }) => (
              <div key={trigger} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ width: 3, borderRadius: 2, background: color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-h)', marginBottom: 3 }}>{trigger}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>→ {action}</div>
                </div>
              </div>
            ))}
          </div>
        </StepCard>

        <StepCard number={5} title="Exit the Position" color="#ef4444">
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
            Always exit both legs simultaneously. Close the short call and sell the LEAPS at the same time (as a spread order if possible). Never let the LEAPS expire — it has extrinsic value until the last day.
          </p>
          <div className="g-3" style={{ gap: 10 }}>
            {[
              { title: 'Profitable exit', desc: 'Stock above short strike + spread at near-max value → close both, reinvest in fresh PMCC higher up.', color: '#10b981' },
              { title: 'Time-based exit', desc: 'LEAPS has 60–90 days left → roll the entire spread: sell current LEAPS, buy new LEAPS further out.', color: '#6366f1' },
              { title: 'Stop loss exit', desc: 'LEAPS loses 50% of purchase price → exit everything. Short call credit offsets some of the loss.', color: '#ef4444' },
            ].map(({ title, desc, color }) => (
              <div key={title} style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 8, borderTop: `2px solid ${color}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 6 }}>{title}</div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </StepCard>
      </section>

      {/* Interactive calculator */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Live Position Calculator" color="#6366f1" />
        <SetupCalculator />
      </section>

      {/* Decision tree */}
      <section style={{ marginBottom: 40 }}>
        <SectionHeader title="Interactive Decision Tool" color="#8b5cf6" />
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
          Use this to navigate any situation your PMCC runs into. Answer the questions to get the recommended next action for your specific scenario.
        </p>
        <DecisionTree />
      </section>

      {/* Key rules summary */}
      <section style={{ marginBottom: 24 }}>
        <SectionHeader title="The 6 Hard Rules" color="#ef4444" />
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: '1', rule: 'Short call strike > LEAPS strike, always.', why: 'If the short call is exercised, your LEAPS must be able to cover it. A short strike below the long strike = undefined risk.' },
              { n: '2', rule: 'LEAPS expires after the short call, always.', why: 'The LEAPS must be alive to cover assignment. Check this on every roll.' },
              { n: '3', rule: 'Never roll for a debit.', why: 'Rolling to a wider spread position at a net debit means you are paying to increase your risk. If no credit is available, close the spread.' },
              { n: '4', rule: 'Only enter when IVR > 20.', why: 'At low IVR the short call premium is too thin to justify the position. The LEAPS theta drag will outpace what you collect.' },
              { n: '5', rule: 'Don\'t sell calls against a dropping LEAPS.', why: 'Selling OTM calls when the stock is falling caps your upside exactly when you need it most for recovery. Hold until the stock stabilizes.' },
              { n: '6', rule: 'Stop loss: exit when LEAPS loses 50% of purchase price.', why: 'A damaged LEAPS with low delta provides poor leverage and slow recovery. Fresh capital in a new position has better expected value.' },
            ].map(({ n, rule, why }) => (
              <div key={n} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ef444420', border: '1px solid #ef444440', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', marginBottom: 3 }}>{rule}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{why}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
