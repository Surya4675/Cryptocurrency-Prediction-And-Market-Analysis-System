import os
import sys
import sqlite3
from datetime import datetime, timezone
import pandas as pd

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.config import Config
from backend.services.market_data_service import (
    SUPPORTED_COINS, 
    fetch_live_coin_price, 
    fetch_live_24h_stats, 
    fetch_chart_history
)
from backend.ml.features.build_features import load_market_data, generate_technical_features, save_features
from backend.ml.inference.predict import predict_next_day

DB_PATH = Config.DATABASE_PATH

def sync_all_coins_live():
    print("=== Syncing All Cryptocurrencies with Real-Time Market Data ===")
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    for coin_id, info in SUPPORTED_COINS.items():
        sym = info['symbol']
        name = info['name']
        print(f"\nProcessing {name} ({sym})...")
        
        # 1. Ensure coin exists in cryptocurrencies table
        cursor.execute('''
            INSERT OR REPLACE INTO cryptocurrencies (coin_id, symbol, name, is_active, last_requested_at)
            VALUES (?, ?, ?, 1, ?)
        ''', (coin_id, sym, name, now_iso))
        
        # 2. Fetch 90 days of daily candles for deep feature calculation
        history_90d = fetch_chart_history(coin_id, days=90)
        print(f"Fetched {len(history_90d)} daily candles for {coin_id}")
        
        price_records = []
        for pt in history_90d:
            ts = pt['timestamp'].replace('T', ' ').replace('Z', '')
            p = pt['price']
            vol = pt.get('volume', 1000000)
            mcap = pt.get('market_cap', 0)
            price_records.append((coin_id, ts, p, p, p, p, p, vol, mcap, 'live_sync'))
            
        # 3. Fetch 24 hours of hourly ticks
        history_24h = fetch_chart_history(coin_id, days=1)
        for pt in history_24h:
            ts = pt['timestamp'].replace('T', ' ').replace('Z', '')
            p = pt['price']
            vol = pt.get('volume', 1000000)
            price_records.append((coin_id, ts, p, p, p, p, p, vol, 0, 'live_tick'))
            
        cursor.executemany('''
            INSERT OR REPLACE INTO market_prices (coin_id, timestamp, open, high, low, close, price, volume, market_cap, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', price_records)
        
        conn.commit()
        
    conn.close()
    print("\nMarket prices synced successfully.")

def build_features_and_predict():
    print("\n=== Updating Technical Features and Machine Learning Predictions ===")
    for coin_id, info in SUPPORTED_COINS.items():
        print(f"Generating features for {coin_id}...")
        df = load_market_data(coin_id)
        if df.empty or len(df) < 5:
            print(f"Warning: insufficient data for {coin_id}")
            continue
        features_df = generate_technical_features(df)
        save_features(coin_id, features_df)
        
        print(f"Running ML forecast for {coin_id}...")
        pred = predict_next_day(coin_id)
        if pred:
            print(f"-> {coin_id.upper()} Forecast: Rs {pred.get('predicted_price'):,.2f} ({pred.get('predicted_return'):+.2%})")

if __name__ == '__main__':
    sync_all_coins_live()
    build_features_and_predict()
    print("\n=== Synchronization & Prediction Complete ===")
