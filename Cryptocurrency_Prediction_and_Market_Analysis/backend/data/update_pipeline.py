import os
import sys
import sqlite3
import requests
from datetime import datetime, timedelta
import pandas as pd

# Add root project dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.config import Config
from backend.ml.features.build_features import load_market_data, generate_technical_features, save_features
from backend.ml.sentiment.finbert import analyze_sentiment
from backend.ml.inference.predict import predict_next_day

DB_PATH = Config.DATABASE_PATH
NEWS_API_KEY = Config.NEWS_API_KEY
COINGECKO_API_KEY = Config.COINGECKO_API_KEY

def fetch_coingecko_prices(coin_id):
    """Fetch 30 days of daily historical data for features, and today's latest price."""
    from backend.services.market_data_service import get_coingecko_headers, SUPPORTED_COINS
    info = SUPPORTED_COINS.get(coin_id, {'coingecko_id': coin_id})
    cg_id = info.get('coingecko_id', coin_id)
    url = f"https://api.coingecko.com/api/v3/coins/{cg_id}/market_chart"
    params = {
        'vs_currency': 'inr',
        'days': '35',
        'interval': 'daily'
    }
    headers = get_coingecko_headers()
    try:
        response = requests.get(url, params=params, headers=headers, timeout=4)
        if response.status_code == 200:
            data = response.json()
            prices = data.get('prices', [])
            volumes = data.get('total_volumes', [])
            market_caps = data.get('market_caps', [])
            
            conn = sqlite3.connect(DB_PATH, timeout=60)
            cursor = conn.cursor()
            
            for i in range(len(prices)):
                timestamp = pd.to_datetime(prices[i][0], unit='ms')
                price = prices[i][1]
                volume = volumes[i][1] if i < len(volumes) else 0
                market_cap = market_caps[i][1] if i < len(market_caps) else 0
                
                try:
                    cursor.execute('''
                        INSERT OR IGNORE INTO market_prices (coin_id, timestamp, price, volume, market_cap, source)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (coin_id, timestamp, price, volume, market_cap, 'coingecko'))
                except Exception:
                    pass
                    
            conn.commit()
            conn.close()
            return True
    except Exception as e:
        print(f"CoinGecko API direct request skipped ({e}), switching to market service fallback...")
        
    # Resilient fallback using fetch_chart_history
    try:
        from backend.services.market_data_service import fetch_chart_history
        chart = fetch_chart_history(coin_id, days=35)
        if chart:
            conn = sqlite3.connect(DB_PATH, timeout=60)
            cursor = conn.cursor()
            for pt in chart:
                cursor.execute('''
                    INSERT OR IGNORE INTO market_prices (coin_id, timestamp, price, volume, market_cap, source)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (coin_id, pt['timestamp'], pt['price'], pt.get('volume', 0), pt.get('market_cap', 0), 'history_fallback'))
            conn.commit()
            conn.close()
            return True
    except Exception as e:
        print(f"Fallback history fetch failed for {coin_id}: {e}")
        
    return False

def fetch_news_api(coin_id, coin_name):
    """Fetch the latest news for the coin using Google News RSS (No Rate Limits!)."""
    import urllib.parse
    import xml.etree.ElementTree as ET
    
    query = urllib.parse.quote(f'"{coin_name}" crypto')
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"Error fetching Google News for {coin_id}: {response.status_code}")
            return False
            
        root = ET.fromstring(response.content)
        articles = []
        for item in root.findall('./channel/item')[:15]: # Limit to top 15
            title = item.findtext('title')
            link = item.findtext('link')
            pub_date = item.findtext('pubDate')
            source = item.findtext('source') or "Google News"
            # Google news description contains HTML, we can just use the title as a clean fallback for FinBERT
            description = title 
            
            articles.append({
                'title': title,
                'description': description,
                'source': source,
                'url': link,
                'publishedAt': pub_date
            })
            
    except Exception as e:
        print(f"Error parsing Google News RSS for {coin_id}: {e}")
        return False
        
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    
    for art in articles:
        title = art.get('title')
        if not title:
            continue
            
        desc = art.get('description', '')
        source = art.get('source', 'Unknown')
        url = art.get('url', '')
        pub_date = art.get('publishedAt')
        
        if pub_date:
            try:
                pub_date_str = pd.to_datetime(pub_date).replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")
            except:
                pub_date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        else:
            pub_date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        # Check if URL exists to avoid duplicates
        cursor.execute("SELECT id FROM news_articles WHERE url = ?", (url,))
        if cursor.fetchone() is None:
            cursor.execute('''
                INSERT INTO news_articles (coin_id, title, description, source, url, published_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (coin_id, title, desc, source, url, pub_date_str))
            
    conn.commit()
    conn.close()
    return True

def run_update_pipeline():
    print(f"[{datetime.now()}] Starting background pipeline...")
    
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    
    # Get top 5 coins prioritized by last_requested_at
    cursor.execute("""
        SELECT coin_id, name 
        FROM cryptocurrencies 
        WHERE last_requested_at IS NOT NULL
        ORDER BY last_requested_at DESC 
        LIMIT 5
    """)
    priority_coins = cursor.fetchall()
    
    # If no coins have been requested, fallback to default coins (bitcoin, ethereum)
    if not priority_coins:
        cursor.execute("SELECT coin_id, name FROM cryptocurrencies LIMIT 2")
        priority_coins = cursor.fetchall()
        
    conn.close()
    
    print(f"Processing Priority Queue: {[c[0] for c in priority_coins]}")
    
    for coin_id, coin_name in priority_coins:
        print(f"--- Processing {coin_id} ---")
        # 1. Fetch Market Data
        print(f"Fetching market data for {coin_id}...")
        fetch_coingecko_prices(coin_id)
        
        # 2. Fetch News Data
        print(f"Fetching news for {coin_id}...")
        fetch_news_api(coin_id, coin_name)
        
        # 3. Build Features
        print(f"Building features for {coin_id}...")
        df = load_market_data(coin_id)
        if not df.empty:
            features_df = generate_technical_features(df)
            save_features(coin_id, features_df)
            
    # 4. Analyze Sentiment for all new articles
    print("Running FinBERT Sentiment Analysis...")
    analyze_sentiment()
    
    # 5. Run ML Predictions for the priority coins
    print("Running XGBoost Predictions...")
    for coin_id, _ in priority_coins:
        predict_next_day(coin_id)
        
    print(f"[{datetime.now()}] Pipeline completed successfully.")

if __name__ == '__main__':
    run_update_pipeline()
