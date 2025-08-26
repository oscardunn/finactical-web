// components/StatCard.jsx
import { motion } from "framer-motion";

export default function StatCard({ label, value, delta, icon: Icon }) {
  const up = delta > 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-xl border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon ? <Icon className="w-4 h-4 text-muted-foreground" /> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {delta != null && (
          <span
            className={`text-xs font-medium ${
              up
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
