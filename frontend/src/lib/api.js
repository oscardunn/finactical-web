const DEFAULT_BASE =
  import.meta.env.VITE_API_BASE || "https://api.yourdomain.com";

export async function getKPI(base = DEFAULT_BASE) {
  const url = base.replace(/\/$/, "") + "/kpi";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getEquity(base = DEFAULT_BASE) {
  const url = base.replace(/\/$/, "") + "/equity";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getTrades(apiBase, { limit = 500 } = {}) {
  const base = String(apiBase || "").replace(/\/$/, "");
  const res = await fetch(`${base}/trades?limit=${limit}`);
  if (!res.ok) throw new Error(`Trades HTTP ${res.status}`);
  const data = await res.json();

  // Normalize a few common shapes -> [{id,time,symbol,side,qty,price,pnl}]
  const items = Array.isArray(data?.trades)
    ? data.trades
    : Array.isArray(data)
    ? data
    : [];
  return items.map((r, i) => ({
    id: r.id ?? r.trade_id ?? i,
    time: r.time ?? r.timestamp ?? r.close_time ?? r.open_time,
    symbol: r.symbol ?? r.ticker ?? "BTCUSDT",
    side: r.side ?? r.action ?? r.type,
    qty: r.qty ?? r.quantity ?? r.size,
    price: r.price ?? r.fill_price ?? r.avg_price ?? r.entry_price,
    pnl: r.pnl ?? r.profit ?? r.p_and_l,
  }));
}

