const API = (base) => base || "http://localhost:8000/api/v1";

export async function getKPI(base) {
  const r = await fetch(`${API(base)}/kpi`);
  if (!r.ok) throw new Error("KPI fetch failed");
  return r.json(); // → { trades, win_rate, profit_factor, net_pnl, ... }
}

export async function getEquity(base) {
  const r = await fetch(`${API(base)}/equity`);
  if (!r.ok) throw new Error("Equity fetch failed");
  return r.json(); // → { ts: [...], equity: [...] }
}

export async function getTrades(
  base,
  { limit = 100, offset = 0, status = "ALL" } = {}
) {
  const url = new URL(`${API(base)}/trades`);
  url.searchParams.set("limit", limit);
  url.searchParams.set("offset", offset);
  url.searchParams.set("status", status);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Trades fetch failed");
  return r.json(); // → array of trades
}
