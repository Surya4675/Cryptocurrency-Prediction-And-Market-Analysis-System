import os
import sqlite3
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
DB_PATH = "database/app.db"

# Basic list of coins to track
COINS = [
    {"id": "bitcoin", "symbol": "btc", "name": "Bitcoin"},
    {"id": "ethereum", "symbol": "eth", "name": "Ethereum"}
]

def init_db():
    """Ensure the database and tables exist."""
    print("Initializing database...")
    conn = sqlite3.connect(DB_PATH)
    
    # Run the schema file
    with open("database/schema.sql", "r") as f:
        schema = f.read()
    
    conn.executescript(schema)
    conn.commit()
    conn.close()

def insert_coins():
    """Insert initial coins into the cryptocurrencies table."""
    conn = sqlite3.connect(DB_PATH)
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
        "vs_currency": "usd",
        "days": str(days),
        "interval": "daily"
    }
    
    headers = {"accept": "application/json"}
    if COINGECKO_API_KEY and COINGECKO_API_KEY != "your_coingecko_api_key_here":
        headers["x-cg-demo-api-key"] = COINGECKO_API_KEY

    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        prices = data.get("prices", [])
        volumes = data.get("total_volumes", [])
        market_caps = data.get("market_caps", [])
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # We need OHLC theoretically, but CoinGecko's basic endpoint gives us price.
        # We'll store it as 'close' and 'price'.
        for i in range(len(prices)):
            timestamp_ms = prices[i][0]
            price = prices[i][1]
            volume = volumes[i][1] if i < len(volumes) else None
            market_cap = market_caps[i][1] if i < len(market_caps) else None
            
            # Convert ms timestamp to datetime
            dt = datetime.utcfromtimestamp(timestamp_ms / 1000.0)
            
            cursor.execute('''
                INSERT OR IGNORE INTO market_prices (coin_id, timestamp, close, price, volume, market_cap, source)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (coin_id, dt.strftime("%Y-%m-%d %H:%M:%S"), price, price, volume, market_cap, "coingecko"))
            
        conn.commit()
        conn.close()
        print(f"Successfully saved market data for {coin_id}.")
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch market data for {coin_id}: {e}")

def fetch_news_data(coin_id):
    """Fetch news from NewsAPI (mock or real if key exists)."""
    if not NEWS_API_KEY or NEWS_API_KEY == "your_news_api_key_here":
        print(f"No valid NEWS_API_KEY found. Skipping real news fetch for {coin_id}.")
        return

    print(f"Fetching news for {coin_id}...")
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": coin_id,
        "language": "en",
        "sortBy": "publishedAt",
        "apiKey": NEWS_API_KEY,
        "pageSize": 10
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        articles = data.get("articles", [])
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        for art in articles:
            cursor.execute('''
                INSERT OR IGNORE INTO news_articles (coin_id, title, description, source, url, published_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                coin_id, 
                art.get("title"), 
                art.get("description"), 
                art.get("source", {}).get("name"), 
                art.get("url"), 
                art.get("publishedAt")
            ))
            
        conn.commit()
        conn.close()
        print(f"Successfully saved {len(articles)} news articles for {coin_id}.")
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch news data for {coin_id}: {e}")

def main():
    print("Starting data fetching pipeline...")
    # Ensure database dir exists
    os.makedirs("database", exist_ok=True)
    
    init_db()
    insert_coins()
    
    for coin in COINS:
        fetch_market_data(coin["id"], days=100)
        fetch_news_data(coin["id"])
        time.sleep(2)  # Basic rate limit sleep
        
    print("Data fetching pipeline completed.")

if __name__ == "__main__":
    main()
