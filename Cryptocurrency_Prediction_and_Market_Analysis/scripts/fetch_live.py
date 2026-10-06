import os
import sqlite3
import requests
import time
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

load_dotenv()
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "database", "app.db")

# Cache known coins in memory to avoid constant DB writes
KNOWN_COINS = set()

def fetch_top_1000_live():
    logging.info("Fetching top 1000 live prices from CoinGecko...")
    
    headers = {
        "accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    if COINGECKO_API_KEY and COINGECKO_API_KEY != "your_coingecko_api_key_here":
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        cursor = conn.cursor()
    except sqlite3.Error as e:
        logging.error(f"Database connection failed: {e}")
        return

    # Load existing coins into memory cache on first run
    if not KNOWN_COINS:
        cursor.execute("SELECT coin_id FROM cryptocurrencies")
        for row in cursor.fetchall():
            KNOWN_COINS.add(row[0])

    dt_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Fetch 4 pages of 250 coins each = 1000 coins
    for page in range(1, 5):
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "inr",
            "order": "market_cap_desc",
            "per_page": 250,
            "page": page,
            "sparkline": "false"
        }
        
        max_retries = 3
        base_delay = 5
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, headers=headers)
                response.raise_for_status()
                data = response.json()
                
                new_coins = []
                price_ticks = []
                
                for coin in data:
                    coin_id = coin.get("id")
                    symbol = coin.get("symbol")
                    name = coin.get("name")
                    price = coin.get("current_price")
                    volume = coin.get("total_volume")
                    market_cap = coin.get("market_cap")
                    
                    # Only append to new_coins if it's completely new
                    if coin_id not in KNOWN_COINS:
                        new_coins.append((coin_id, symbol, name))
                        KNOWN_COINS.add(coin_id)
                    
                    if price:
                        price_ticks.append((coin_id, dt_str, price, price, volume, market_cap, "coingecko_live"))
                
                # 1. Batch insert new coins (if any)
                if new_coins:
                    cursor.executemany('''
                        INSERT OR IGNORE INTO cryptocurrencies (coin_id, symbol, name, is_active)
                        VALUES (?, ?, ?, 1)
                    ''', new_coins)
                
                # 2. Batch insert all 250 price ticks in one fast transaction
                if price_ticks:
                    cursor.executemany('''
                        INSERT OR IGNORE INTO market_prices (coin_id, timestamp, close, price, volume, market_cap, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', price_ticks)
                        
                logging.info(f"Page {page} successfully processed. ({len(price_ticks)} ticks saved)")
                
                # Respect rate limits, especially on free tier
                time.sleep(2)
                break # Success, break retry loop
                
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    logging.warning(f"Rate limited or error on page {page}. Retrying in {delay}s... ({e})")
                    time.sleep(delay)
                else:
                    logging.error(f"Network error on page {page} after {max_retries} attempts: {e}")
            except Exception as e:
                logging.error(f"Failed to fetch live prices on page {page}: {e}")
                break # Break on non-network errors
            
    conn.commit()
    conn.close()
    logging.info("Top 1000 update complete.")

if __name__ == "__main__":
    fetch_top_1000_live()
