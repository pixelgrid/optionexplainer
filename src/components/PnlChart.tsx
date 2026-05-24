import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from 'recharts';
import type { Strategy } from '../data/strategies';

interface Props {
  strategy: Strategy;
}

export function PnlChart({ strategy }: Props) {
  const [min, max] = strategy.chartRange;
  const step = (max - min) / 80;

  const data = Array.from({ length: 81 }, (_, i) => {
    const price = min + i * step;
    const pnl = strategy.payoff(price);
    return {
      price: Math.round(price * 10) / 10,
      profit: pnl >= 0 ? pnl : null,
      loss: pnl < 0 ? pnl : null,
      pnl,
    };
  });

  const allPnl = data.map((d) => d.pnl);
  const yMin = Math.min(...allPnl);
  const yMax = Math.max(...allPnl);
  const yPad = Math.max((yMax - yMin) * 0.15, 2);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
        <XAxis
          dataKey="price"
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: '#2a2d3e' }}
          tickFormatter={(v) => `$${v}`}
          interval={15}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          domain={[yMin - yPad, yMax + yPad]}
          tickFormatter={(v) => `$${v.toFixed(0)}`}
        />
        <Tooltip
          contentStyle={{
            background: '#1a1d27',
            border: '1px solid #2a2d3e',
            borderRadius: 8,
            fontSize: 12,
            color: '#e2e8f0',
          }}
          formatter={(value) => {
            const v = typeof value === 'number' ? value : 0;
            return [
              <span style={{ color: v >= 0 ? '#10b981' : '#ef4444' }}>
                {v >= 0 ? '+' : ''}${v.toFixed(2)}
              </span>,
              'P&L',
            ];
          }}
          labelFormatter={(label) => `Stock price: $${label}`}
        />
        <ReferenceLine y={0} stroke="#3b4060" strokeWidth={1.5} />
        <ReferenceLine
          x={strategy.spot}
          stroke="#6366f1"
          strokeWidth={1}
          strokeDasharray="4 4"
          label={{ value: 'spot', fill: '#6366f1', fontSize: 10, position: 'top' }}
        />
        <Area
          type="monotone"
          dataKey="profit"
          fill="rgba(16,185,129,0.12)"
          stroke="none"
          connectNulls={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="loss"
          fill="rgba(239,68,68,0.12)"
          stroke="none"
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="pnl"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
