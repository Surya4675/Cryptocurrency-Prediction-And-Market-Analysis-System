import os

import sqlite3
import requests
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "backend", "database", "app.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "backend", "database", "schema.sql")

# Basic list of coins to track
COINS = [
    {"id": "bitcoin", "symbol": "btc", "name": "Bitcoin"},
    {"id": "ethereum", "symbol": "eth", "name": "Ethereum"},
    {"id": "solana", "symbol": "sol", "name": "Solana"},
    {"id": "cardano", "symbol": "ada", "name": "Cardano"},
    {"id": "ripple", "symbol": "xrp", "name": "XRP"}
]

def init_db():
    """Ensure the database and tables exist."""
    print("Initializing database...")
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=60)
    
    # Run the schema file
    with open(SCHEMA_PATH, "r") as f:
        schema = f.read()
    
    conn.executescript(schema)
    conn.commit()
    conn.close()

def insert_coins():
    """Insert initial coins into the cryptocurrencies table."""
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    for coin in COINS:
        cursor.execute('''
            INSERT OR IGNORE INTO cryptocurrencies (coin_id, symbol, name, is_active)
            VALUES (?, ?, ?, 1)
        ''', (coin['id'], coin['symbol'], coin['name']))
    conn.commit()
    conn.close()
    print("Inserted base cryptocurrencies.")

def fetch_market_data(coin_id, days=1000):
    """Fetch historical market data from CoinGecko."""
    print(f"Fetching market data for {coin_id}...")
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": "inr",
        "days": str(days),
        "interval": "daily"
    }
    
    headers = {
        "accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    if COINGECKO_API_KEY and COINGECKO_API_KEY != "your_coingecko_api_key_here":
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    max_retries = 3
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            prices = data.get("prices", [])
            volumes = data.get("total_volumes", [])
            market_caps = data.get("market_caps", [])
            
            conn = sqlite3.connect(DB_PATH, timeout=60)
            cursor = conn.cursor()
            
            for i in range(len(prices)):
                timestamp_ms = prices[i][0]
                price = prices[i][1]
                volume = volumes[i][1] if i < len(volumes) else None
                market_cap = market_caps[i][1] if i < len(market_caps) else None
                
                dt = datetime.fromtimestamp(timestamp_ms / 1000.0, tz=timezone.utc)
                
                cursor.execute('''
                    INSERT OR IGNORE INTO market_prices (coin_id, timestamp, close, price, volume, market_cap, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (coin_id, dt.strftime("%Y-%m-%d %H:%M:%S"), price, price, volume, market_cap, "coingecko"))
                
            conn.commit()
            conn.close()
            print(f"Successfully saved market data for {coin_id}.")
            return # Success, exit retry loop
            
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)
                print(f"Rate limited or error on {coin_id}. Retrying in {delay}s... ({e})")
                time.sleep(delay)
            else:
                print(f"Failed to fetch market data for {coin_id} after {max_retries} attempts: {e}")

def get_active_coins():
    """Fetch top 50 active coins from the database, prioritizing recently requested ones."""
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    # Order by last_requested_at so demanded coins jump to the front of the queue
    cursor.execute('SELECT coin_id FROM cryptocurrencies ORDER BY last_requested_at DESC NULLS LAST, id ASC LIMIT 100')
    coins = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    # Fallback if DB is completely empty before fetch_live runs
    if not coins:
        return ["bitcoin", "ethereum", "solana", "cardano", "ripple"]
    return coins

def fetch_news_data(coin_id):
    """Fetch the latest news for the coin using Google News RSS (No Rate Limits!)."""
    import urllib.parse
    import xml.etree.ElementTree as ET
    import pandas as pd
    
    # Check if we already have recent news (within the last 12 hours) to save API quota
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(*) FROM news_articles 
        WHERE coin_id = ? AND published_at > datetime('now', '-12 hours')
    ''', (coin_id,))
    recent_news_count = cursor.fetchone()[0]
    
    if recent_news_count > 0:
        print(f"Skipping News fetch for {coin_id}: {recent_news_count} recent articles already exist.")
        conn.close()
        return
        
    print(f"Fetching news for {coin_id} via Google News...")
    coin_name = coin_id.replace('-', ' ')
    query = urllib.parse.quote(f'"{coin_name}" crypto')
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
            
        root = ET.fromstring(response.content)
        articles = []
        for item in root.findall('./channel/item')[:10]: # Limit to top 10
            title = item.findtext('title')
            link = item.findtext('link')
            pub_date = item.findtext('pubDate')
            source = item.findtext('source') or "Google News"
            description = title 
            
            articles.append({
                'title': title,
                'description': description,
                'source': source,
                'url': link,
                'publishedAt': pub_date
            })
            
        for art in articles:
            title = art.get('title')
            if not title: continue
                
            desc = art.get('description', '')
            source = art.get('source', 'Unknown')
            art_url = art.get('url', '')
            pub_date = art.get('publishedAt')
            
            if pub_date:
                try:
                    pub_date_dt = pd.to_datetime(pub_date).replace(tzinfo=None)
                    pub_date_str = pub_date_dt.strftime("%Y-%m-%d %H:%M:%S")
                except:
                    pub_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            else:
                pub_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute("SELECT id FROM news_articles WHERE url = ?", (art_url,))
            if cursor.fetchone() is None:
                cursor.execute('''
                    INSERT INTO news_articles (coin_id, title, description, source, url, published_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (coin_id, title, desc, source, art_url, pub_date_str))
                
        conn.commit()
        print(f"Successfully saved {len(articles)} news articles for {coin_id}.")
        
    except Exception as e:
        print(f"Error parsing Google News RSS for {coin_id}: {e}")
        
    finally:
        conn.close()

def main():
    print("Starting data fetching pipeline...")
    # Ensure database dir exists
    os.makedirs("backend/database", exist_ok=True)
    
    init_db()
    
    coins_to_fetch = get_active_coins()
    print(f"Will fetch data for {len(coins_to_fetch)} coins.")
    
    for coin_id in coins_to_fetch:
        fetch_market_data(coin_id, days=1000) # Increased to 1000 days for better ML training
        fetch_news_data(coin_id)
        time.sleep(2)  # Basic rate limit sleep
        
    print("Data fetching pipeline completed.")

if __name__ == "__main__":
    main()
