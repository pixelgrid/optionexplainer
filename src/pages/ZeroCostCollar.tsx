import { useState, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Legend,
} from 'recharts';

// ── Shared styles ──────────────────────────────────────────────────────────

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '20px 24px',
  ...style,
});

const CHART = {
  tooltip: {
    contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-h)' },
  },
  grid: { strokeDasharray: '3 3', stroke: 'var(--border)' },
  xAxis: { tick: { fill: 'var(--text-muted)', fontSize: 11 }, tickLine: false, axisLine: { stroke: 'var(--border)' } },
  yAxis: { tick: { fill: 'var(--text-muted)', fontSize: 11 }, tickLine: false, axisLine: false },
};

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 40 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-h)' }}>{title}</h2>
    </div>
  );
}

function KeyBox({ label, value, sub, color = '#818cf8' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
      <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 5 }}>{label}</div>
      <div style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function RiskCard({ title, body, severity }: { title: string; body: string; severity: 'warn' | 'info' | 'critical' }) {
  const cfg = {
    warn:     { bg: '#f59e0b10', border: '#f59e0b40', dot: '#f59e0b', title: '#fcd34d' },
    info:     { bg: '#6366f110', border: '#6366f140', dot: '#818cf8', title: '#a5b4fc' },
    critical: { bg: '#ef444410', border: '#ef444440', dot: '#ef4444', title: '#fca5a5' },
  }[severity];
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        <div style={{ color: cfg.title, fontWeight: 700, fontSize: 13 }}>{title}</div>
      </div>
      <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'var(--text)', fontSize: 13 }}>{label}</span>
        <span style={{ color: '#818cf8', fontWeight: 700 }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#6366f1' }} />
    </div>
  );
}

// ── Collar payoff math ─────────────────────────────────────────────────────

function collarPnl(price: number, spot: number, put: number, call: number): number {
  const stockPnl = price - spot;
  if (price <= put) return put - spot;          // protected floor
  if (price >= call) return call - spot;        // capped ceiling
  return stockPnl;                              // participation zone
}

function nakedPnl(price: number, spot: number): number {
  return price - spot;
}

function buildChartData(spot: number, put: number, call: number) {
  const lo = spot * 0.40;
  const hi = spot * 2.20;
  const steps = 120;
  const data = [];
  for (let i = 0; i <= steps; i++) {
    const price = lo + (hi - lo) * (i / steps);
    data.push({
      price: +price.toFixed(0),
      naked: +(nakedPnl(price, spot)).toFixed(0),
      collar: +(collarPnl(price, spot, put, call)).toFixed(0),
    });
  }
  return data;
}

// Format large dollar amounts
function fmtDollar(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : n > 0 ? '+' : '';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

// ── SNDK leg table data ────────────────────────────────────────────────────

const SNDK_LEGS = [
  { leg: 'Long Stock',           strike: '~$1,684',  purpose: 'Core long position',             note: 'Entry / current spot' },
  { leg: 'Buy June 2027 Put',    strike: '$1,480',   purpose: 'Downside floor (12% OTM)',        note: 'Costs ~X premium' },
  { leg: 'Sell June 2027 Call',  strike: '$2,480',   purpose: 'Funds the put (47% OTM)',         note: 'Receives ~X premium' },
  { leg: 'Net Cost',             strike: '~$0',      purpose: 'Zero-cost structure',             note: 'Skew makes this possible' },
];

// ── Skew comparison visual data ────────────────────────────────────────────

const SKEW_NORMAL  = [
  { delta: '-40Δ put', iv: 38 }, { delta: '-25Δ put', iv: 30 }, { delta: 'ATM', iv: 24 },
  { delta: '+25Δ call', iv: 20 }, { delta: '+40Δ call', iv: 18 },
];
const SKEW_MOMENTUM = [
  { delta: '-40Δ put', iv: 28 }, { delta: '-25Δ put', iv: 24 }, { delta: 'ATM', iv: 30 },
  { delta: '+25Δ call', iv: 42 }, { delta: '+40Δ call', iv: 56 },
];

// ── Main page ──────────────────────────────────────────────────────────────

export function ZeroCostCollar() {
  const [spot, setSpot]       = useState(1684);
  const [putPct, setPutPct]   = useState(12);   // % below spot
  const [callPct, setCallPct] = useState(47);   // % above spot

  const putStrike  = useMemo(() => Math.round(spot * (1 - putPct / 100)), [spot, putPct]);
  const callStrike = useMemo(() => Math.round(spot * (1 + callPct / 100)), [spot, callPct]);
  const maxLoss    = putStrike - spot;          // negative
  const maxGain    = callStrike - spot;         // positive
  const rwRatio    = Math.abs(maxGain / maxLoss);

  const chartData = useMemo(
    () => buildChartData(spot, putStrike, callStrike),
    [spot, putStrike, callStrike]
  );

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ background: '#6366f120', color: '#818cf8', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, letterSpacing: '0.06em' }}>ADVANCED</span>
          <span style={{ background: '#10b98120', color: '#10b981', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5, letterSpacing: '0.06em' }}>HEDGING</span>
        </div>
        <h1 style={{ margin: '0 0 10px', color: 'var(--text-h)', fontSize: 'clamp(24px,5vw,34px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Zero-Cost Collar
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
          A collar where the premium from the short call <em>exactly funds</em> the long put — net cost $0.
          On parabolic momentum stocks, extreme positive call skew makes this possible at strike distances
          that would be impossible on a normal stock.
        </p>
      </div>

      {/* ── What is it ── */}
      <div style={card({ marginBottom: 24 })}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ color: '#818cf8', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>STANDARD COLLAR</div>
            <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>
              Long stock + long put + short call. The put costs money; the call rebate partially offsets it.
              Typical result: <span style={{ color: '#f59e0b' }}>net debit</span> — you pay for the hedge.
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
            <div style={{ color: '#10b981', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>ZERO-COST COLLAR</div>
            <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>
              Same structure, but call premium <strong style={{ color: 'var(--text-h)' }}>exactly funds</strong> the put.
              Net cost = $0. Only possible when call skew is extreme — calls priced significantly
              richer than equidistant puts.
            </div>
          </div>
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
            <div style={{ color: '#6366f1', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>THE EDGE</div>
            <div style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7 }}>
              On a momentum stock where skew is inverted, you can sell a call <strong style={{ color: 'var(--text-h)' }}>far OTM</strong> (20–50% above spot)
              and still collect enough to buy a meaningful put (10–15% below spot). On a normal stock,
              zero-cost would mean selling a call <em>near the money</em>, giving up almost all upside.
            </div>
          </div>
        </div>
      </div>

      {/* ── SNDK Leg Table ── */}
      <SectionHeader title="The SNDK Blueprint — Concrete Example" color="#10b981" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '-8px 0 16px' }}>
        SNDK ran +4,500% over several years and ~+80% in a single month. At peak momentum,
        call IV exceeded put IV at every strike — an inverted skew that funded this exact structure.
      </p>
      <div style={card({ padding: 0, marginBottom: 16 })}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Leg', 'Strike / Level', 'Purpose', 'Detail'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SNDK_LEGS.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 16px', color: 'var(--text-h)', fontWeight: 600 }}>{r.leg}</td>
                  <td style={{ padding: '11px 16px', color: '#818cf8', fontFamily: 'monospace', fontWeight: 700 }}>{r.strike}</td>
                  <td style={{ padding: '11px 16px', color: 'var(--text)' }}>{r.purpose}</td>
                  <td style={{ padding: '11px 16px', color: '#475569', fontSize: 12 }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 8 }}>
        <KeyBox label="DOWNSIDE RISK" value="−12%" sub="$1,684 → $1,480" color="#ef4444" />
        <KeyBox label="UPSIDE POTENTIAL" value="+47%" sub="$1,684 → $2,480" color="#10b981" />
        <KeyBox label="RISK / REWARD" value="1 : 3.9" sub="$204 risk vs $796 gain" color="#818cf8" />
        <KeyBox label="NET PREMIUM" value="$0" sub="Call funds the put" color="#f59e0b" />
        <KeyBox label="EXPIRY" value="Jun 2027" sub="383 days of time" color="var(--text-muted)" />
        <KeyBox label="IV AT SETUP" value="~103%" sub="60th+ IV percentile" color="#f59e0b" />
      </div>

      {/* ── Interactive Payoff Diagram ── */}
      <SectionHeader title="Interactive Payoff Diagram" color="#6366f1" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '-8px 0 16px' }}>
        Adjust the parameters to model any stock. The collar line shows your actual P&amp;L at expiry
        vs holding naked stock. Default values match the SNDK example.
      </p>
      <div style={card({ marginBottom: 20 })}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
          <Slider label="Stock Price (spot)" value={spot} min={50} max={5000} step={10}
            onChange={setSpot} fmt={v => `$${v.toLocaleString()}`} />
          <Slider label="Put Strike (% OTM below)" value={putPct} min={3} max={25} step={1}
            onChange={setPutPct} fmt={v => `${v}% → $${putStrike.toLocaleString()}`} />
          <Slider label="Call Strike (% OTM above)" value={callPct} min={5} max={80} step={1}
            onChange={setCallPct} fmt={v => `${v}% → $${callStrike.toLocaleString()}`} />
        </div>

        {/* Key levels strip */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Max Loss', value: fmtDollar(maxLoss) + '/sh', color: '#ef4444', sub: `if price ≤ $${putStrike.toLocaleString()}` },
            { label: 'Max Gain', value: fmtDollar(maxGain) + '/sh', color: '#10b981', sub: `if price ≥ $${callStrike.toLocaleString()}` },
            { label: 'Risk : Reward', value: `1 : ${rwRatio.toFixed(1)}`, color: '#818cf8', sub: 'at expiry' },
            { label: 'Participation Range', value: `$${putStrike.toLocaleString()} – $${callStrike.toLocaleString()}`, color: '#f59e0b', sub: 'full delta exposure' },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, minWidth: 120 }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>{k.label}</div>
              <div style={{ color: k.color, fontSize: 17, fontWeight: 700 }}>{k.value}</div>
              <div style={{ color: '#475569', fontSize: 11 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid {...CHART.grid} />
            <XAxis dataKey="price" {...CHART.xAxis}
              tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
              type="number" domain={['dataMin', 'dataMax']} scale="linear" />
            <YAxis {...CHART.yAxis} tickFormatter={v => fmtDollar(v)} />
            <Tooltip
              {...CHART.tooltip}
              formatter={(v: unknown, name: unknown) => [fmtDollar(v as number) + ' per share', name === 'collar' ? 'Collar P&L' : 'Naked Stock P&L']}
              labelFormatter={v => `Stock @ $${Number(v).toLocaleString()}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
              formatter={(v: string) => v === 'collar' ? 'Zero-Cost Collar' : 'Naked Stock'} />

            {/* Zone shading */}
            <ReferenceArea x1={chartData[0]?.price} x2={putStrike} fill="#ef444408" />
            <ReferenceArea x1={putStrike} x2={callStrike} fill="#10b98108" />
            <ReferenceArea x1={callStrike} x2={chartData[chartData.length - 1]?.price} fill="#f59e0b08" />

            {/* Reference lines */}
            <ReferenceLine x={spot} stroke="var(--text-muted)" strokeDasharray="4 3"
              label={{ value: 'Spot', fill: 'var(--text-muted)', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine x={putStrike} stroke="#ef444480" strokeDasharray="4 3"
              label={{ value: 'Put', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine x={callStrike} stroke="#f59e0b80" strokeDasharray="4 3"
              label={{ value: 'Call', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }} />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />

            <Line type="monotone" dataKey="naked" stroke="#475569" strokeWidth={1.5}
              strokeDasharray="6 3" dot={false} name="naked" />
            <Line type="monotone" dataKey="collar" stroke="#6366f1" strokeWidth={2.5}
              dot={false} name="collar" />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Zone legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: '#ef4444', label: 'Protected zone', desc: `Below $${putStrike.toLocaleString()} — max loss capped at ${fmtDollar(maxLoss)}/sh` },
            { color: '#10b981', label: 'Participation zone', desc: `$${putStrike.toLocaleString()} – $${callStrike.toLocaleString()} — full delta like naked stock` },
            { color: '#f59e0b', label: 'Capped zone', desc: `Above $${callStrike.toLocaleString()} — you're locked out, upside stays at ${fmtDollar(maxGain)}/sh` },
          ].map(z => (
            <div key={z.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: z.color, flexShrink: 0, marginTop: 3 }} />
              <div>
                <div style={{ color: z.color, fontSize: 11, fontWeight: 700 }}>{z.label}</div>
                <div style={{ color: '#475569', fontSize: 11 }}>{z.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Why the Math Works ── */}
      <SectionHeader title="Why the Math Works — The Skew Explanation" color="#8b5cf6" />
      <div style={card({ marginBottom: 20 })}>
        <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7, margin: '0 0 20px' }}>
          On a normal stock, the IV surface has a <strong style={{ color: 'var(--text-h)' }}>"smirk"</strong> — put IV is higher than call IV
          at equidistant strikes. Everyone wants crash protection, so OTM puts are bid up.
          On a parabolic momentum stock, this <strong style={{ color: 'var(--text-h)' }}>inverts</strong>: call IV exceeds put IV at every
          strike because momentum chasers are paying up for leveraged upside exposure.
          You're selling that elevated call premium and using it to buy crash insurance.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Normal stock skew */}
          <div>
            <div style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
              NORMAL STOCK — Put Skew (Smirk)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <ComposedChart data={SKEW_NORMAL} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...CHART.grid} />
                <XAxis dataKey="delta" {...CHART.xAxis} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis {...CHART.yAxis} domain={[15, 45]} />
                <Tooltip {...CHART.tooltip} formatter={(v: unknown) => [`${v as number}%`, 'IV']} />
                <Line type="monotone" dataKey="iv" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>
              Put IV &gt; Call IV at every strike. To get zero-cost, you'd sell a near-money call — giving up almost all upside.
            </div>
          </div>

          {/* Momentum stock skew */}
          <div>
            <div style={{ color: '#10b981', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 10 }}>
              MOMENTUM STOCK — Inverted Skew (SNDK-style)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <ComposedChart data={SKEW_MOMENTUM} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...CHART.grid} />
                <XAxis dataKey="delta" {...CHART.xAxis} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis {...CHART.yAxis} domain={[15, 65]} />
                <Tooltip {...CHART.tooltip} formatter={(v: unknown) => [`${v as number}%`, 'IV']} />
                <Line type="monotone" dataKey="iv" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6 }}>
              Call IV &gt; Put IV. A far OTM call (47% away) generates enough premium to fund a meaningful put (12% OTM) at zero cost.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, background: '#6366f110', border: '1px solid #6366f130', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ color: '#818cf8', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>What You're Actually Doing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-h)' }}>Selling:</strong> Momentum convexity — specifically,
                the right for other traders to capture gains above $2,480. These buyers are momentum chasers
                paying elevated call IV to get leveraged upside.
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-h)' }}>Buying:</strong> Crash insurance funded by those
                same buyers. The market isn't mispriced — it's pricing a genuinely fat-tailed distribution.
                You're just choosing which slice of that distribution suits your risk tolerance.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hidden Costs & Risks ── */}
      <SectionHeader title="What 'Zero Cost' Glosses Over — Hidden Risks" color="#ef4444" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '-8px 0 16px', lineHeight: 1.6 }}>
        The structure looks clean on paper. These are the four things most explanations skip.
      </p>
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <RiskCard
          severity="critical"
          title="1. Opportunity Cost Is Enormous"
          body="SNDK went from $1,200 to $1,700 in May alone — exactly the kind of move the collar is designed to capture in full. But if it goes to $3,500, you're capped at $2,480. You participated in the entire run to get here, then gave away the best part of future upside. The collar trades realized convexity for insurance. On a stock that keeps making parabolic moves, this is a serious penalty."
        />
        <RiskCard
          severity="warn"
          title="2. The Put Barely Moves Early On — Theta Bleed"
          body="At 103% IV and 383 days to expiry, the $1,480 put is almost entirely extrinsic value. If SNDK drops 15% tomorrow, the put's mark-to-market barely reflects it — theta is eating your hedge. You don't feel the protection in P&L until you're deep through the strike near expiry, or you unwind the whole position. Your hedge is real at expiration but slow to manifest mid-life."
        />
        <RiskCard
          severity="critical"
          title="3. You're Implicitly Betting Realized Vol < Implied Vol"
          body="103% IV over 383 days is a massive vol hurdle. If SNDK grinds sideways — or moves less than priced — both legs decay and your net position is fine. But if it rips to $3,000, you're locked out. If it crashes to $800, you're protected but sitting on a psychological nightmare as you watch a stock you believed in protected at $1,480 when you could have sold at $1,684. The structure requires discipline on both ends."
        />
        <RiskCard
          severity="warn"
          title="4. Behavioral Difficulty — The Hardest Part"
          body="The structure can look clean on paper, but the trader still has to accept the capped upside and leave the protection alone when price starts moving fast. SNDK moves 5–10% in a single day. Watching it run through $2,480 and knowing you're capped is extremely hard to sit through. Most people who implement this will prematurely unwind one leg — usually the call — destroying the structure. The zero-cost collar requires you to commit and not manage it tactically."
        />
      </div>

      {/* ── Who It's Actually For ── */}
      <div style={card({ marginBottom: 24, background: '#10b98108', border: '1px solid #10b98125' })}>
        <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Who This Strategy Makes Sense For</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { title: '✓ Existing shareholders with large gains', body: 'You\'ve ridden the stock from $36 to $1,684. You don\'t need more upside beyond $2,480 to have a life-changing return. Protecting the gain at zero cost is rational.' },
            { title: '✓ Concentrated position holders', body: 'If SNDK is 40%+ of your portfolio, a 50% drawdown is catastrophic. The collar caps max loss and lets you sleep at night without selling the position and triggering a massive tax event.' },
            { title: '✗ Momentum chasers entering fresh', body: 'If you\'re new to the stock at $1,684, you\'re entering for the upside story. Capping at $2,480 (47% up) may still sound like a lot, but you\'re taking on all the downside risk of a new position with capped reward.' },
          ].map(i => (
            <div key={i.title}>
              <div style={{ color: 'var(--text-h)', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{i.title}</div>
              <div style={{ color: 'var(--text)', fontSize: 12, lineHeight: 1.6 }}>{i.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How to Find Similar Setups ── */}
      <SectionHeader title="How to Find Similar Setups" color="#f59e0b" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '-8px 0 16px', lineHeight: 1.6 }}>
        You're looking for stocks where positive call skew is extreme — calls significantly more expensive
        than equidistant puts. This 15-minute workflow systematically surfaces candidates.
      </p>

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        {/* Screening criteria table */}
        <div style={card({ padding: 0 })}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', color: '#f59e0b', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
            SCREENING CRITERIA
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['What to look for', 'Why it matters', 'Threshold'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['High IV rank / IV percentile', 'Rich overall premium — both sides elevated', '>60% IV rank'],
                  ['Positive skew (25Δ call IV > 25Δ put IV)', 'Calls specifically bid vs puts — the inversion needed', 'Call IV > Put IV at 25Δ'],
                  ['Parabolic recent move', 'Momentum chasers drive up call demand', '>100% in 3–12 months'],
                  ['Long DTE available', 'Zero-cost collar needs time for skew to persist', '6–18 months expiry'],
                  ['Liquid options market', 'Need tight bid-ask to execute both legs fairly', 'OI > 500 at target strikes'],
                ].map(([what, why, threshold], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-h)' }}>{what}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text)' }}>{why}</td>
                    <td style={{ padding: '10px 16px', color: '#f59e0b', fontFamily: 'monospace', fontSize: 12 }}>{threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tools */}
        <div style={card()}>
          <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 12 }}>TOOLS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { tool: 'Market Chameleon', use: 'Skew tab per ticker — compare 25Δ call vs 25Δ put IV. Look for call IV exceeding put IV, which is unusual.' },
              { tool: 'Barchart.com', use: 'Options screener → filter IV rank >70% → manually check skew on each candidate.' },
              { tool: 'OptionStrat.com', use: 'Build the collar with real strikes and see if it prices at net zero or near-zero premium.' },
              { tool: 'Unusualwhales.com', use: 'Options flow — heavy OTM call buying on a momentum name signals elevated call IV to investigate.' },
            ].map(t => (
              <div key={t.tool} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{t.tool}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{t.use}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 15-min workflow */}
        <div style={card()}>
          <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>15-MINUTE SCREENING WORKFLOW</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { step: '1', action: 'Pull stocks up >150% YTD on Finviz', detail: 'Screener → Performance → YTD > 100%. This is your candidate universe.' },
              { step: '2', action: 'Check IV rank on Barchart or Market Chameleon', detail: 'Filter for IV rank >60%. Eliminate anything below — skew won\'t be rich enough to fund the put.' },
              { step: '3', action: 'Compare 10% OTM put vs 40–50% OTM call premium', detail: 'At the same expiry. If call premium ≥ put premium → potential zero-cost collar candidate.' },
              { step: '4', action: 'Verify skew is actually inverted', detail: 'Pull the vol surface on Market Chameleon. Confirm 25Δ call IV > 25Δ put IV. This is your green light.' },
              { step: '5', action: 'Build on OptionStrat and check liquidity', detail: 'Model the actual collar. Check OI at your target strikes. Aim for bid-ask spreads < 1% of stock price.' },
            ].map(w => (
              <div key={w.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f59e0b20', border: '1px solid #f59e0b50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {w.step}
                </div>
                <div>
                  <div style={{ color: 'var(--text-h)', fontSize: 13, fontWeight: 600 }}>{w.action}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>{w.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Current Candidates ── */}
      <SectionHeader title="What to Look for Now" color="#818cf8" />
      <div style={card({ marginBottom: 32 })}>
        <p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.7, margin: '0 0 14px' }}>
          The SNDK post explicitly names <strong style={{ color: 'var(--text-h)' }}>$MU (Micron)</strong> as an
          "even more extreme" candidate — a high-IV cyclical memory semiconductor that historically shows
          strong positive skew when momentum is running. The general formula:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Sector', value: 'Semis / AI / Momentum tech', color: '#818cf8' },
            { label: 'Price move', value: '+200% in 12 months', color: '#10b981' },
            { label: 'IV level', value: '>80% absolute', color: '#f59e0b' },
            { label: 'IV rank', value: '>60th percentile', color: '#f59e0b' },
            { label: 'Call skew', value: '25Δ call > 25Δ put', color: '#10b981' },
            { label: 'DTE', value: '6–18 months (LEAPS)', color: '#818cf8' },
          ].map(i => (
            <div key={i.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 3 }}>{i.label}</div>
              <div style={{ color: i.color, fontSize: 13, fontWeight: 600 }}>{i.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary ── */}
      <div style={card({ background: '#6366f110', border: '1px solid #6366f130' })}>
        <div style={{ color: '#818cf8', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Key Takeaways</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            ['The zero cost is real but narrow', 'You pay $0 in premium. But you pay in capped upside, early theta drag on the put, and behavioral difficulty. "Free" is a framing, not a free lunch.'],
            ['Inverted skew is the structural enabler', 'This only works on stocks where momentum chasers have bid up call IV above put IV. This is rare — maybe 5–10 names at any time. It is not always available.'],
            ['Best for large unrealized gain holders', 'If you\'ve 10x\'d a stock and want to stay long without accepting full downside, a zero-cost collar is a genuinely smart structure. The upside cap hurts less when you\'ve already made 1,000%.'],
            ['Commit or don\'t do it', 'The structure only works if you leave both legs on. Most people unwind the short call when the stock runs, destroying the hedge and turning a collar into a naked long put they paid nothing for.'],
          ].map(([title, body], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < 3 ? '1px solid #6366f120' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 6 }} />
              <div>
                <span style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: 13 }}>{title} — </span>
                <span style={{ color: 'var(--text)', fontSize: 13 }}>{body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
