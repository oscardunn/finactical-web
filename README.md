# finactical-web
Front end for Fintactical

# Finactical React Skeleton (Vite + Tailwind)

## Quick start
1) Copy `.env.example` to `.env` and set `VITE_API_BASE`.
2) Install Node, then:
   npm ci
   npm run dev
3) Build:
   npm run build && npm run preview

## API shape expected
- GET /kpi -> { "trades": number, "win_rate": number, "profit_factor": number|null, "net_pnl": number }
- GET /equity -> { "ts": string[], "equity": number[] }

## Deploy on Pi
- Serve `dist/` with Caddy or any static server.
- Expose via Cloudflare Tunnel: map app.yourdomain.com -> http://127.0.0.1:8080
