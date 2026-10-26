import os
import sys
import sqlite3
import numpy as np
import pandas as pd
import joblib

# Ensure project root in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.config import Config
from backend.ml.inference.predict import predict_next_day

def audit_database():
    print("=" * 60)
    print("1. DATABASE AUDIT")
    print("=" * 60)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    cursor = conn.cursor()
    
    tables = [
        'cryptocurrencies', 'market_prices', 'news_articles',
        'sentiment_results', 'features', 'predictions',
        'prediction_explanations', 'model_runs', 'watchlist'
    ]
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Table '{table}': {count:,} records")
        
    cursor.execute("SELECT MIN(date), MAX(date) FROM features")
    feat_dates = cursor.fetchone()
    print(f"Features date range: {feat_dates[0]} to {feat_dates[1]}")
    
    cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM market_prices")
    price_dates = cursor.fetchone()
    print(f"Market prices date range: {price_dates[0]} to {price_dates[1]}")
    
    conn.close()

def audit_models():
    print("\n" + "=" * 60)
    print("2. ML MODELS AUDIT")
    print("=" * 60)
    model_dir = os.path.join(BASE_DIR, "backend", "ml", "artifacts", "models")
    model_files = [f for f in os.listdir(model_dir) if f.endswith(".joblib")]
    print(f"Total model files found: {len(model_files)}")
    
    key_coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin']
    for coin in key_coins:
        model_name = f"{coin}_xgboost.joblib"
        path = os.path.join(model_dir, model_name)
        if os.path.exists(path):
            m = joblib.load(path)
            booster = m.get_booster()
            dump = booster.get_dump()
            splits = sum(t.count('\n') > 1 for t in dump)
            print(f"Model {model_name:25}: Validated ({splits}/{len(dump)} active split trees)")
        else:
            print(f"Model {model_name:25}: MISSING!")
            
    global_path = os.path.join(model_dir, "global_xgboost.joblib")
    if os.path.exists(global_path):
        m = joblib.load(global_path)
        booster = m.get_booster()
        dump = booster.get_dump()
        splits = sum(t.count('\n') > 1 for t in dump)
        print(f"Model global_xgboost.joblib    : Validated ({splits}/{len(dump)} active split trees)")
    else:
        print("Model global_xgboost.joblib    : MISSING!")

def audit_historical_accuracy():
    print("\n" + "=" * 60)
    print("3. HISTORICAL PREDICTION ACCURACY AUDIT")
    print("=" * 60)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    
    # Check predictions against actual next-day market prices
    query = """
    SELECT p.coin_id, p.prediction_for_date, p.current_price, p.predicted_price, p.predicted_return,
           mp.price as actual_price
    FROM predictions p
    JOIN market_prices mp ON p.coin_id = mp.coin_id 
         AND date(mp.timestamp) = p.prediction_for_date
    WHERE p.predicted_price IS NOT NULL AND mp.price IS NOT NULL
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if not df.empty and len(df) >= 5:
        # Calculate MAE, MAPE, RMSE, Directional Accuracy
        df['actual_return'] = (df['actual_price'] - df['current_price']) / df['current_price']
        df['predicted_return_calc'] = (df['predicted_price'] - df['current_price']) / df['current_price']
        
        abs_pct_err = np.abs((df['actual_price'] - df['predicted_price']) / df['actual_price']) * 100
        mape = abs_pct_err.mean()
        mae = np.abs(df['actual_price'] - df['predicted_price']).mean()
        rmse = np.sqrt(np.mean((df['actual_price'] - df['predicted_price']) ** 2))
        
        # Directional accuracy: did price move in predicted direction?
        dir_correct = np.sign(df['actual_return']) == np.sign(df['predicted_return_calc'])
        dir_acc = dir_correct.mean() * 100
        
        print(f"Evaluated on {len(df)} past recorded predictions:")
        print(f"  - Mean Absolute Percentage Error (MAPE): {mape:.2f}% (Price accuracy: {100 - mape:.2f}%)")
        print(f"  - Directional Accuracy: {dir_acc:.2f}%")
        print(f"  - RMSE: {rmse:.4f}")
    else:
        print(f"Fewer than 5 recorded past predictions with matched actual next-day prices found ({len(df)} records).")
        # Let's perform walk-forward validation on recent features
        print("Performing walk-forward accuracy test on features data...")
        from sklearn.metrics import mean_absolute_percentage_error
        conn = sqlite3.connect(Config.DATABASE_PATH)
        key_coins = ['bitcoin', 'ethereum', 'solana', 'dogecoin']
        model_dir = os.path.join(BASE_DIR, "backend", "ml", "artifacts", "models")
        
        for coin in key_coins:
            df_feat = pd.read_sql_query(
                "SELECT * FROM features WHERE coin_id = ? ORDER BY date ASC",
                conn, params=(coin,)
            )
            if len(df_feat) >= 15:
                df_feat['actual_next_price'] = df_feat['close_price'].shift(-1)
                valid = df_feat.dropna(subset=['actual_next_price']).tail(14).copy()
                
                coin_model_path = os.path.join(model_dir, f"{coin}_xgboost.joblib")
                if os.path.exists(coin_model_path):
                    model = joblib.load(coin_model_path)
                    features = [
                        'sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
                        'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
                        'return_1d', 'log_return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change',
                        'bb_upper', 'bb_lower', 'bb_width', 'atr_14', 'return_14d'
                    ]
                    if 'sentiment_score' in valid.columns:
                        features.append('sentiment_score')
                    active_feats = [f for f in features if f in valid.columns]
                    X = valid[active_feats].fillna(0)
                    pred_log_ret = model.predict(X)
                    
                    # Bounding
                    pred_next_price = valid['close_price'] * np.exp(np.clip(pred_log_ret, -0.05, 0.05))
                    mape = mean_absolute_percentage_error(valid['actual_next_price'], pred_next_price) * 100
                    acc = 100 - mape
                    actual_ret = (valid['actual_next_price'] - valid['close_price']) / valid['close_price']
                    pred_ret = (pred_next_price - valid['close_price']) / valid['close_price']
                    dir_acc = (np.sign(actual_ret) == np.sign(pred_ret)).mean() * 100
                    
                    print(f"  {coin:12}: Test Accuracy = {acc:.2f}%, MAPE = {mape:.2f}%, Directional Acc = {dir_acc:.1f}%")
        conn.close()

def audit_live_inference():
    print("\n" + "=" * 60)
    print("4. LIVE INFERENCE & SHAP EXPLAINABILITY AUDIT")
    print("=" * 60)
    for coin in ['bitcoin', 'ethereum', 'solana']:
        res = predict_next_day(coin, force=True)
        if res:
            cp = res.get('current_price', 0)
            pp = res.get('predicted_price', 0)
            ret = res.get('predicted_return', 0)
            low = res.get('range_low', 0)
            high = res.get('range_high', 0)
            print(f"Coin: {coin.title()}")
            print(f"  Current Spot Price: {cp:,.2f}")
            print(f"  Predicted Price   : {pp:,.2f} ({ret*100:+.2f}%)")
            print(f"  Corridor Bounds   : [{low:,.2f} - {high:,.2f}]")
            
            # Check corridor sanity
            assert low <= pp <= high, f"Corridor violation: {low} <= {pp} <= {high}"
            assert abs(ret) < 0.10, f"Unreasonable 24h prediction return: {ret*100:.2f}%"
            print("  Corridor & Return checks: PASSED")
        else:
            print(f"Failed to generate prediction for {coin}")

if __name__ == "__main__":
    audit_database()
    audit_models()
    audit_historical_accuracy()
    audit_live_inference()
    print("\n" + "=" * 60)
    print("AUDIT COMPLETE")
    print("=" * 60)
