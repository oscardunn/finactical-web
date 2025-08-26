import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ChartLine({
  labels = [],
  data = [],
  title = "",
  yTickFormatter,
}) {
  // Build rows once per props change
  const rows = useMemo(() => {
    const n = Math.min(labels.length, data.length);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = { t: labels[i], y: data[i] };
    return out;
  }, [labels, data]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      {title ? <div className="text-sm muted mb-2">{title}</div> : null}
      <div className="h-72">
        <ResponsiveContainer>
          <AreaChart
            data={rows}
            margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.25} />
                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="t" tick={false} axisLine={false} />
            <YAxis
              width={56}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--card)",
                color: "var(--text)",
              }}
              labelStyle={{ color: "var(--muted)" }}
              formatter={(v) => [v, title || "Value"]}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="currentColor"
              fill="url(#fillArea)"
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
