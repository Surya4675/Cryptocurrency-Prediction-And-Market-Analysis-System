import pandas as pd
import xgboost as xgb
import sqlite3
import joblib
import os
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

DB_PATH = "database/app.db"
MODEL_DIR = "ml/artifacts/models"
os.makedirs(MODEL_DIR, exist_ok=True)

def load_data_for_training(coin_id):
    conn = sqlite3.connect(DB_PATH)
    # The target is the NEXT day's return_1d.
    # We can calculate this by shifting return_1d backwards by 1 within the dataframe.
    query = """
    SELECT * 
    FROM features 
    WHERE coin_id = ?
    ORDER BY date ASC
    """
    df = pd.read_sql_query(query, conn, params=(coin_id,))
    conn.close()
    
    if df.empty:
        return df
        
    df = df.sort_values(by='date')
    # Create the target variable: next day's return
    df['target_return_next_day'] = df['return_1d'].shift(-1)
    
    # Drop the last row since we don't have tomorrow's return yet
    df = df.dropna()
    return df

def train_model(coin_id):
    print(f"Training XGBoost model for {coin_id}...")
    df = load_data_for_training(coin_id)
    if df.empty or len(df) < 50:
        print(f"Not enough data to train model for {coin_id}.")
        return

    # Features and target
    features = ['sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
                'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
                'return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change']
                
    # Include sentiment_score if it exists and has non-null values
    if 'sentiment_score' in df.columns and df['sentiment_score'].notna().sum() > 0:
        # Fill missing sentiment scores with 0 (Neutral)
        df['sentiment_score'] = df['sentiment_score'].fillna(0)
        features.append('sentiment_score')
    
    X = df[features]
    y = df['target_return_next_day'] # Next day return
    
    # Time Series Cross Validation
    tscv = TimeSeriesSplit(n_splits=3)
    
    fold = 1
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]
        
        model = xgb.XGBRegressor(
            n_estimators=100, 
            learning_rate=0.05, 
            max_depth=4, 
            random_state=42
        )
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        mse = mean_squared_error(y_test, preds)
        mae = mean_absolute_error(y_test, preds)
        
        # Calculate directional accuracy
        direction_correct = np.sum(np.sign(preds) == np.sign(y_test)) / len(y_test)
        
        print(f"Fold {fold} - MSE: {mse:.6f}, MAE: {mae:.6f}, Dir. Acc: {direction_correct:.2%}")
        fold += 1
    
    # Train final model on all available data
    final_model = xgb.XGBRegressor(
        n_estimators=100, 
        learning_rate=0.05, 
        max_depth=4, 
        random_state=42
    )
    final_model.fit(X, y)
    
    # Save model
    model_path = os.path.join(MODEL_DIR, f"{coin_id}_xgboost.joblib")
    joblib.dump(final_model, model_path)
    print(f"Final model saved to {model_path}")

if __name__ == '__main__':
    # Train for some basic coins
    coins = ['bitcoin', 'ethereum']
    for c in coins:
        train_model(c)
