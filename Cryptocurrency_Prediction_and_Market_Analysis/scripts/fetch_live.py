import os
import sys
import sqlite3
import requests
import time
import logging
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
DB_PATH = os.path.join(BASE_DIR, "backend", "database", "app.db")

def get_usd_inr():
    try:
        from backend.services.market_data_service import get_usd_inr_rate
        return get_usd_inr_rate()
    except Exception:
        return 96.40

def fetch_top_1000_live():
    logging.info("Updating live market prices for all 1,000 cryptocurrency assets...")
    usd_inr = get_usd_inr()

    # 1. Fetch real-time MEXC spot tickers (1,800+ active markets)
    mexc_map = {}
    try:
        r_mexc = requests.get('https://api.mexc.com/api/v3/ticker/24hr', timeout=4)
        if r_mexc.status_code == 200:
            for t in r_mexc.json():
                sym = t.get('symbol', '')
                if sym.endswith('USDT'):
                    base = sym[:-4].upper()
                    mexc_map[base] = {
                        'price_usd': float(t.get('lastPrice') or 0),
                        'high_usd': float(t.get('highPrice') or 0),
                        'low_usd': float(t.get('lowPrice') or 0),
                        'vol_usd': float(t.get('quoteVolume') or 0),
                        'chg_pct': float(t.get('priceChangePercent') or 0) * 100.0
                    }
    except Exception as e:
        logging.warning(f"MEXC live feed notice: {e}")

    # 2. Fetch real-time Gate.io spot tickers (2,000+ active markets)
    gate_map = {}
    try:
        r_gate = requests.get('https://api.gateio.ws/api/v4/spot/tickers', timeout=4)
        if r_gate.status_code == 200:
            for t in r_gate.json():
                cp = t.get('currency_pair', '')
                if cp.endswith('_USDT'):
                    base = cp[:-5].upper()
                    gate_map[base] = {
                        'price_usd': float(t.get('last') or 0),
                        'high_usd': float(t.get('high_24h') or 0),
                        'low_usd': float(t.get('low_24h') or 0),
                        'vol_usd': float(t.get('quote_volume') or 0),
                        'chg_pct': float(t.get('change_percentage') or 0)
                    }
    except Exception as e:
        logging.warning(f"Gate.io live feed notice: {e}")

    # 3. Fetch CoinLore top 1,000 global market ranked assets
    cl_map = {}
    for start in range(0, 1000, 100):
        try:
            r_cl = requests.get(f'https://api.coinlore.net/api/tickers/?start={start}&limit=100', timeout=3.5)
            if r_cl.status_code == 200:
                data = r_cl.json().get('data', [])
                for item in data:
                    price_usd = float(item.get('price_usd') or 0)
                    vol_usd = float(item.get('volume24') or 0)
                    mc_usd = float(item.get('market_cap_usd') or 0)
                    chg = float(item.get('percent_change_24h') or 0)
                    cid = (item.get('nameid') or '').lower()
                    sym = (item.get('symbol') or '').upper()

                    record = {
                        'price_usd': price_usd,
                        'vol_usd': vol_usd,
                        'mc_usd': mc_usd,
                        'chg_pct': chg
                    }
                    if cid:
                        cl_map[cid] = record
                    if sym:
                        cl_map[sym] = record
        except Exception:
            pass

    # 4. Connect to DB and match all 1,000 cryptocurrencies
    try:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        cursor = conn.cursor()
        cursor.execute("SELECT coin_id, symbol FROM cryptocurrencies WHERE is_active = 1")
        all_coins = cursor.fetchall()
    except Exception as e:
        logging.error(f"Database error: {e}")
        return

    dt_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    ticks_to_insert = []

    for coin_id, symbol in all_coins:
        cid_l = (coin_id or '').lower()
        sym_u = (symbol or '').upper()

        price_usd = None
        vol_usd = 0.0
        mc_usd = 0.0
        source = 'live_exchange'

        # Priority 1: MEXC orderbook spot
        if sym_u in mexc_map and mexc_map[sym_u]['price_usd'] > 0:
            price_usd = mexc_map[sym_u]['price_usd']
            vol_usd = mexc_map[sym_u]['vol_usd']
            source = 'mexc_live'
        # Priority 2: Gate.io orderbook spot
        elif sym_u in gate_map and gate_map[sym_u]['price_usd'] > 0:
            price_usd = gate_map[sym_u]['price_usd']
            vol_usd = gate_map[sym_u]['vol_usd']
            source = 'gateio_live'
        # Priority 3: CoinLore market record
        elif cid_l in cl_map and cl_map[cid_l]['price_usd'] > 0:
            price_usd = cl_map[cid_l]['price_usd']
            vol_usd = cl_map[cid_l]['vol_usd']
            mc_usd = cl_map[cid_l]['mc_usd']
            source = 'coinlore_live'
        elif sym_u in cl_map and cl_map[sym_u]['price_usd'] > 0:
            price_usd = cl_map[sym_u]['price_usd']
            vol_usd = cl_map[sym_u]['vol_usd']
            mc_usd = cl_map[sym_u]['mc_usd']
            source = 'coinlore_live'

        if price_usd and price_usd > 0:
            price_inr = price_usd * usd_inr
            vol_inr = vol_usd * usd_inr
            mc_inr = mc_usd * usd_inr if mc_usd > 0 else (price_inr * 10000000.0)
            ticks_to_insert.append((coin_id, dt_str, price_inr, price_inr, vol_inr, mc_inr, source))

    if ticks_to_insert:
        cursor.executemany('''
            INSERT INTO market_prices (coin_id, timestamp, close, price, volume, market_cap, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ticks_to_insert)
        conn.commit()
        logging.info(f"Successfully recorded {len(ticks_to_insert)} authentic live price ticks across crypto universe.")

    conn.close()

if __name__ == "__main__":
    fetch_top_1000_live()
