const API = (base) => base || "http://localhost:8000/api/v1";

export async function getKPI(apiBase) {
  const res = await fetch(`${apiBase}/kpi`, {
    headers: { "x-api-key": localStorage.getItem("apiKey") },
  });
  if (!res.ok) throw new Error(await res.text());
  const j = await res.json();
  return {
    trades: j.trades_count,
    win_rate: j.win_rate_pct / 100,
    profit_factor: j.profit_factor,
    net_pnl: j.avg_trade_pnl, // or sum of pnls depending on meaning
  };
}

export async function getEquity(apiBase) {
  const res = await fetch(`${apiBase}/equity`, {
    headers: { "x-api-key": localStorage.getItem("apiKey") },
  });
  if (!res.ok) throw new Error(await res.text());
  const j = await res.json();
  return {
    ts: j.points.map((p) => p.ts),
    equity: j.points.map((p) => p.equity),
  };
}

export async function getTrades(apiBase, { limit = 100 }) {
  const res = await fetch(`${apiBase}/trades?limit=${limit}`, {
    headers: { "x-api-key": localStorage.getItem("apiKey") },
  });
  if (!res.ok) throw new Error(await res.text());
  const j = await res.json();
  return j.items.map((it) => ({
    id: it.id,
    time: it.timestamp,
    side: it.action.includes("Sell") ? "SELL" : "BUY", // simplify
    price: it.trade_price,
    qty: it.position,
    pnl: it.pnl,
  }));
}