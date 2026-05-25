import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { blackScholes } from '../lib/blackScholes';

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: '#1e2130' },
  xAxis: { stroke: '#2a2d3e', tick: { fill: '#64748b', fontSize: 11 } },
  yAxis: { stroke: '#2a2d3e', tick: { fill: '#64748b', fontSize: 11 } },
  tooltip: { contentStyle: { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 13 } },
};

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>{title}</h2>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

// IV behavior around earnings: ~4 weeks of data
const ivEarningsData = [
  { day: -28, iv: 28 }, { day: -25, iv: 27 }, { day: -21, iv: 29 },
  { day: -18, iv: 30 }, { day: -15, iv: 31 }, { day: -12, iv: 34 },
  { day: -10, iv: 36 }, { day: -8, iv: 40 }, { day: -7, iv: 44 },
  { day: -5, iv: 50 }, { day: -4, iv: 55 }, { day: -3, iv: 60 },
  { day: -2, iv: 65 }, { day: -1, iv: 72 },
  { day: 0, iv: 70 }, // earnings day itself — IV peaks
  { day: 1, iv: 28 }, { day: 3, iv: 26 }, { day: 5, iv: 25 },
  { day: 7, iv: 24 }, { day: 10, iv: 24 }, { day: 14, iv: 23 },
  { day: 21, iv: 22 }, { day: 28, iv: 23 },
];

export function Earnings() {
  const [ivInput, setIvInput] = useState(60);
  const [dteInput, setDteInput] = useState(1);
  const stockPrice = 100;

  const impliedMove = useMemo(() => {
    const iv = ivInput / 100;
    const t = dteInput / 365;
    const oneSD = iv * Math.sqrt(t) * stockPrice;
    const twoSD = 2 * oneSD;
    return { oneSD: +oneSD.toFixed(2), twoSD: +twoSD.toFixed(2) };
  }, [ivInput, dteInput]);

  // IV crush example: stock at 100, IV 60%, ATM straddle
  const straddlePreEarnings = useMemo(() => {
    const call = blackScholes({ S: 100, K: 100, T: 1 / 365, r: 0.05, sigma: 0.60 });
    const put = blackScholes({ S: 100, K: 100, T: 1 / 365, r: 0.05, sigma: 0.60 });
    return { straddle: +(call.call + put.put).toFixed(2) };
  }, []);

  // Post-earnings: stock at 105, IV collapses to 25%
  const straddlePostEarnings5 = useMemo(() => {
    const call = blackScholes({ S: 105, K: 100, T: 1 / 365, r: 0.05, sigma: 0.25 });
    const put = blackScholes({ S: 105, K: 100, T: 1 / 365, r: 0.05, sigma: 0.25 });
    return { straddle: +(call.call + put.put).toFixed(2) };
  }, []);

  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
        Earnings Playbook
      </h1>
      <p style={{ margin: '0 0 40px', color: '#64748b', fontSize: 15, lineHeight: 1.7 }}>
        Earnings announcements are the most intense, high-IV events in options trading. The potential for large profits and large losses is equally high. This playbook covers everything you need to trade earnings intelligently — or avoid it entirely.
      </p>

      {/* Section 1: IV Behavior Around Earnings */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="IV Behavior Around Earnings" color="#8b5cf6" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          The pattern is highly predictable: IV begins rising slowly about 2 weeks before earnings, accelerates sharply in the final 3–5 days, peaks on earnings day itself, then collapses immediately after the news resolves. This behavior is known as the "volatility crush" and it's so reliable that entire strategies are built around it.
        </p>
        <Card>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ivEarningsData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="day" {...CHART_STYLE.xAxis} label={{ value: 'Days from Earnings', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[15, 80]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`, 'IV']; }} />
              <ReferenceLine x={0} stroke="#f59e0b" strokeWidth={2} label={{ value: 'Earnings', fill: '#f59e0b', fontSize: 11, position: 'top' }} />
              <Line type="monotone" dataKey="iv" name="Implied Volatility" stroke="#8b5cf6" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            IV nearly triples in the 4 weeks before earnings and collapses 60%+ in a single day after the announcement.
          </p>
        </Card>
      </section>

      {/* Section 2: Implied Move Calculator */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="The Implied Move" color="#6366f1" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          The "implied move" is the market's expected 1-standard-deviation price range for an earnings event. Formula: <code style={{ background: '#0f1117', padding: '2px 6px', borderRadius: 4, fontSize: 12, color: '#e2e8f0' }}>±Move ≈ IV × √(DTE/365) × Stock Price</code>. This tells you how much the market is pricing in for the event. If the actual move exceeds the implied move, long straddle buyers profit; if it falls short, they lose.
        </p>
        <Card>
          <div className="g-2" style={{ gap: 20, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>IV %</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{ivInput}%</span>
              </div>
              <input type="range" min={10} max={150} value={ivInput} onChange={(e) => setIvInput(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>DTE (to event)</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>{dteInput}d</span>
              </div>
              <input type="range" min={1} max={30} value={dteInput} onChange={(e) => setDteInput(Number(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
          </div>
          <div className="g-3" style={{ background: '#0f1117', borderRadius: 8, padding: '16px 20px', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Stock Price</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>$100</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>±1σ Move</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1', fontFamily: 'monospace' }}>±${impliedMove.oneSD}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>±2σ Move</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#8b5cf6', fontFamily: 'monospace' }}>±${impliedMove.twoSD}</div>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569' }}>
            If the stock moves less than ±${impliedMove.oneSD} ({(impliedMove.oneSD / 100 * 100).toFixed(1)}%), options buyers lose money approximately 68% of the time at 1σ pricing.
          </p>
        </Card>
      </section>

      {/* Section 3: Strategy Selection */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Strategy Selection Table" color="#10b981" />
        <Card style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #2a2d3e' }}>
                {['Market View', 'Strategy', 'When to Enter', 'Risk / Reward', 'Notes'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  view: 'Big move, unknown direction', strategy: 'Long Straddle / Strangle', when: 'BEFORE earnings, when IVR < 50', rr: 'Unlimited / Limited', notes: 'Buy BEFORE IV spikes; risk is IV crush if move is small', color: '#8b5cf6',
                },
                {
                  view: 'Small move expected', strategy: 'Short Straddle / Iron Condor', when: 'BEFORE earnings, IVR > 70', rr: 'Limited / Limited', notes: 'Profits if stock stays within range; assignment risk on naked', color: '#10b981',
                },
                {
                  view: 'Strong directional + big move', strategy: 'Long Call or Put', when: 'Well BEFORE earnings spike begins', rr: 'High / 100% premium', notes: 'IV crush will hurt significantly; size very small', color: '#6366f1',
                },
                {
                  view: 'Directional + moderate move', strategy: 'Debit Spread (Bull/Bear)', when: 'Before earnings, IVR < 60', rr: 'Limited / Limited', notes: 'The long leg benefits from direction; short leg reduces IV exposure', color: '#f59e0b',
                },
                {
                  view: 'Don\'t want to guess direction', strategy: 'Sit it out / Close positions', when: '1 day before earnings', rr: 'N/A', notes: 'Often the best play for premium sellers — avoid the binary event entirely', color: '#64748b',
                },
              ].map((row, i) => (
                <tr key={row.strategy} style={{ borderBottom: '1px solid #1e2130', background: i % 2 === 0 ? 'transparent' : '#ffffff04' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#94a3b8' }}>{row.view}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: row.color }}>{row.strategy}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{row.when}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{row.rr}</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* Section 4: IV Crush Example */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="IV Crush Example — The Math" color="#ef4444" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          This is the most important thing to understand about earnings trading. Let's walk through the numbers step by step.
        </p>
        <div className="g-2" style={{ gap: 16, marginBottom: 20 }}>
          <Card style={{ borderTop: '3px solid #6366f1' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6366f1', marginBottom: 12 }}>Before Earnings</div>
            {[
              { label: 'Stock Price', value: '$100', color: '#e2e8f0' },
              { label: 'IV', value: '60%', color: '#ef4444' },
              { label: 'ATM Call (1 DTE)', value: `$${blackScholes({ S: 100, K: 100, T: 1/365, r: 0.05, sigma: 0.60 }).call.toFixed(2)}`, color: '#10b981' },
              { label: 'ATM Put (1 DTE)', value: `$${blackScholes({ S: 100, K: 100, T: 1/365, r: 0.05, sigma: 0.60 }).put.toFixed(2)}`, color: '#ef4444' },
              { label: 'Straddle Cost', value: `$${straddlePreEarnings.straddle}`, color: '#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e2130' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</span>
              </div>
            ))}
          </Card>
          <Card style={{ borderTop: '3px solid #ef4444' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>After Earnings — Stock +5%, IV Crushes</div>
            {[
              { label: 'Stock Price', value: '$105 (+5%)', color: '#10b981' },
              { label: 'IV (after crush)', value: '25%', color: '#10b981' },
              { label: 'Call (105 stock, 25% IV)', value: `$${blackScholes({ S: 105, K: 100, T: 1/365, r: 0.05, sigma: 0.25 }).call.toFixed(2)}`, color: '#10b981' },
              { label: 'Put (105 stock, 25% IV)', value: `$${blackScholes({ S: 105, K: 100, T: 1/365, r: 0.05, sigma: 0.25 }).put.toFixed(2)}`, color: '#ef4444' },
              { label: 'Straddle Value', value: `$${straddlePostEarnings5.straddle}`, color: '#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1e2130' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: 'monospace' }}>{value}</span>
              </div>
            ))}
          </Card>
        </div>
        <div style={{ padding: '16px 20px', background: '#ef444418', border: '1px solid #ef444440', borderRadius: 10, fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>
          <strong style={{ color: '#ef4444' }}>Result:</strong> You paid ${straddlePreEarnings.straddle} for the straddle. After a +5% gap up, it's worth ${straddlePostEarnings5.straddle}. You <strong style={{ color: '#ef4444' }}>lost ${(straddlePreEarnings.straddle - straddlePostEarnings5.straddle).toFixed(2)} ({(((straddlePreEarnings.straddle - straddlePostEarnings5.straddle) / straddlePreEarnings.straddle) * 100).toFixed(0)}%)</strong> despite the stock moving in the right direction. The IV collapse from 60% to 25% removed more value than the directional move added. This is why the implied move matters — you needed the stock to move MORE than what the market had already priced in.
        </div>
      </section>

      {/* Section 5: Rules */}
      <section style={{ marginBottom: 24 }}>
        <SectionHeader title="Earnings Trading Rules" color="#f59e0b" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { rule: 'Never hold undefined risk through earnings', color: '#ef4444', text: 'If you\'re short a naked put or naked call and earnings are coming up, close or hedge the position before the event. An unexpected gap against you can be catastrophic.' },
            { rule: 'Premium sellers: close 1 day before', color: '#f59e0b', text: 'If you run short premium strategies (iron condors, credit spreads), close them the day before earnings to avoid the binary risk. Don\'t try to capture the "final day\'s theta" — that last bit of premium isn\'t worth the event risk.' },
            { rule: 'If you\'re buying straddles: buy early', color: '#8b5cf6', text: 'Buy before the IV ramp-up begins (3–4 weeks out) to avoid paying peak IV. By the day before earnings, IV may have already priced in most of the expected move, leaving you little upside even if the stock moves.' },
            { rule: 'Know the implied move before entering', color: '#6366f1', text: 'Calculate the ±1σ implied move. Only trade earnings if you have a strong view that the actual move will significantly exceed (for longs) or fall short of (for short premium) the implied move.' },
            { rule: 'Size smaller for earnings trades', color: '#10b981', text: 'Earnings are binary events with high uncertainty. Use 25–50% of your normal position size. You might be right about the company but wrong about the timing, the IV impact, or the market\'s reaction to "in-line" results.' },
          ].map(({ rule, color, text }) => (
            <div key={rule} style={{ padding: '12px 16px', background: '#1a1d27', borderRadius: 8, borderLeft: `3px solid ${color}`, border: '1px solid #2a2d3e', borderLeftWidth: 3, borderLeftColor: color }}>
              <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 6 }}>{rule}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
