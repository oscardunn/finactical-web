import React, { useEffect, useMemo, useRef, useState } from "react";
import { getKPI, getEquity, getTrades } from "./lib/api.js";
import TradesTable from "/Users/uncleosk/Finactical-web/finactical-web/frontend/src/components/tradestable.jsx";
import ChartLine from "/Users/uncleosk/Finactical-web/finactical-web/frontend/src/components/chartline.jsx";
import ThemeToggle from "/Users/uncleosk/Finactical-web/finactical-web/frontend/src/components/themetoggle.jsx";
import { RefreshCw, FileDown } from "lucide-react";
import StatCard from "/Users/uncleosk/Finactical-web/finactical-web/frontend/src/components/statcard.jsx";

const initApi = () =>
  localStorage.getItem("apiBase") ||
  import.meta.env.VITE_API_BASE ||
  "https://api.yourdomain.com";
const initRefresh = () =>
  Number(
    localStorage.getItem("refreshSec") || import.meta.env.VITE_REFRESH_SEC || 30
  );

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export default function App() {
  const [apiBase, setApiBase] = useState(initApi);
  const [refreshSec, setRefreshSec] = useState(initRefresh);
  const [kpi, setKpi] = useState(null);
  const [equity, setEquity] = useState({ ts: [], equity: [] });
  const [error, setError] = useState("");
  const [trades, setTrades] = useState([]);
  const timer = useRef(null);
  const prevKpi = useRef(null);

  const fmtPct = (x) => (x == null ? "—" : (x * 100).toFixed(1) + "%");
  const fmtNum = (x) =>
    x == null
      ? "—"
      : Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 });

const spinRef = useRef(null);

function handleRefreshClick() {
  const el = spinRef.current;
  if (el) {
    el.classList.remove("spin-once");
    void el.offsetWidth; // restart animation
    el.classList.add("spin-once");
  }
  loadAll();
}

  async function loadAll() {
    setError("");
    try {
      const [k, e, t] = await Promise.all([
        getKPI(apiBase),
        getEquity(apiBase),
        getTrades(apiBase, { limit: 500 })
      ]);
      setKpi(k);
      setEquity(e);
      setTrades(t);
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

    const deltas = useMemo(() => {if (!kpi || !prevKpi.current) return {};
    const pct = (curr, prev) =>
      prev == null || curr == null || prev === 0 ? null : ((curr - prev) / Math.abs(prev)) * 100;
    return {
      trades: pct(kpi.trades, prevKpi.current.trades),
      win_rate: pct(kpi.win_rate, prevKpi.current.win_rate),
      profit_factor: pct(kpi.profit_factor, prevKpi.current.profit_factor),
      net_pnl: pct(kpi.net_pnl, prevKpi.current.net_pnl),
    };
  }, [kpi]);

  useEffect(() => {
    if (kpi) prevKpi.current = kpi; // update snapshot after deltas are computed
  }, [kpi]);

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
  <div className="app-shell">
    <header className="sticky top-0 z-40 bg-header border-b border-border backdrop-blur header-shadow header-fade">
      <div className="container flex flex-col md:flex-row gap-3 items-start md:items-center justify-between h-auto md:h-14 py-3 md:py-0">
        <div>
          <h1 className="text-lg tracking-tight">Finactical</h1>
          <div className="text-sm muted">Live Metrics Dashboard</div>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button
            className="icon-btn tooltipped"
            onClick={handleRefreshClick}
            aria-label="Refresh now"
          >
            <span ref={spinRef} className="inline-flex">
              <RefreshCw className="w-[20px] h-[20px]" strokeWidth={1.8} />
            </span>
          </button>

          <a
            href="/cv/OscarDunn_CV.pdf" /* put file at: public/cv/OscarDunn_CV.pdf */
            download
            className="icon-btn relative group"
            aria-label="Download CV"
            title="Download CV"
          >
            <FileDown className="w-[20px] h-[20px]" strokeWidth={1.8} />
            <span
              className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2
                     whitespace-nowrap rounded border border-border bg-card px-2 py-1 text-xs
                     text-basecolor shadow opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100
                     transition z-50"
            >
              Download CV
            </span>
          </a>

          <ThemeToggle />
        </div>
      </div>
    </header>
    <main className="container">
      {/* Hero / value prop */}
      <section className="section">
        <div className="rounded-2xl border border-border bg-card">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-medium tracking-tight">
              Live trading telemetry
            </h2>
            <p className="text-sm muted mt-1">
              KPIs, equity curve, and system health—refreshed every&nbsp;
              <span className="tabular-nums">{refreshSec}</span>s from {apiBase}
              .
            </p>
          </div>

          {/* Control bar: compact, consistent, keyboardable */}
          <div className="p-4 sm:p-5 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm muted shrink-0" htmlFor="api-base">
                API Base
              </label>
              <input
                id="api-base"
                className="h-9 w-full sm:w-[28rem] rounded-md border border-border bg-panel px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-border"
                placeholder="https://api.yourdomain.com"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                spellCheck={false}
                inputMode="url"
              />

              <label className="text-sm muted shrink-0" htmlFor="refresh">
                Refresh
              </label>
              <select
                id="refresh"
                className="h-9 w-32 rounded-md border border-border bg-panel px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                value={refreshSec}
                onChange={(e) => setRefreshSec(Number(e.target.value))}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={0}>Manual</option>
              </select>

              <div className="sm:ml-auto flex gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem("apiBase", apiBase);
                    localStorage.setItem("refreshSec", String(refreshSec));
                  }}
                  className="h-9 rounded-md border border-border bg-card px-3 text-sm transition hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                >
                  Save
                </button>
                <button
                  className="h-9 rounded-md px-3 text-sm bg-accent text-white focus-visible:outline-none"
                  onClick={loadAll}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-700 bg-red-900/50 text-red-100 p-3 mb-4">
          {error}
        </div>
      )}

      {/* KPI cards with skeletons + tabular numbers */}
      <section className="section pt-0">
        {!kpi ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="skeleton h-24 rounded-xl border border-border" />
            <div className="skeleton h-24 rounded-xl border border-border" />
            <div className="skeleton h-24 rounded-xl border border-border" />
            <div className="skeleton h-24 rounded-xl border border-border" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Trades"
              value={fmtNum(kpi?.trades)}
              delta={deltas.trades != null ? Number(deltas.trades.toFixed(1)) : null}
            />
            <StatCard
              label="Win rate"
              value={fmtPct(kpi?.win_rate)}
              delta={deltas.win_rate != null ? Number(deltas.win_rate.toFixed(1)) : null}
            />
            <StatCard
              label="Profit factor"
              value={kpi?.profit_factor == null ? "—" : fmtNum(kpi?.profit_factor)}
              delta={deltas.profit_factor != null ? Number(deltas.profit_factor.toFixed(1)) : null}
            />
            <StatCard
              label="Net P&L"
              value={fmtNum(kpi?.net_pnl)}
              delta={deltas.net_pnl != null ? Number(deltas.net_pnl.toFixed(1)) : null}
            />
          </div>
        )}
      </section>

      {/* Charts with skeleton/empty states */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-panel border border-border rounded-xl p-4">
          <div className="mb-2 font-medium">Equity Curve</div>
          {equity?.equity?.length ? (
            <ChartLine labels={labels} data={equity.equity} title="Equity" />
          ) : (
            <div className="h-72 skeleton rounded-md border border-border bg-card animate-pulse" />
          )}
        </div>
        <div className=" bg-panel border border-border rounded-xl p-4">
          <div className="mb-2 font-medium">Drawdown</div>
          {dd?.length ? (
            <ChartLine labels={labels} data={dd} title="Drawdown" />
          ) : (
            <div className="h-72 skeleton rounded-md border border-border bg-card animate-pulse" />
          )}
        </div>
      </section>

      {/* Recent trades with empty state */}
      <section className="section">
        <div className="bg-panel border border-border rounded-xl p-4">
          <div className="mb-2 font-medium">Recent Trades</div>
          {Array.isArray(trades) && trades.length > 0 ? (
            <TradesTable trades={trades} />
          ) : (
            <div className="rounded-md border skeleton border-border bg-card p-6 text-center muted">
              No recent trades 
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-sm muted border-t border-border mt-6 pt-4 pb-5">
        Last update: {new Date().toLocaleString()} • API: {apiBase} •{" "}
        <a
          href="linkedin.com/in/oscar-dunn-935b90197"
          target="_blank"
          rel="noopener noreferrer"
          className="text-basecolor hover:underline underline-offset-4"
        >
          LinkedIn
        </a>
      </footer>
    </main>
  </div>
);

}
