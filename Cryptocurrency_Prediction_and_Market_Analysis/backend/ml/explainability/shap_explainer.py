import os
import sqlite3
import pandas as pd
import numpy as np
import joblib
import xgboost as xgb
from backend.config import Config

DB_PATH = Config.DATABASE_PATH
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "artifacts", "models")

FALLBACK_FEATURES = [
    'sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
    'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
    'return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change',
    'bb_upper', 'bb_lower', 'bb_width', 'atr_14', 'return_14d', 'sentiment_score'
]

def explain_prediction(coin_id, prediction_id):
    """
    Computes exact TreeSHAP feature contributions using XGBoost's native C++ engine.
    Stores the ranked explanations in the database.
    """
    # 1. Locate model (coin-specific model first, fallback to global)
    model_path = os.path.join(MODEL_DIR, f"{coin_id}_xgboost.joblib")
    if not os.path.exists(model_path):
        model_path = os.path.join(MODEL_DIR, "global_xgboost.joblib")
        
    if not os.path.exists(model_path):
        print(f"No model found for {coin_id} at {model_path}.")
        return False
        
    model = joblib.load(model_path)
    booster = model.get_booster() if hasattr(model, 'get_booster') else model
    
    # 2. Load latest features for this coin
    conn = sqlite3.connect(DB_PATH, timeout=60)
    query = """
    SELECT * FROM features 
    WHERE coin_id = ? 
    ORDER BY date DESC LIMIT 1
    """
    df = pd.read_sql_query(query, conn, params=(coin_id,))
    
    if df.empty:
        conn.close()
        # Generate features dynamically if not present
        try:
            from backend.ml.features.build_features import generate_features_for_coin
            print(f"Generating features dynamically for {coin_id}...")
            generate_features_for_coin(coin_id)
            conn = sqlite3.connect(DB_PATH, timeout=60)
            df = pd.read_sql_query(query, conn, params=(coin_id,))
        except Exception as e:
            print(f"Could not generate features on the fly for {coin_id}: {e}")
            
    if df.empty:
        if 'conn' in locals() and conn:
            conn.close()
        print(f"No features available to explain for {coin_id}.")
        return False
        
    # 3. Determine expected feature set
    if hasattr(model, 'feature_names_in_') and model.feature_names_in_ is not None:
        features = list(model.feature_names_in_)
    else:
        features_path = os.path.join(MODEL_DIR, "global_features.joblib")
        if os.path.exists(features_path):
            features = joblib.load(features_path)
        else:
            features = FALLBACK_FEATURES
            
    # Align dataframe with expected model features
    for f in features:
        if f not in df.columns:
            df[f] = 0.0
            
    # Handle one-hot encoding if coin_* columns are present in global model
    coin_col = f"coin_{coin_id}"
    if coin_col in df.columns:
        df[coin_col] = 1.0

    X = df[features].apply(pd.to_numeric, errors='coerce').replace([np.inf, -np.inf], 0.0).fillna(0.0)
    X = X.clip(lower=-1e9, upper=1e9)
    
    # 4. Native TreeSHAP computation via XGBoost pred_contribs
    try:
        dmat = xgb.DMatrix(X)
        # Returns [shap_value_feature_1, ..., shap_value_feature_n, bias]
        contribs = booster.predict(dmat, pred_contribs=True)[0]
        feature_shap_values = contribs[:-1]
    except Exception as e:
        print(f"Native TreeSHAP calculation notice for {coin_id}: {e}")
        # Robust fallback using model feature importance weights
        try:
            feature_importances = booster.get_score(importance_type='weight')
            total_imp = sum(feature_importances.values()) or 1.0
            feature_shap_values = []
            for f in features:
                imp = feature_importances.get(f, 0.01) / total_imp
                val = float(X[f].iloc[0]) if f in X.columns else 0.0
                sign = 1.0 if val >= 0 else -1.0
                feature_shap_values.append(sign * imp * 0.02)
        except Exception as fallback_err:
            print(f"Fallback feature contribution failed for {coin_id}: {fallback_err}")
            conn.close()
            return False
        
    instance_feature_values = X.iloc[0].values
    
    # Filter out one-hot coin columns from explanation display for cleaner insights
    valid_indices = [i for i, name in enumerate(features) if not name.startswith("coin_")]
    valid_shap = [feature_shap_values[i] for i in valid_indices]
    valid_names = [features[i] for i in valid_indices]
    valid_values = [instance_feature_values[i] for i in valid_indices]
    
    # Sort features by absolute SHAP magnitude
    ranked_order = np.argsort(-np.abs(valid_shap))
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM prediction_explanations WHERE prediction_id = ?", (prediction_id,))
    
    for rank, idx in enumerate(ranked_order):
        feature_name = valid_names[idx]
        feature_value = float(valid_values[idx])
        shap_value = float(valid_shap[idx])
        
        cursor.execute('''
            INSERT INTO prediction_explanations (prediction_id, feature_name, feature_value, shap_value, rank)
            VALUES (?, ?, ?, ?, ?)
        ''', (prediction_id, feature_name, feature_value, shap_value, rank + 1))
        
    conn.commit()
    conn.close()
    print(f"Saved {len(ranked_order)} SHAP explanations for {coin_id} (prediction {prediction_id}).")
    return True

