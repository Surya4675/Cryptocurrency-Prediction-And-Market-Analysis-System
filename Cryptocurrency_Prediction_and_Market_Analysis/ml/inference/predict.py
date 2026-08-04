import pandas as pd
import xgboost as xgb
import sqlite3
import joblib
import os
from datetime import datetime, timedelta

DB_PATH = "database/app.db"
MODEL_DIR = "ml/artifacts/models"

def load_latest_features(coin_id):
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT * FROM features 
    WHERE coin_id = ? 
    ORDER BY date DESC LIMIT 1
    """
    df = pd.read_sql_query(query, conn, params=(coin_id,))
    conn.close()
    return df

def predict_next_day(coin_id):
    model_path = os.path.join(MODEL_DIR, f"{coin_id}_xgboost.joblib")
    if not os.path.exists(model_path):
        print(f"Model for {coin_id} not found.")
        return None
        
    model = joblib.load(model_path)
    
    df = load_latest_features(coin_id)
    if df.empty:
        print(f"No recent features found for {coin_id}.")
        return None
        
    features = ['sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
                'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
                'return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change']
                
    # Include sentiment_score if the model expects it
    if 'sentiment_score' in df.columns:
        df['sentiment_score'] = df['sentiment_score'].fillna(0)
        features.append('sentiment_score')
                
    X = df[features]
    
    # Check if the model has sentiment_score feature trained
    if len(model.feature_names_in_) != len(X.columns):
        # We might have trained without sentiment score
        X = X[model.feature_names_in_]
        
    predicted_return = float(model.predict(X)[0])
    
    # We'll save it to DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    target_date = pd.to_datetime(df['date'].iloc[0]) + timedelta(days=1)
    
    # Need current price to calculate predicted price
    cursor.execute("SELECT close FROM market_prices WHERE coin_id = ? ORDER BY timestamp DESC LIMIT 1", (coin_id,))
    current_price_row = cursor.fetchone()
    current_price = current_price_row[0] if current_price_row else None
    
    if current_price is not None:
        predicted_price = current_price * (1 + predicted_return)
    else:
        predicted_price = None
    
    cursor.execute('''
        INSERT INTO predictions (coin_id, prediction_for_date, current_price, predicted_price, predicted_return, model_version)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (coin_id, target_date.date(), current_price, predicted_price, predicted_return, 'xgboost_v2_returns'))
    
    conn.commit()
    conn.close()
    
    print(f"Predicted next day price for {coin_id}: {prediction}")
    return prediction

if __name__ == '__main__':
    predict_next_day('bitcoin')
    predict_next_day('ethereum')
