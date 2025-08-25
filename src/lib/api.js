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
