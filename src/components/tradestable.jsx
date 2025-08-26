import React, { useMemo, useState } from "react";

function fmtNum(x, d = 2) {
  if (x == null || Number.isNaN(x)) return "—";
  return Number(x).toLocaleString(undefined, { maximumFractionDigits: d });
}
function fmtTime(t) {
  try {
    return new Date(t).toLocaleString();
  } catch {
    return String(t);
  }
}

export default function TradesTable({ trades = [] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filtered = useMemo(() => {
    if (!q) return trades;
    const s = q.toLowerCase();
    return trades.filter(
      (r) =>
        String(r.id ?? "")
          .toLowerCase()
          .includes(s) ||
        String(r.symbol ?? "")
          .toLowerCase()
          .includes(s) ||
        String(r.side ?? "")
          .toLowerCase()
          .includes(s)
    );
  }, [trades, q]);

  function download(filename, type, content) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toCSV(rows) {
    if (!rows?.length) return "";
    const cols = Array.from(
      rows.reduce(
        (set, r) => (Object.keys(r).forEach((k) => set.add(k)), set),
        new Set()
      )
    );
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = cols.join(",");
    const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
    return head + "\n" + body;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const handleExportJSON = () =>
    download(`trades_${ts}.json`, "application/json;charset=utf-8", JSON.stringify(filtered, null, 2));
  const handleExportCSV = () =>
    download(`trades_${ts}.csv`, "text/csv;charset=utf-8", toCSV(filtered));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="bg-card border border-border rounded-md px-3 py-2 w-64"
          placeholder="Search id / symbol / side"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="text-sm muted">
          {filtered.length} trades • page {page}/{totalPages}
        </div>
    <div className="ml-auto flex items-center gap-2">
      <button
        className="icon-btn"
        title="Download JSON"
        onClick={handleExportJSON}
        aria-label="Download JSON"
      >
        JSON
      </button>
      <button
        className="icon-btn"
        title="Download CSV"
        onClick={handleExportCSV}
        aria-label="Download CSV"
      >
        CSV
      </button>
    </div>
      </div>

      <div className="overflow-auto border border-border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-panel sticky top-0">
            <tr className="text-left">
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Side</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">PnL</th>
              <th className="px-3 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((r, i) => (
              <tr key={r.id ?? i} className="border-t border-border">
                <td className="px-3 py-2 whitespace-nowrap">
                  {fmtTime(r.time || r.timestamp)}
                </td>
                <td className="px-3 py-2">{r.symbol || "BTCUSDT"}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      "px-2 py-0.5 rounded-full text-xs " +
                      (String(r.side).toLowerCase() === "buy"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400")
                    }
                  >
                    {String(r.side || "").toUpperCase() || "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {fmtNum(r.qty ?? r.quantity ?? r.size, 6)}
                </td>
                <td className="px-3 py-2">{fmtNum(r.price, 2)}</td>
                <td
                  className={
                    "px-3 py-2 " +
                    ((r.pnl ?? r.profit ?? 0) > 0
                      ? "text-green-400"
                      : (r.pnl ?? r.profit ?? 0) < 0
                      ? "text-red-400"
                      : "")
                  }
                >
                  {fmtNum(r.pnl ?? r.profit, 2)}
                </td>
                <td className="px-3 py-2">{r.id ?? "—"}</td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center muted" colSpan={7}>
                  No trades found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="icon-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          title="Prev"
        >
          ‹
        </button>
        <button
          className="icon-btn"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          title="Next"
        >
          ›
        </button>
      </div>
    </div>
  );
}
