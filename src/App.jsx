import React, { useEffect, useMemo, useRef, useState } from "react";
import { getKPI, getEquity } from "./lib/api.js";
import ChartLine from "/Users/uncleosk/Finactical-web/finactical-web/src/components/chartline.jsx";

const initApi = () =>
  localStorage.getItem("apiBase") ||
  import.meta.env.VITE_API_BASE ||
  "https://api.yourdomain.com";
const initRefresh = () =>
  Number(
    localStorage.getItem("refreshSec") || import.meta.env.VITE_REFRESH_SEC || 30
  );

export default function App() {
  const [apiBase, setApiBase] = useState(initApi);
  const [refreshSec, setRefreshSec] = useState(initRefresh);
  const [kpi, setKpi] = useState(null);
  const [equity, setEquity] = useState({ ts: [], equity: [] });
  const [error, setError] = useState("");
  const timer = useRef(null);

  const fmtPct = (x) => (x == null ? "—" : (x * 100).toFixed(1) + "%");
  const fmtNum = (x) =>
    x == null
      ? "—"
      : Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 });

  async function loadAll() {
    setError("");
    try {
      const [k, e] = await Promise.all([getKPI(apiBase), getEquity(apiBase)]);
      setKpi(k);
      setEquity(e);
    } catch (err) {
      setError(`API unreachable: ${err.message}`);
    }
  }

  useEffect(() => {
    clearInterval(timer.current);
    if (refreshSec > 0) timer.current = setInterval(loadAll, refreshSec * 1000);
    loadAll();
    return () => clearInterval(timer.current);
  }, [refreshSec, apiBase]);

  useEffect(() => {
    localStorage.setItem("apiBase", apiBase);
    localStorage.setItem("refreshSec", String(refreshSec));
  }, [apiBase, refreshSec]);

  const labels = useMemo(
    () =>
      (equity.ts || []).map((t) => {
        try {
          return new Date(t).toLocaleString();
        } catch {
          return String(t);
        }
      }),
    [equity.ts]
  );

  const dd = useMemo(() => {
    const arr = equity.equity || [];
    let peak = -Infinity,
      out = [];
    for (const v of arr) {
      peak = Math.max(peak, v);
      out.push(v - peak);
    }
    return out;
  }, [equity.equity]);

  return (
    <div>
      <header className="border-b border-border bg-panel">
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div>
            <h1 className="text-lg">Finactical — Live Metrics</h1>
            <div className="text-sm muted">
              React + Vite • Static UI • API via tunnel
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              className="bg-card border border-border rounded-md px-3 py-2 w-72"
              placeholder="https://api.yourdomain.com"
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
            />
            <select
              className="bg-card border border-border rounded-md px-3 py-2"
              value={refreshSec}
              onChange={(e) => setRefreshSec(Number(e.target.value))}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={0}>Manual</option>
            </select>
            <button
              className="bg-accent text-white rounded-md px-3 py-2"
              onClick={loadAll}
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {error && (
          <div className="bg-red-900/50 text-red-100 border border-red-700 rounded-lg p-3 mb-3">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm muted">Trades</div>
            <div className="text-2xl mt-1">{fmtNum(kpi?.trades)}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm muted">Win rate</div>
            <div className="text-2xl mt-1">{fmtPct(kpi?.win_rate)}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm muted">Profit factor</div>
            <div className="text-2xl mt-1">
              {kpi?.profit_factor == null ? "—" : fmtNum(kpi?.profit_factor)}
            </div>
          </div>
          <div className={"bg-card border border-border rounded-xl p-4"}>
            <div className="text-sm muted">Net P&L</div>
            <div
              className={
                "text-2xl mt-1 " +
                ((kpi?.net_pnl || 0) > 0
                  ? "text-green-400"
                  : (kpi?.net_pnl || 0) < 0
                  ? "text-red-400"
                  : "")
              }
            >
              {fmtNum(kpi?.net_pnl)}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
          <div className="bg-panel border border-border rounded-xl p-4">
            <div className="mb-2 font-medium">Equity Curve</div>
            <ChartLine
              labels={labels}
              data={equity.equity || []}
              title="Equity"
            />
          </div>
          <div className="bg-panel border border-border rounded-xl p-4">
            <div className="mb-2 font-medium">Drawdown</div>
            <ChartLine labels={labels} data={dd} title="Drawdown" />
          </div>
        </section>

        <footer className="text-sm muted border-t border-border mt-6 pt-4">
          Last update: {new Date().toLocaleString()} • API: {apiBase}
        </footer>
      </main>
    </div>
  );
}
