const $ = (id) => document.getElementById(id);

const state = {
  apiBase: localStorage.getItem("apiBase") || "https://api.yourdomain.com",
  refreshSec: +(localStorage.getItem("refreshSec") || 30),
  timer: null,
  charts: {},
};

function fmtPct(x) {
  return x == null || isNaN(x) ? "—" : (x * 100).toFixed(1) + "%";
}
function fmtNum(x) {
  return x == null || isNaN(x)
    ? "—"
    : Number(x).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function showBanner(type, msg) {
  const el = $("alert");
  if (!msg) {
    el.className = "banner";
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  el.className = "banner " + type;
  el.style.display = "block";
  el.textContent = msg;
}

async function fetchJSON(path) {
  const url = state.apiBase.replace(/\/$/, "") + path;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(res.status + " " + res.statusText);
  return res.json();
}

async function loadKPI() {
  const k = await fetchJSON("/kpi");
  $("k_trades").textContent = fmtNum(k.trades);
  $("k_win").textContent = fmtPct(k.win_rate);
  $("k_pf").textContent =
    k.profit_factor == null ? "—" : fmtNum(k.profit_factor);
  const pnl = Number(k.net_pnl || 0);
  $("k_pnl").textContent = fmtNum(pnl);
  $("k_pnl").className = "value " + (pnl > 0 ? "good" : pnl < 0 ? "bad" : "");
}

function computeDD(arr) {
  let p = -Infinity,
    dd = [];
  for (const v of arr) {
    p = Math.max(p, v);
    dd.push(v - p);
  }
  return dd;
}

function ensureChart(id, type, data, options) {
  if (state.charts[id]) state.charts[id].destroy();
  const ctx = $(id).getContext("2d");
  state.charts[id] = new Chart(ctx, { type, data, options });
}

async function loadEquity() {
  const e = await fetchJSON("/equity");
  const labels = (e.ts || []).map((t) => new Date(t));
  const equity = (e.equity || []).map(Number);
  const dd = computeDD(equity);

  ensureChart(
    "equityChart",
    "line",
    {
      labels,
      datasets: [
        {
          label: "Equity",
          data: equity,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    }
  );

  ensureChart(
    "ddChart",
    "line",
    {
      labels,
      datasets: [
        {
          label: "Drawdown",
          data: dd,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    }
  );

  $("equityMeta").textContent = labels.length
    ? `Points: ${labels.length} • Last: ${labels.at(-1).toLocaleString()}`
    : "No data";
  $("ddMeta").textContent = labels.length
    ? `Max DD: ${Math.min(...dd).toLocaleString()}`
    : "No data";
}

async function refreshAll() {
  showBanner();
  try {
    await Promise.all([loadKPI(), loadEquity()]);
    $(
      "footerMeta"
    ).textContent = `Last update: ${new Date().toLocaleString()} • API: ${
      state.apiBase
    }`;
  } catch (err) {
    showBanner("error", `API unreachable: ${err.message} (${state.apiBase})`);
  }
}

function setupLoop() {
  clearInterval(state.timer);
  if (state.refreshSec > 0)
    state.timer = setInterval(refreshAll, state.refreshSec * 1000);
  refreshAll();
}

function init() {
  $("apiBase").value = state.apiBase;
  $("refresh").value = String(state.refreshSec);
  $("apply").onclick = () => {
    const base = $("apiBase").value.trim();
    const r = +$("refresh").value;
    if (base) state.apiBase = base;
    state.refreshSec = r;
    localStorage.setItem("apiBase", state.apiBase);
    localStorage.setItem("refreshSec", String(state.refreshSec));
    setupLoop();
  };
  $("refreshNow").onclick = refreshAll;
  setupLoop();
}

window.addEventListener("DOMContentLoaded", init);
