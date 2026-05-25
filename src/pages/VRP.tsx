import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#1a1d27',
  border: '1px solid #2a2d3e',
  borderRadius: 10,
  padding: '20px 24px',
  ...style,
});

const CHART = {
  tooltip: {
    contentStyle: { background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12, color: '#e2e8f0' },
  },
  grid: { strokeDasharray: '3 3', stroke: '#1e2130' },
  xAxis: { tick: { fill: '#64748b', fontSize: 11 }, tickLine: false, axisLine: { stroke: '#2a2d3e' } },
  yAxis: { tick: { fill: '#64748b', fontSize: 11 }, tickLine: false, axisLine: false },
};

function SectionHeader({ title, color = '#6366f1' }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, marginTop: 40 }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e2e8f0' }}>{title}</h2>
    </div>
  );
}

function Citation({ authors, year, title, journal, detail }: { authors: string; year: string; title: string; journal: string; detail?: string }) {
  return (
    <div style={{ padding: '10px 14px', background: '#0f1117', borderRadius: 6, borderLeft: '3px solid #6366f1', marginTop: 12, fontSize: 12 }}>
      <span style={{ color: '#818cf8', fontWeight: 600 }}>{authors} ({year}).</span>
      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}> "{title}."</span>
      <span style={{ color: '#64748b' }}> {journal}.</span>
      {detail && <span style={{ color: '#10b981' }}> {detail}</span>}
    </div>
  );
}

// IV vs RV monthly data (fabricated realistic S&P 500 data based on Bondarenko 2019 averages)
const vrpData = Array.from({ length: 48 }, (_, i) => {
  const base = 15 + 8 * Math.sin(i * 0.4) + (i > 24 ? 4 * Math.sin(i * 0.9) : 0);
  const iv = Math.max(10, base + 4.2 + (Math.random() * 4 - 2));
  const rv = Math.max(6, base + (Math.random() * 5 - 2.5));
  return {
    month: `M${i + 1}`,
    iv: +iv.toFixed(1),
    rv: +rv.toFixed(1),
    spread: +(iv - rv).toFixed(1),
  };
});


// Cumulative VRP harvest simulation
const vrpHarvestData = (() => {
  let val = 10000;
  return Array.from({ length: 60 }, (_, i) => {
    const monthReturn = 0.004 + (Math.random() * 0.03 - 0.015);
    val *= (1 + monthReturn);
    return { month: i + 1, value: Math.round(val) };
  });
})();

const sp500Data = (() => {
  let val = 10000;
  return vrpHarvestData.map((_, i) => {
    const monthReturn = 0.007 + (Math.random() * 0.06 - 0.03);
    val *= (1 + monthReturn);
    return { month: i + 1, value: Math.round(val) };
  });
})();

const combinedData = vrpHarvestData.map((d, i) => ({ ...d, sp500: sp500Data[i].value }));

export function VRP() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Hero */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8b5cf6', background: '#8b5cf618', border: '1px solid #8b5cf640', borderRadius: 6, padding: '3px 10px' }}>
            Research-Backed
          </span>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
          The Volatility Risk Premium
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 15, lineHeight: 1.7, maxWidth: 750 }}>
          The most systematically documented edge in options trading. Over decades of data, implied volatility
          persistently overstates how much the market actually moves — and selling that overpriced fear is how
          professional options traders earn their living.
        </p>
      </div>

      {/* Key stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '28px 0' }}>
        {[
          { value: '19.3%', label: 'Avg S&P 500 IV (1990–2018)', color: '#ef4444' },
          { value: '15.1%', label: 'Avg S&P 500 Realized Vol', color: '#10b981' },
          { value: '+4.2pp', label: 'Average VRP Spread', color: '#6366f1' },
          { value: '0.65', label: 'PUT Index Sharpe vs 0.49 S&P', color: '#f59e0b' },
        ].map(({ value, label, color }) => (
          <div key={label} style={card({ textAlign: 'center' })}>
            <div style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.02em', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: '#475569', marginBottom: 32, marginTop: -16 }}>
        Source: Bondarenko / CBOE (2019), "Historical Performance of Put-Writing Strategies." SSRN #3393940.
      </p>

      <SectionHeader title="What Is the VRP?" color="#6366f1" />
      <div style={card()}>
        <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
          Options are priced using <strong style={{ color: '#e2e8f0' }}>implied volatility (IV)</strong> — the market's forecast of future movement.
          <strong style={{ color: '#e2e8f0' }}> Realized volatility (RV)</strong> is what actually happened. The gap between the two is the
          <strong style={{ color: '#8b5cf6' }}> Volatility Risk Premium</strong>: sellers of options systematically collect the difference.
        </p>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
          Why does this premium exist? Because options buyers pay extra for <em>insurance</em> — they accept negative expected value
          in exchange for protection against tail events. This is structurally similar to insurance premiums: on average,
          the insurer (option seller) wins.
        </p>
      </div>

      <SectionHeader title="IV vs. Realized Volatility — The Gap That Pays" color="#8b5cf6" />
      <div style={card({ padding: '16px 8px 8px' })}>
        <div style={{ fontSize: 12, color: '#64748b', marginLeft: 16, marginBottom: 8 }}>
          S&P 500 — 1-month IV vs Realized Volatility (annualized %) — Illustrative based on Bondarenko 2019 averages
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={vrpData} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid {...CHART.grid} />
            <XAxis dataKey="month" {...CHART.xAxis} hide />
            <YAxis {...CHART.yAxis} tickFormatter={(v) => `${v}%`} />
            <Tooltip {...CHART.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`${n.toFixed(1)}%`]; }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Line type="monotone" dataKey="iv" name="Implied Vol" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="rv" name="Realized Vol" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ margin: '12px 16px 4px', padding: '10px 14px', background: '#8b5cf618', borderRadius: 8, fontSize: 13, color: '#c4b5fd' }}>
          The shaded gap between the two lines is the VRP — what option sellers earn on average. It averages <strong>+4.2 percentage points</strong> annualized across the full 1990–2018 period, with the premium widening sharply during fear spikes (2008, 2020).
        </div>
      </div>

      <SectionHeader title="Delta-Hedged Gains: Isolating the Pure Volatility Edge" color="#10b981" />
      <div style={card()}>
        <p style={{ margin: '0 0 14px', color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
          To prove the VRP exists independent of directional bias, Bakshi & Kapadia (2003) delta-hedged ATM call positions continuously —
          removing all stock exposure. The result: even after hedging out direction, the <strong style={{ color: '#ef4444' }}>long option position
          returned −23 basis points per day</strong>. The option seller earned +23 bps/day in pure volatility premium.
        </p>
        <div style={{ padding: '12px 16px', background: '#ef444410', border: '1px solid #ef444440', borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'ATM Call (long)', value: '−23 bps/day', color: '#ef4444' },
              { label: 'ATM Put (long)', value: '−30 bps/day', color: '#ef4444' },
              { label: 'OTM Call (deep)', value: '−116 bps/day', color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            Returns from the <em>long</em> delta-hedged option perspective — sellers earn the opposite sign
          </p>
        </div>
      </div>
      <Citation
        authors="Bakshi, G. & Kapadia, N."
        year="2003"
        title="Delta-Hedged Gains and the Negative Market Volatility Risk Premium"
        journal="Review of Financial Studies, Vol. 16, No. 2, pp. 527–566."
        detail="Delta-hedged ATM S&P 500 calls: −23 bps/day from the long side."
      />

      <SectionHeader title="The CBOE PUT Index: 32 Years of VRP Harvesting" color="#f59e0b" />
      <div style={card({ padding: '16px 8px 8px' })}>
        <div style={{ fontSize: 12, color: '#64748b', marginLeft: 16, marginBottom: 8 }}>
          PUT Index vs. S&P 500 — Simulated cumulative growth of $10,000 (illustrative, reflects reported Sharpe differential)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={combinedData} margin={{ top: 4, right: 16, bottom: 0, left: -4 }}>
            <CartesianGrid {...CHART.grid} />
            <XAxis dataKey="month" {...CHART.xAxis} hide />
            <YAxis {...CHART.yAxis} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...CHART.tooltip} formatter={(v) => { const n = typeof v === 'number' ? v : 0; return [`$${n.toLocaleString()}`]; }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Area type="monotone" dataKey="value" name="PUT Index" stroke="#f59e0b" fill="#f59e0b15" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="sp500" name="S&P 500" stroke="#6366f1" fill="#6366f110" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        {[
          { label: 'PUT Index (1986–2018)', items: [['CAGR', '9.54%'], ['Volatility', '9.95%'], ['Sharpe Ratio', '0.65'], ['Beta', '0.56']], color: '#f59e0b' },
          { label: 'S&P 500 (same period)', items: [['CAGR', '9.80%'], ['Volatility', '14.93%'], ['Sharpe Ratio', '0.49'], ['Beta', '1.00']], color: '#6366f1' },
        ].map(({ label, items, color }) => (
          <div key={label} style={card()}>
            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 12 }}>{label}</div>
            {items.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e2130', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: '#475569' }}>
        The PUT Index achieved similar returns to the S&P 500 with <strong style={{ color: '#e2e8f0' }}>33% less volatility</strong> and a <strong style={{ color: '#e2e8f0' }}>33% higher Sharpe ratio</strong>. This is the VRP harvested systematically.
      </p>
      <Citation
        authors="Bondarenko, O."
        year="2019"
        title="Historical Performance of Put-Writing Strategies"
        journal="CBOE White Paper / SSRN #3393940."
        detail="June 1986 – December 2018. PUT Sharpe = 0.65 vs. S&P 500 = 0.49."
      />

      <SectionHeader title="The Variance Risk Premium: Academic Foundation" color="#3b82f6" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          {
            authors: 'Bollerslev, Tauchen & Zhou (2009)',
            journal: 'Review of Financial Studies',
            finding: 'The VRP explains >15% of time-series variation in quarterly S&P 500 excess returns — a stronger predictor than P/E ratios or default spreads at the quarterly horizon.',
            color: '#6366f1',
          },
          {
            authors: 'Carr & Wu (2009)',
            journal: 'Review of Financial Studies',
            finding: 'Studied 5 stock indices and 35 individual stocks. Found a large, consistently negative variance risk premium for broad equity indices — variance swap sellers earn persistent positive returns. The index VRP is larger than single-stock VRP.',
            color: '#8b5cf6',
          },
        ].map(({ authors, journal, finding, color }) => (
          <div key={authors} style={card()}>
            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 4 }}>{authors}</div>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>{journal}</div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{finding}</p>
          </div>
        ))}
      </div>

      <SectionHeader title="How to Harvest the VRP — Practically" color="#10b981" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          {
            step: '1',
            title: 'Sell When IV Is Rich',
            body: 'Enter short premium positions when IV Rank > 50. The higher the IV Rank, the fatter the VRP being offered. At IVR > 90, the edge is at its widest.',
            color: '#10b981',
          },
          {
            step: '2',
            title: 'Use Defined Expiries',
            body: 'The tastytrade 45→21 DTE system captures peak theta acceleration while leaving time to manage losers. Never hold short options through expiry week.',
            color: '#6366f1',
          },
          {
            step: '3',
            title: 'Size for Survival',
            body: 'The VRP is a long-run edge — you can\'t harvest it if you blow up on a single trade. Size so any one loss does not exceed 2% of your portfolio.',
            color: '#f59e0b',
          },
        ].map(({ step, title, body, color }) => (
          <div key={step} style={card()}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color, marginBottom: 10 }}>{step}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>{title}</div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{body}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: '16px 20px', background: '#1a1d27', border: '1px solid #2a2d3e', borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
          Key Caveat
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
          The VRP is real but it is not arbitrage — it is a <strong style={{ color: '#e2e8f0' }}>risk premium</strong>, not free money. You are being paid to bear tail risk.
          The premium can be negative for extended periods (2008, 2020), and short volatility positions can suffer severe drawdowns. The edge exists over <em>hundreds of trades</em>,
          not individual ones. Position sizing and risk management are what separates systematic VRP harvesting from gambling.
        </p>
      </div>
    </div>
  );
}
