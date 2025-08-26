
import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);


export default function ChartLine({ data }) {
  const rows = useMemo(
    () => (data?.ts || []).map((t, i) => ({ t, y: data.equity[i] })),
    [data]
  );

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-sm text-muted-foreground mb-2">Equity</div>
      <div className="h-64">
        <ResponsiveContainer>
          <AreaChart data={rows} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis width={48} tickLine={false} axisLine={false} tickMargin={6} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
              labelFormatter={() => ""}
              formatter={(v) => [v, "Equity"]}
            />
            <Area type="monotone" dataKey="y" stroke="currentColor" fill="url(#fillEquity)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
