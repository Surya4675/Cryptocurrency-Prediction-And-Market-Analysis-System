import sqlite3
import pandas as pd
import numpy as np
import os

DB_PATH = "backend/database/app.db"

def load_market_data(coin_id):
    """Load market data from the database."""
    conn = sqlite3.connect(DB_PATH, timeout=60)
    query = "SELECT timestamp, price, volume FROM market_prices WHERE coin_id = ? ORDER BY timestamp ASC"
    df = pd.read_sql_query(query, conn, params=(coin_id,))
    
    # Load sentiment data
    sentiment_query = """
    SELECT date(n.published_at) as date,
           avg(s.positive_score - s.negative_score) as sentiment_score
    FROM news_articles n
    JOIN sentiment_results s ON n.id = s.news_id
    WHERE n.coin_id = ?
    GROUP BY date(n.published_at)
    """
    sentiment_df = pd.read_sql_query(sentiment_query, conn, params=(coin_id,))
    conn.close()
    
    if df.empty:
        return df
        
    # Convert timestamp to date and group by date (daily resolution)
    df['date'] = pd.to_datetime(df['timestamp']).dt.date
    # Take the last observation of the day
    df = df.groupby('date').last().reset_index()
    
    # Merge sentiment
    sentiment_df['date'] = pd.to_datetime(sentiment_df['date']).dt.date
    df = pd.merge(df, sentiment_df, on='date', how='left')
    df['sentiment_score'] = df['sentiment_score'].fillna(0) # Neutral if no news
    
    return df

def generate_technical_features(df):
    """Generate SMA, EMA, RSI, MACD, and Volatility."""
    # Ensure sorted by date
    df = df.sort_values('date').copy()
    
    # 1. Simple Moving Averages
    df['sma_7'] = df['price'].rolling(window=7).mean()
    df['sma_14'] = df['price'].rolling(window=14).mean()
    df['sma_30'] = df['price'].rolling(window=30).mean()
    
    # 2. Exponential Moving Averages
    df['ema_7'] = df['price'].ewm(span=7, adjust=False).mean()
    df['ema_14'] = df['price'].ewm(span=14, adjust=False).mean()
    
    # 3. Returns (1-day)
    df['return_1d'] = df['price'].pct_change(1)
    
    # 4. Volatility
    df['volatility_7'] = df['return_1d'].rolling(window=7).std()
    df['volatility_30'] = df['return_1d'].rolling(window=30).std()
    
    # 5. RSI (14-period)
    delta = df['price'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi_14'] = 100 - (100 / (1 + rs))
    
    # 6. MACD
    ema_12 = df['price'].ewm(span=12, adjust=False).mean()
    ema_26 = df['price'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema_12 - ema_26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    
    # 7. Lag Features (Prices)
    df['lag_1'] = df['price'].shift(1)
    df['lag_2'] = df['price'].shift(2)
    df['lag_3'] = df['price'].shift(3)
    df['lag_7'] = df['price'].shift(7)
    
    # 8. Volume Change
    df['volume_change'] = df['volume'].pct_change(1)
    
    return df

def save_features(coin_id, df):
    """Save the engineered features back to the database."""
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    
    # Drop rows with NaNs caused by rolling windows
    df_clean = df.dropna().copy()
    
    count = 0
    for _, row in df_clean.iterrows():
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO features (
                    coin_id, date, sma_7, sma_14, sma_30, ema_7, ema_14, 
                    rsi_14, macd, macd_signal, volatility_7, volatility_30, 
                    return_1d, lag_1, lag_2, lag_3, lag_7, volume_change, sentiment_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                coin_id, str(row['date']), 
                row['sma_7'], row['sma_14'], row['sma_30'], 
                row['ema_7'], row['ema_14'], row['rsi_14'], 
                row['macd'], row['macd_signal'], 
                row['volatility_7'], row['volatility_30'], 
                row['return_1d'], row['lag_1'], row['lag_2'], row['lag_3'], row['lag_7'], 
                row['volume_change'], row.get('sentiment_score', 0)
            ))
            count += 1
        except Exception as e:
            print(f"Error inserting feature row for {coin_id} on {row['date']}: {e}")
            
    conn.commit()
    conn.close()
    print(f"Saved {count} feature records for {coin_id}.")

def main():
    print("Starting feature engineering pipeline...")
    if not os.path.exists(DB_PATH):
        print("Database not found. Please run fetch_data.py first.")
        return
        
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    cursor.execute("SELECT coin_id FROM cryptocurrencies")
    coins = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    for coin in coins:
        print(f"Processing features for {coin}...")
        df = load_market_data(coin)
        if df.empty:
            print(f"No data for {coin}, skipping.")
            continue
            
        features_df = generate_technical_features(df)
        save_features(coin, features_df)
        
    print("Feature engineering completed.")

if __name__ == "__main__":
    main()
