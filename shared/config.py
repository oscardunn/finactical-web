import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENVIRONMENT = os.getenv("ENVIRONMENT", "DEV").upper()

# ─── Database Paths ──────────────────────────────────────────────
if ENVIRONMENT == "DEV":
    DATA_DB_FILE = "/Users/uncleosk/DB/btcusdt_data_5m.db"
    MARKET_DATA_DB_FILE = "/Users/uncleosk/DB/market_data.db"
else:
    DB_DIR = os.path.join(BASE_DIR, "DB")
    os.makedirs(DB_DIR, exist_ok=True)
    DATA_DB_FILE = os.path.join(DB_DIR, "btcusdt_data_5m.db")
    MARKET_DATA_DB_FILE = os.path.join(DB_DIR, "market_data.db")

# ─── Server Config ───────────────────────────────────────────────
PORT = int(os.getenv("PORT", "8000"))      # Flask/Gunicorn bind port
HOST = os.getenv("HOST", "0.0.0.0")        # 0.0.0.0 for external, 127.0.0.1 for local only
DEBUG = (ENVIRONMENT == "DEV")              # enable Flask debug only in dev

# ─── API / Security Config ───────────────────────────────────────
BASE_CCY = os.getenv("BASE_CCY", "USD")
CORS_ORIGINS = os.getenv("CORS_ORIGINS").split(",")
API_KEY = os.getenv("API_KEY")             # optional, for auth
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ─── Performance / Limits ────────────────────────────────────────
MAX_TRADES_LIMIT = int(1000)
DEFAULT_TRADES_LIMIT = int(100)

# ─── Monitoring / Metadata ───────────────────────────────────────
SERVICE_NAME = "finactical-api"
VERSION = "0.1.0"


# export PORT=8000
# export HOST=0.0.0.0
# export BASE_CCY=USD
# export CORS_ORIGINS="http://localhost:5173"
# export API_KEY="4db70b6e7bda5660569aad7045829eb23c4d0238901df2cfc6177b84c1fac321"
# export LOG_LEVEL=DEBUG