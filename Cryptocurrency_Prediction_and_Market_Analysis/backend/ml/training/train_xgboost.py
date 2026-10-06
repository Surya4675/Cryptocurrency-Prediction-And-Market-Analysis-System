import pandas as pd
import xgboost as xgb
import sqlite3
import joblib
import os
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, RandomizedSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

DB_PATH = "backend/database/app.db"
MODEL_DIR = "backend/ml/artifacts/models"
os.makedirs(MODEL_DIR, exist_ok=True)

def load_data_for_training():
    conn = sqlite3.connect(DB_PATH, timeout=60)
    query = """
    SELECT * 
    FROM features 
    ORDER BY date ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    if df.empty:
        return df
        
    df = df.sort_values(by=['coin_id', 'date'])
    # Create the target variable: next day's log return, calculated per coin
    df['target_return_next_day'] = df.groupby('coin_id')['log_return_1d'].shift(-1)
    
    # Drop rows where target is NaN (the last day of each coin)
    df = df.dropna(subset=['target_return_next_day'])
    
    # Sort back by date for TimeSeriesSplit
    df = df.sort_values(by='date')
    return df

def train_global_model():
    print("Training Global XGBoost model for all coins...")
    df = load_data_for_training()
    if df.empty or len(df) < 500:
        print("Not enough data to train global model.")
        return

    # Features and target
    features = ['sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
                'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
                'return_1d', 'log_return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change',
                'bb_upper', 'bb_lower', 'bb_width', 'atr_14', 'return_14d']
                
    # Include sentiment_score if it exists and has non-null values
    if 'sentiment_score' in df.columns and df['sentiment_score'].notna().sum() > 0:
        df['sentiment_score'] = df['sentiment_score'].fillna(0)
        features.append('sentiment_score')
    
    # One-hot encode coin_id to give the model coin-specific context
    coin_dummies = pd.get_dummies(df['coin_id'], prefix='coin')
    df = pd.concat([df, coin_dummies], axis=1)
    features.extend(coin_dummies.columns.tolist())
    
    # Handle any remaining NaNs in features
    X = df[features].fillna(0)
    y = df['target_return_next_day'] 
    
    print(f"Dataset shape: {X.shape}")
    
    # Time Series Cross Validation
    tscv = TimeSeriesSplit(n_splits=3)
    
    fold = 1
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X.iloc[train_index], X.iloc[test_index]
        y_train, y_test = y.iloc[train_index], y.iloc[test_index]
        
        model = xgb.XGBRegressor(
            n_estimators=100, 
            learning_rate=0.05, 
            max_depth=5, 
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
    
    # Hyperparameter tuning with RandomizedSearchCV - constrained to prevent over-regularizing trees to single leaves
    param_distributions = {
        'n_estimators': [100, 150],
        'learning_rate': [0.03, 0.05],
        'max_depth': [3, 4, 5],
        'subsample': [0.8, 0.9],
        'colsample_bytree': [0.8, 0.9],
        'min_child_weight': [1, 2],
        'gamma': [0.0, 0.01],
        'alpha': [0.0, 0.01],
        'lambda': [1.0, 1.2]
    }
    
    xgb_base = xgb.XGBRegressor(random_state=42)
    search = RandomizedSearchCV(
        estimator=xgb_base,
        param_distributions=param_distributions,
        n_iter=8,
        scoring='neg_mean_absolute_error',
        cv=TimeSeriesSplit(n_splits=3),
        random_state=42,
        n_jobs=-1
    )
    print("Running hyperparameter tuning...")
    search.fit(X, y)
    
    print(f"Best params: {search.best_params_}")
    final_model = search.best_estimator_
    
    # Save global model and feature list
    model_path = os.path.join(MODEL_DIR, "global_xgboost.joblib")
    joblib.dump(final_model, model_path)
    
    features_path = os.path.join(MODEL_DIR, "global_features.joblib")
    joblib.dump(features, features_path)
    print(f"Final global model saved to {model_path}")

def train_coin_models():
    """
    Train coin-specific XGBoost models for each cryptocurrency with historical feature records.
    Coin-specific models capture the distinct price dynamics, volatility, and trend behaviors
    of individual assets, yielding realistic bidirectional forecasts.
    """
    print("Training coin-specific XGBoost models...")
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT coin_id FROM features")
    coins = [row[0] for row in cursor.fetchall()]
    conn.close()

    base_features = [
        'sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
        'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
        'return_1d', 'log_return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change',
        'bb_upper', 'bb_lower', 'bb_width', 'atr_14', 'return_14d'
    ]

    for coin_id in coins:
        conn = sqlite3.connect(DB_PATH, timeout=60)
        df = pd.read_sql_query(
            "SELECT * FROM features WHERE coin_id = ? ORDER BY date ASC",
            conn,
            params=(coin_id,)
        )
        conn.close()

        if len(df) < 15:
            print(f"Skipping {coin_id}: insufficient data ({len(df)} records)")
            continue

        df['target_return_next_day'] = df['log_return_1d'].shift(-1)
        train_df = df.dropna(subset=['target_return_next_day']).copy()

        active_features = [f for f in base_features if f in train_df.columns]
        if 'sentiment_score' in train_df.columns and train_df['sentiment_score'].notna().any():
            active_features.append('sentiment_score')

        X = train_df[active_features].fillna(0)
        y = train_df['target_return_next_day']

        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=1,
            gamma=0.0,
            reg_alpha=0.01,
            reg_lambda=1.0,
            random_state=42
        )
        model.fit(X, y)

        coin_model_path = os.path.join(MODEL_DIR, f"{coin_id}_xgboost.joblib")
        joblib.dump(model, coin_model_path)
        
        # Verify non-empty trees
        b = model.get_booster()
        splits = sum(t.count('\n') > 1 for t in b.get_dump())
        print(f"Saved {coin_id} model: {splits}/{len(b.get_dump())} trees with active splits")

if __name__ == '__main__':
    train_global_model()
    train_coin_models()

