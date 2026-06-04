import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';

const CHART_STYLE = {
  cartesianGrid: { strokeDasharray: '3 3', stroke: 'var(--border)' },
  xAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  yAxis: { stroke: 'var(--border)', tick: { fill: 'var(--text-muted)', fontSize: 11 } },
  tooltip: { contentStyle: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 } },
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
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

// Fabricated IV vs HV data over ~30 data points
const ivHvData = [
  { month: 'Jan', hv: 18, iv: 22 }, { month: 'Jan', hv: 19, iv: 23 },
  { month: 'Feb', hv: 21, iv: 25 }, { month: 'Feb', hv: 23, iv: 24 },
  { month: 'Mar', hv: 25, iv: 28 }, { month: 'Mar', hv: 22, iv: 30 },
  { month: 'Apr', hv: 20, iv: 27 }, { month: 'Apr', hv: 18, iv: 26 },
  { month: 'May', hv: 15, iv: 22 }, { month: 'May', hv: 17, iv: 23 },
  { month: 'Jun', hv: 20, iv: 24 }, { month: 'Jun', hv: 24, iv: 26 },
  { month: 'Jul', hv: 28, iv: 32 }, { month: 'Jul', hv: 26, iv: 34 },
  { month: 'Aug', hv: 22, iv: 30 }, { month: 'Aug', hv: 19, iv: 27 },
  { month: 'Sep', hv: 18, iv: 25 }, { month: 'Sep', hv: 20, iv: 26 },
  { month: 'Oct', hv: 23, iv: 28 }, { month: 'Oct', hv: 27, iv: 35 },
  { month: 'Nov', hv: 30, iv: 38 }, { month: 'Nov', hv: 28, iv: 36 },
  { month: 'Dec', hv: 25, iv: 32 }, { month: 'Dec', hv: 22, iv: 29 },
  { month: 'Jan', hv: 20, iv: 27 }, { month: 'Jan', hv: 19, iv: 25 },
  { month: 'Feb', hv: 18, iv: 24 }, { month: 'Feb', hv: 17, iv: 23 },
  { month: 'Mar', hv: 19, iv: 26 }, { month: 'Mar', hv: 21, iv: 28 },
].map((d, i) => ({ ...d, index: i }));

// Year of daily IV data for IVR section (0–252 trading days)
const ivYearData = Array.from({ length: 252 }, (_, i) => {
  const base = 22;
  const noise = Math.sin(i / 20) * 8 + Math.sin(i / 7) * 4;
  const spike1 = i > 80 && i < 95 ? 12 : 0;
  const spike2 = i > 190 && i < 210 ? 18 : 0;
  return { day: i + 1, iv: Math.max(12, Math.round(base + noise + spike1 + spike2)) };
});
const currentIV = 42;

// IV crush data: IV over time into and out of earnings
const ivCrushData = [
  { label: '-4w', iv: 28, stock: 100 }, { label: '-3w', iv: 31, stock: 100 },
  { label: '-2w', iv: 36, stock: 100 }, { label: '-10d', iv: 42, stock: 100 },
  { label: '-7d', iv: 50, stock: 100 }, { label: '-5d', iv: 56, stock: 100 },
  { label: '-3d', iv: 62, stock: 100 }, { label: '-2d', iv: 68, stock: 100 },
  { label: '-1d', iv: 75, stock: 100 }, { label: 'Earnings', iv: 72, stock: 100 },
  { label: '+1d', iv: 30, stock: 105 }, { label: '+1w', iv: 26, stock: 105 },
  { label: '+2w', iv: 24, stock: 104 }, { label: '+3w', iv: 23, stock: 104 },
];

// Skew data: IV across strikes
const skewData = [
  { strike: 80, iv: 42 }, { strike: 85, iv: 37 }, { strike: 90, iv: 33 },
  { strike: 95, iv: 29 }, { strike: 100, iv: 26 }, { strike: 105, iv: 24 },
  { strike: 110, iv: 23 }, { strike: 115, iv: 22 }, { strike: 120, iv: 22 },
];

export function Volatility() {
  return (
    <div className="page-wrap">
      <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: 'var(--text-h)', letterSpacing: '-0.02em' }}>
        IV &amp; Volatility
      </h1>
      <p style={{ margin: '0 0 40px', color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7 }}>
        Volatility is the lifeblood of options pricing. Understanding the difference between implied and historical volatility, and knowing how to measure whether options are cheap or expensive, is one of the most important edges an options trader can develop.
      </p>

      {/* Section 1: IV vs HV */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Implied vs Historical Volatility" color="#6366f1" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-h)' }}>Historical Volatility (HV)</strong> — also called realized volatility — is calculated from actual past price movements. It's a fact. <strong style={{ color: 'var(--text-h)' }}>Implied Volatility (IV)</strong> is the market's forward-looking estimate of future movement, extracted by back-solving the Black-Scholes equation given the observed option price. When IV &gt; HV, options are considered "expensive" (good time to sell). When IV &lt; HV, options may be "cheap" (consider buying).
        </p>
        <Card>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ivHvData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="index" {...CHART_STYLE.xAxis} label={{ value: 'Time (months)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} tickFormatter={() => ''} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[10, 45]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`]; }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
              <Line type="monotone" dataKey="hv" name="Historical Vol (HV)" stroke="#10b981" dot={false} strokeWidth={2} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="iv" name="Implied Vol (IV)" stroke="#6366f1" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Notice how IV (smooth, forward-looking) consistently runs above HV (jagged, realized) — this is the "volatility risk premium" that premium sellers collect over time.
          </p>
        </Card>
      </section>

      {/* Section 2: IVR / IV Percentile */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="IV Rank &amp; IV Percentile" color="#8b5cf6" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-h)' }}>IV Rank (IVR)</strong> tells you where current IV sits relative to its 52-week high and low: IVR = (current IV − 52w low) / (52w high − 52w low) × 100. An IVR of 80 means IV is near the top of its recent range — a strong signal to sell premium. <strong style={{ color: 'var(--text-h)' }}>IV Percentile</strong> is slightly different: it measures the percentage of days in the past year where IV was below the current level. Both are useful filters for deciding when to be a buyer vs seller of volatility.
        </p>
        <div style={{ padding: '12px 16px', background: '#6366f118', border: '1px solid #6366f130', borderRadius: 8, marginBottom: 16, fontSize: 14, color: 'var(--text)' }}>
          Rule of thumb: <strong style={{ color: '#10b981' }}>IVR &lt; 25</strong> — consider buying options. <strong style={{ color: '#ef4444' }}>IVR &gt; 50</strong> — consider selling premium.
        </div>
        <Card>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Current IV: <span style={{ color: '#ef4444', fontWeight: 700 }}>{currentIV}%</span> — approximately the 81st percentile of this year's range
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ivYearData} barSize={3}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="day" {...CHART_STYLE.xAxis} label={{ value: 'Trading Days (1 year)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} tickFormatter={() => ''} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[0, 60]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`, 'IV']; }} />
              <ReferenceLine y={currentIV} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" label={{ value: `Current IV ${currentIV}%`, fill: '#ef4444', fontSize: 11, position: 'right' }} />
              <Bar dataKey="iv" name="Daily IV" fill="#6366f1" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      {/* Section 3: IV Crush */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="IV Crush" color="#ef4444" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          IV Crush is the sharp drop in implied volatility that occurs immediately after a binary event — most commonly an earnings release — resolves. The market had been pricing in uncertainty; once the news is out, that uncertainty disappears and IV collapses. Option buyers who don't account for this often find their position losing money even when they were "right" about the direction of the stock move.
        </p>
        <Card style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={ivCrushData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="label" {...CHART_STYLE.xAxis} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[0, 85]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`, 'IV']; }} />
              <ReferenceLine x="Earnings" stroke="#f59e0b" strokeWidth={2} label={{ value: 'Earnings Day', fill: '#f59e0b', fontSize: 11, position: 'top' }} />
              <Line type="monotone" dataKey="iv" name="Implied Volatility" stroke="#ef4444" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <div className="g-2" style={{ gap: 16 }}>
          <Card style={{ borderLeft: '3px solid #ef4444' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Scenario A: Stock +5%, Options LOSE</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              Stock at $100, ATM straddle costs $8. IV is 65%. Stock gaps up to $105 (+5%). IV collapses to 28%. New call value ≈ $5.20, new straddle ≈ $5.80. You paid $8 and now it's worth $5.80 — a <strong style={{ color: '#ef4444' }}>$2.20 loss</strong> despite the stock moving.
            </p>
          </Card>
          <Card style={{ borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Scenario B: Stock +10%, Options PROFIT</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
              Same setup. Stock gaps up to $110 (+10%). IV collapses to 28%. New call value ≈ $10.50, straddle ≈ $11. You paid $8 and it's worth $11 — a <strong style={{ color: '#10b981' }}>$3 gain</strong>. The move was large enough to overcome the IV crush.
            </p>
          </Card>
        </div>
      </section>

      {/* Section 4: Skew */}
      <section style={{ marginBottom: 48 }}>
        <SectionHeader title="Volatility Skew" color="#f59e0b" />
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
          Skew describes how implied volatility varies across different strike prices for the same expiry. In equity markets, OTM puts consistently trade at higher IV than OTM calls — this is called "negative skew" or "put skew." The reason: institutional investors pay a premium for downside protection (portfolio insurance), inflating OTM put prices. Skew steepens during fear-driven market environments and flattens during calm periods.
        </p>
        <Card>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={skewData}>
              <CartesianGrid {...CHART_STYLE.cartesianGrid} />
              <XAxis dataKey="strike" {...CHART_STYLE.xAxis} label={{ value: 'Strike Price ($)', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }} height={40} />
              <YAxis {...CHART_STYLE.yAxis} unit="%" domain={[18, 46]} />
              <Tooltip {...CHART_STYLE.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n}%`, 'IV']; }} />
              <ReferenceLine x={100} stroke="var(--border)" strokeDasharray="4 4" label={{ value: 'ATM ($100)', fill: '#475569', fontSize: 10 }} />
              <Line type="monotone" dataKey="iv" name="Implied Volatility" stroke="#f59e0b" dot={{ fill: '#f59e0b', r: 4 }} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#475569', textAlign: 'center' }}>
            Notice how IV rises sharply for OTM puts (strikes below 100) but is nearly flat for OTM calls (strikes above 100). This is the classic equity volatility smile/smirk.
          </p>
        </Card>
      </section>

      {/* Section 5: When to Buy vs Sell */}
      <section style={{ marginBottom: 24 }}>
        <SectionHeader title="When to Buy vs Sell Options" color="#10b981" />
        <div className="g-2" style={{ gap: 20 }}>
          <Card style={{ borderTop: '3px solid #10b981' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#10b981', marginBottom: 12 }}>
              BUY Options When IVR &lt; 25
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--text)', lineHeight: 2 }}>
              <li>IV is near historical lows — options are cheap</li>
              <li>You expect a volatility expansion event</li>
              <li>You have a strong directional conviction</li>
              <li>Long straddles, debit spreads, LEAPS</li>
              <li>You want defined risk with unlimited upside</li>
            </ul>
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#10b98118', borderRadius: 6, fontSize: 13, color: '#10b981' }}>
              Example: Stock going into a catalyst with IV at multi-year lows
            </div>
          </Card>
          <Card style={{ borderTop: '3px solid #ef4444' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
              SELL Options When IVR &gt; 50
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: 'var(--text)', lineHeight: 2 }}>
              <li>IV is elevated — options are expensive</li>
              <li>You expect volatility to mean-revert lower</li>
              <li>You want to collect premium as a high-prob trade</li>
              <li>Cash-secured puts, covered calls, iron condors</li>
              <li>Time decay (theta) works in your favor daily</li>
            </ul>
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#ef444418', borderRadius: 6, fontSize: 13, color: '#ef4444' }}>
              Example: Selling puts after a market spike when VIX is elevated
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
