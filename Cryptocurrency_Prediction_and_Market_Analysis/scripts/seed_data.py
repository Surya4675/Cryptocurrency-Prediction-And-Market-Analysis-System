import os
import sys
import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.config import Config
from backend.ml.features.build_features import generate_technical_features, save_features
from backend.ml.inference.predict import predict_next_day
from backend.data.update_pipeline import fetch_news_api
from backend.ml.sentiment.finbert import analyze_sentiment

DB_PATH = Config.DATABASE_PATH

# Professional coin definitions with realistic 24h trends and current INR price
COIN_PROFILES = [
    # (coin_id, symbol, name, current_price, 24h_drift, daily_volatility)
    ('bitcoin', 'BTC', 'Bitcoin', 8488540.0, +0.024, 0.015),       # Bullish uptrend (+2.4%)
    ('ethereum', 'ETH', 'Ethereum', 270218.0, +0.008, 0.018),     # Mild uptrend (+0.8%)
    ('solana', 'SOL', 'Solana', 11605.92, +0.041, 0.028),         # Strong rally (+4.1%)
    ('ripple', 'XRP', 'XRP', 142.58, -0.023, 0.020),             # Bearish pullback (-2.3%)
    ('cardano', 'ADA', 'Cardano', 23.55, -0.012, 0.022),          # Pullback (-1.2%)
    ('dogecoin', 'DOGE', 'Dogecoin', 9.01, +0.052, 0.035),        # High volatility surge (+5.2%)
    ('polkadot', 'DOT', 'Polkadot', 113.66, -0.018, 0.024),       # Downtrend (-1.8%)
    ('chainlink', 'LINK', 'Chainlink', 1257.47, +0.015, 0.020),   # Uptrend (+1.5%)
    ('avalanche-2', 'AVAX', 'Avalanche', 1087.93, +0.031, 0.026), # Rebound (+3.1%)
    ('litecoin', 'LTC', 'Litecoin', 6093.37, -0.011, 0.016),      # Mild downtrend (-1.1%)
]

def seed_cryptocurrencies():
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    for coin_id, symbol, name, _, _, _ in COIN_PROFILES:
        cursor.execute('''
            INSERT OR REPLACE INTO cryptocurrencies (coin_id, symbol, name, is_active, last_requested_at)
            VALUES (?, ?, ?, 1, ?)
        ''', (coin_id, symbol, name, now_iso))
    conn.commit()
    conn.close()
    print("Cryptocurrencies seeded.")

def seed_market_prices():
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    
    now = datetime.now(timezone.utc)
    
    for coin_id, _, _, current_price, drift_24h, vol in COIN_PROFILES:
        np.random.seed(hash(coin_id) % 10000)
        
        # 1. Historical Daily Candles (Past 90 Days up to 48 hours ago)
        daily_days = 90
        daily_prices = [current_price * (1 - drift_24h)]
        daily_returns = np.random.normal(loc=0.001, scale=vol, size=daily_days)
        
        for r in reversed(daily_returns[:-1]):
            prev = daily_prices[-1] / (1 + r)
            daily_prices.append(prev)
        daily_prices = list(reversed(daily_prices))
        
        for i in range(daily_days):
            day_dt = now - timedelta(days=daily_days - i)
            ts_str = day_dt.strftime("%Y-%m-%d 00:00:00")
            p = float(daily_prices[i])
            h = p * (1 + abs(np.random.normal(0, vol * 0.5)))
            l = p * (1 - abs(np.random.normal(0, vol * 0.5)))
            v = p * np.random.uniform(500, 5000)
            mcap = p * 19000000 if coin_id == 'bitcoin' else p * 100000000
            
            cursor.execute('''
                INSERT OR REPLACE INTO market_prices (coin_id, timestamp, open, high, low, close, price, volume, market_cap, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'history')
            ''', (coin_id, ts_str, p, h, l, p, p, v, mcap))
            
        # 2. High-Resolution Intraday Hourly Candles (Last 48 Hours ending at now)
        hours = 48
        # Start from price 48h ago according to the coin's specified 24h trend
        price_24h_ago = current_price / (1 + drift_24h)
        start_48h_price = price_24h_ago / (1 + drift_24h * 0.5)
        
        # Linear trajectory + Brownian noise for realistic price action
        steps = np.linspace(start_48h_price, current_price, hours)
        noise = np.random.normal(0, current_price * vol * 0.15, hours)
        noise[0] = 0
        noise[-1] = 0  # Anchor exact ending price at current_price
        hourly_prices = steps + noise
        
        for h_idx in range(hours):
            h_dt = now - timedelta(hours=hours - 1 - h_idx)
            ts_str = h_dt.strftime("%Y-%m-%d %H:%M:%S")
            p = float(hourly_prices[h_idx])
            high = p * (1 + abs(np.random.normal(0, vol * 0.25)))
            low = p * (1 - abs(np.random.normal(0, vol * 0.25)))
            vol_val = p * np.random.uniform(100, 1000)
            mcap = p * 19000000 if coin_id == 'bitcoin' else p * 100000000
            
            cursor.execute('''
                INSERT OR REPLACE INTO market_prices (coin_id, timestamp, open, high, low, close, price, volume, market_cap, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'intraday')
            ''', (coin_id, ts_str, p, high, low, p, p, vol_val, mcap))
            
    conn.commit()
    conn.close()
    print("Seeded both historical daily and 48-hour intraday candles for all coins.")

def seed_features():
    for coin_id, _, _, _, _, _ in COIN_PROFILES:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        df = pd.read_sql_query(
            "SELECT timestamp, price, volume FROM market_prices WHERE coin_id = ? ORDER BY timestamp ASC",
            conn,
            params=(coin_id,)
        )
        conn.close()
        
        if not df.empty:
            df['date'] = pd.to_datetime(df['timestamp']).dt.date
            df = df.groupby('date').last().reset_index()
            features_df = generate_technical_features(df)
            save_features(coin_id, features_df)

def seed_news_and_sentiment():
    print("Fetching news and analyzing sentiment for all coins...")
    for coin_id, _, name, _, _, _ in COIN_PROFILES:
        try:
            fetch_news_api(coin_id, name)
        except Exception as e:
            print(f"News fetch warning for {coin_id}: {e}")
    analyze_sentiment()

def seed_predictions():
    print("Generating AI predictions and TreeSHAP explanations...")
    for coin_id, _, _, _, _, _ in COIN_PROFILES:
        try:
            predict_next_day(coin_id)
        except Exception as e:
            print(f"Prediction error for {coin_id}: {e}")

def main():
    print("=== Enterprise Data Seeder ===")
    seed_cryptocurrencies()
    seed_market_prices()
    seed_features()
    seed_news_and_sentiment()
    seed_predictions()
    print("=== Enterprise Seeding Complete ===")

if __name__ == "__main__":
    main()
