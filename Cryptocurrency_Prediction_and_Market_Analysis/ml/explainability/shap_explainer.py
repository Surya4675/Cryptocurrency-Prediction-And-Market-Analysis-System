import xgboost as xgb
import shap
import pandas as pd
import sqlite3
import joblib
import os

DB_PATH = "database/app.db"
MODEL_DIR = "ml/artifacts/models"

def explain_prediction(coin_id, prediction_id):
    model_path = os.path.join(MODEL_DIR, f"{coin_id}_xgboost.joblib")
    if not os.path.exists(model_path):
        print(f"Model for {coin_id} not found.")
        return
        
    model = joblib.load(model_path)
    
    # Load latest features used for this prediction
    conn = sqlite3.connect(DB_PATH)
    query = """
    SELECT * FROM features 
    WHERE coin_id = ? 
    ORDER BY date DESC LIMIT 1
    """
    df = pd.read_sql_query(query, conn, params=(coin_id,))
    
    if df.empty:
        conn.close()
        return
        
    features = ['sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
                'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
                'return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change']
                
    X = df[features]
    
    # Create TreeExplainer
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)
    
    # Get the SHAP values for this instance
    instance_shap_values = shap_values[0]
    instance_feature_values = X.iloc[0].values
    
    # Sort features by absolute SHAP value magnitude
    import numpy as np
    abs_shap = np.abs(instance_shap_values)
    ranked_indices = np.argsort(-abs_shap)
    
    cursor = conn.cursor()
    for rank, idx in enumerate(ranked_indices):
        feature_name = features[idx]
        feature_value = instance_feature_values[idx]
        shap_value = instance_shap_values[idx]
        
        cursor.execute('''
            INSERT INTO prediction_explanations (prediction_id, feature_name, feature_value, shap_value, rank)
            VALUES (?, ?, ?, ?, ?)
        ''', (prediction_id, feature_name, float(feature_value), float(shap_value), rank + 1))
        
    conn.commit()
    conn.close()
    print(f"Saved SHAP explanations for {coin_id} prediction {prediction_id}.")
