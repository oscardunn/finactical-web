import os, math, sqlite3
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

DB_PATH = os.getenv("DATA_DB_FILE", "./data/data.db")
BASE_CCY = os.getenv("BASE_CCY", "USD")

EXIT_ACTIONS = {
    "Sell",
    "Cover",
    "Stop Loss Sell",
    "Stop Loss Cover",
    "Trailing Stop Sell",
    "Trailing Stop Cover",
    "Time Exit Sell",
    "Time Exit Cover",
}

def connect() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH, check_same_thread=False)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA journal_mode=WAL;")
    c.execute("PRAGMA synchronous=NORMAL;")
    c.execute("PRAGMA temp_store=MEMORY;")
    return c

def epoch_to_iso(sec: Optional[int]) -> Optional[str]:
    if sec is None: return None
    return datetime.fromtimestamp(int(sec), tz=timezone.utc).isoformat().replace("+00:00","Z")

def parse_iso_to_epoch(s: Optional[str]) -> Optional[int]:
    if not s: return None
    try:
        dt = datetime.fromisoformat(s.replace("Z","+00:00")).astimezone(timezone.utc)
        return int(dt.timestamp())
    except Exception:
        return None

def load_rows(conn: sqlite3.Connection, start_ep: Optional[int], end_ep: Optional[int]) -> List[sqlite3.Row]:
    wh, args = [], []
    if start_ep is not None:
        wh.append("timestamp >= ?")
        args.append(int(start_ep))
    if end_ep is not None:
        wh.append("timestamp <= ?")
        args.append(int(end_ep))
    sql = "SELECT timestamp, position, usdt, trade_price, close_time, action, pnl FROM trade"
    if wh: sql += " WHERE " + " AND ".join(wh)
    sql += " ORDER BY timestamp ASC"
    return conn.execute(sql, args).fetchall()

def equity_from_row(r: sqlite3.Row) -> float:
    # equity = usdt + position * price (position may be negative for shorts)
    return float(r["usdt"] or 0.0) + float(r["position"] or 0.0) * float(r["trade_price"] or 0.0)

def series_equity(rows: List[sqlite3.Row]) -> List[Tuple[int, float]]:
    out = []
    for r in rows:
        out.append((int(r["timestamp"]), equity_from_row(r)))
    return out

def max_drawdown(equity_vals: np.ndarray) -> Tuple[float, int]:
    if equity_vals.size == 0:
        return 0.0, 0
    peaks = np.maximum.accumulate(equity_vals)
    dd = (equity_vals / peaks) - 1.0
    max_dd = float(np.min(dd))
    cur = m = 0
    for x in dd:
        if x < 0: cur += 1
        else: cur = 0
        m = max(m, cur)
    return max_dd, m

def daily_pnl_from_equity(eq_series: List[Tuple[int, float]]) -> np.ndarray:
    if not eq_series: return np.array([])
    # group by UTC date
    day_last = {}
    for ts, val in eq_series:
        d = datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat()
        day_last[d] = float(val)
    days = sorted(day_last.keys())
    pnls = []
    last_val = None
    for d in days:
        v = day_last[d]
        if last_val is not None:
            pnls.append(v - last_val)
        last_val = v
    return np.array(pnls, dtype=float)

def kpis_from_trade_table(rows: List[sqlite3.Row], eq_series: List[Tuple[int, float]]) -> Dict[str, Any]:
    out = {
        "currency": BASE_CCY,
        "trades_count": 0,
        "total_return_pct": 0.0,
        "cagr_pct": 0.0,
        "sharpe": 0.0,
        "sortino": 0.0,
        "max_drawdown_pct": 0.0,
        "max_dd_duration_days": 0,
        "win_rate_pct": 0.0,
        "profit_factor": 0.0,
        "avg_trade_pnl": 0.0,
        "avg_daily_pnl": 0.0,
        "std_daily_pnl": 0.0,
    }
    if len(eq_series) >= 2:
        eq_vals = np.array([v for _, v in eq_series], dtype=float)
        ret_total = (eq_vals[-1] / eq_vals[0]) - 1.0 if eq_vals[0] != 0 else 0.0
        out["total_return_pct"] = ret_total * 100.0

        days = max(1, int((eq_series[-1][0] - eq_series[0][0]) // 86400))
        years = days / 365.25
        out["cagr_pct"] = (((eq_vals[-1] / eq_vals[0]) ** (1/years) - 1) * 100.0) if years > 0 else out["total_return_pct"]

        mdd, mdd_dur = max_drawdown(eq_vals)
        out["max_drawdown_pct"] = mdd * 100.0
        out["max_dd_duration_days"] = int(mdd_dur)

        daily = daily_pnl_from_equity(eq_series)
        if daily.size > 0:
            mean_d = float(np.mean(daily))
            std_d  = float(np.std(daily, ddof=1)) if daily.size > 1 else 0.0
            out["avg_daily_pnl"] = mean_d
            out["std_daily_pnl"] = std_d
            ann_ret = mean_d * 365.0
            ann_vol = std_d * math.sqrt(365.0)
            out["sharpe"] = (ann_ret / ann_vol) if ann_vol > 0 else 0.0
            neg = daily[daily < 0]
            downside = float(np.std(neg, ddof=1)) if neg.size > 1 else 0.0
            out["sortino"] = (ann_ret / (downside * math.sqrt(365.0))) if downside > 0 else 0.0

    # trade-level stats from exit rows
    exit_rows = [r for r in rows if (r["action"] or "") in EXIT_ACTIONS]
    out["trades_count"] = len(exit_rows)
    if exit_rows:
        pnls = np.array([float(r["pnl"] or 0.0) for r in exit_rows], dtype=float)
        wins = pnls[pnls > 0]; losses = pnls[pnls < 0]
        out["win_rate_pct"] = (len(wins) / len(pnls)) * 100.0 if len(pnls) else 0.0
        denom = abs(float(losses.sum()))
        pf = float(wins.sum()) / denom if denom > 0 else (float("inf") if wins.sum() > 0 else 0.0)
        out["profit_factor"] = 0.0 if not math.isfinite(pf) else pf
        out["avg_trade_pnl"] = float(np.mean(pnls))
    return out

def paginate(items: List[Dict[str, Any]], limit: int, offset: int) -> Tuple[int, List[Dict[str, Any]]]:
    total = len(items)
    return total, items[offset: offset + limit]

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS").split(",")}})

# on pi, set CORS_ORIGINS to your frontend domain, e.g.
# export CORS_ORIGINS="https://app.yourdomain.com"

from flask import abort
API_KEY = os.getenv("API_KEY")

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
limiter = Limiter(get_remote_address, app=app, default_limits=["120/minute"])
# tune per endpoint if needed


@app.before_request
def require_key():
    if request.path.startswith("/api/"):  # allow /health below if you like
        key = request.headers.get("x-api-key")
        if not API_KEY or key != API_KEY:
            abort(401)

@app.get("/api/v1/health")
def health():
    try:
        c = connect(); c.execute("SELECT 1"); c.close()
        return jsonify(ok=True)
    except Exception as ex:
        return jsonify(ok=False, error=str(ex)), 500

@app.get("/api/v1/equity")
def equity():
    start = parse_iso_to_epoch(request.args.get("start"))
    end   = parse_iso_to_epoch(request.args.get("end"))
    conn = connect()
    rows = load_rows(conn, start, end)
    conn.close()
    eq_series = series_equity(rows)
    return jsonify({
        "currency": BASE_CCY,
        "start": epoch_to_iso(eq_series[0][0]) if eq_series else (request.args.get("start") or None),
        "end":   epoch_to_iso(eq_series[-1][0]) if eq_series else (request.args.get("end") or None),
        "points": [{"ts": epoch_to_iso(ts), "equity": float(v)} for ts, v in eq_series]
    })

@app.get("/api/v1/kpi")
def kpi():
    start = parse_iso_to_epoch(request.args.get("start"))
    end   = parse_iso_to_epoch(request.args.get("end"))
    conn = connect()
    rows = load_rows(conn, start, end)
    conn.close()
    eq_series = series_equity(rows)
    out = kpis_from_trade_table(rows, eq_series)
    # Echo window
    out["start"] = epoch_to_iso(eq_series[0][0]) if eq_series else (request.args.get("start") or None)
    out["end"]   = epoch_to_iso(eq_series[-1][0]) if eq_series else (request.args.get("end") or None)
    return jsonify(out)

@app.get("/api/v1/trades")
def trades():
    start  = parse_iso_to_epoch(request.args.get("start"))
    end    = parse_iso_to_epoch(request.args.get("end"))
    status = request.args.get("status", "ALL").upper()  # "OPEN"/"CLOSED"/"ALL"
    limit  = max(1, min(int(request.args.get("limit", 100)), 1000))
    offset = max(0, int(request.args.get("offset", 0)))
    sort   = request.args.get("sort", "-timestamp")  # "+timestamp" | "-timestamp"

    conn = connect()
    rows = load_rows(conn, start, end)
    conn.close()

    # derive "is_exit" and optional "closed_only" filter
    items = []
    for r in rows:
        action = (r["action"] or "").strip()
        is_exit = action in EXIT_ACTIONS
        if status == "CLOSED" and not is_exit:  # only show exit events
            continue
        if status == "OPEN" and is_exit:        # only non-exit events
            continue

        equity_now = equity_from_row(r)
        items.append({
            "id": int(r["timestamp"]),                    # use timestamp as id
            "timestamp": epoch_to_iso(r["timestamp"]),
            "close_time": epoch_to_iso(r["close_time"]),
            "action": action or "Hold",
            "position": float(r["position"] or 0.0),
            "usdt": float(r["usdt"] or 0.0),
            "trade_price": float(r["trade_price"] or 0.0),
            "pnl": float(r["pnl"] or 0.0) if is_exit else None,
            "is_exit": is_exit,
            "equity": equity_now,
            "currency": BASE_CCY,
        })

    # sort
    reverse = True if sort.startswith("-") else False
    key = sort.lstrip("+-")
    items.sort(key=lambda x: x.get(key, 0) or 0, reverse=reverse)

    total, page = paginate(items, limit, offset)
    return jsonify({"count": total, "items": page})

@app.get("/api/v1/trades/<int:trade_id>")
def trade_by_id(trade_id: int):
    conn = connect()
    r = conn.execute(
        "SELECT timestamp, position, usdt, trade_price, close_time, action, pnl FROM trade WHERE timestamp=?",
        (trade_id,)
    ).fetchone()
    conn.close()
    if not r:
        return jsonify({"detail": "Trade not found"}), 404
    action = (r["action"] or "").strip()
    is_exit = action in EXIT_ACTIONS
    return jsonify({
        "id": int(r["timestamp"]),
        "timestamp": epoch_to_iso(r["timestamp"]),
        "close_time": epoch_to_iso(r["close_time"]),
        "action": action or "Hold",
        "position": float(r["position"] or 0.0),
        "usdt": float(r["usdt"] or 0.0),
        "trade_price": float(r["trade_price"] or 0.0),
        "pnl": float(r["pnl"] or 0.0) if is_exit else None,
        "is_exit": is_exit,
        "equity": equity_from_row(r),
        "currency": BASE_CCY,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
