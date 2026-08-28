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
    handlers=[
        logging.FileHandler("backend/fetch_live.log"),
        logging.StreamHandler()
    ]
)

load_dotenv()
COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
DB_PATH = "backend/database/app.db"

def fetch_top_1000_live():
    logging.info("Fetching top 1000 live prices from CoinGecko...")
    
    headers = {"accept": "application/json"}
    if COINGECKO_API_KEY and COINGECKO_API_KEY != "your_coingecko_api_key_here":
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        cursor = conn.cursor()
    except sqlite3.Error as e:
        logging.error(f"Database connection failed: {e}")
        return

    dt_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Fetch 4 pages of 250 coins each = 1000 coins
    for page in range(1, 5):
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
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
                
                for coin in data:
                    coin_id = coin.get("id")
                    symbol = coin.get("symbol")
                    name = coin.get("name")
                    price = coin.get("current_price")
                    volume = coin.get("total_volume")
                    market_cap = coin.get("market_cap")
                    
                    # Upsert into cryptocurrencies so the UI dropdown can see it
                    cursor.execute('''
                        INSERT OR IGNORE INTO cryptocurrencies (coin_id, symbol, name, is_active)
                        VALUES (?, ?, ?, 1)
                    ''', (coin_id, symbol, name))
                    
                    if price:
                        # Insert the live price tick
                        cursor.execute('''
                            INSERT OR IGNORE INTO market_prices (coin_id, timestamp, close, price, volume, market_cap, source)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (coin_id, dt_str, price, price, volume, market_cap, "coingecko_live"))
                        
                logging.info(f"Page {page} successfully processed.")
                
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
