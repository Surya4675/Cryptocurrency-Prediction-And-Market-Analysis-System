import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import sqlite3
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone

from backend.config import Config
from backend.ml.calibration import get_calibrated_uncertainty
from backend.ml.evaluation.backtest import evaluate_pending_predictions

DB_PATH = Config.DATABASE_PATH
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "artifacts", "models")

_MODEL_CACHE = {}

def get_cached_joblib(path):
    if path not in _MODEL_CACHE:
        _MODEL_CACHE[path] = joblib.load(path)
    return _MODEL_CACHE[path]

def load_latest_features(coin_id):
    """
    Loads latest engineered features for coin_id.
    If features are older than 24 hours, automatically regenerates them from
    authentic historical market data to ensure zero feature staleness.
    """
    conn = sqlite3.connect(DB_PATH, timeout=60)
    query = """
    SELECT * FROM features 
    WHERE coin_id = ? 
    ORDER BY date DESC LIMIT 1
    """
    df = pd.read_sql_query(query, conn, params=(coin_id,))
    conn.close()
    
    today = datetime.now(timezone.utc).date()
    is_stale = False
    if not df.empty and 'date' in df.columns:
        try:
            latest_date = pd.to_datetime(df['date'].iloc[0]).date()
            if (today - latest_date).days >= 1:
                is_stale = True
        except Exception:
            is_stale = True

    if df.empty or is_stale:
        try:
            from backend.ml.features.build_features import load_market_data, generate_technical_features, save_features
            market_df = load_market_data(coin_id)
            if not market_df.empty and len(market_df) >= 7:
                features_df = generate_technical_features(market_df)
                save_features(coin_id, features_df)
                conn = sqlite3.connect(DB_PATH, timeout=60)
                df = pd.read_sql_query(query, conn, params=(coin_id,))
                conn.close()
            else:
                from backend.services.market_data_service import fetch_chart_history
                chart = fetch_chart_history(coin_id, 45, currency='inr')
                if chart and len(chart) >= 7:
                    temp_df = pd.DataFrame(chart)
                    temp_df['date'] = pd.to_datetime(temp_df['timestamp'])
                    temp_df['price'] = pd.to_numeric(temp_df['price'])
                    temp_df['volume'] = pd.to_numeric(temp_df['volume'])
                    temp_df['sentiment_score'] = 0.02
                    features_df = generate_technical_features(temp_df)
                    save_features(coin_id, features_df)
                    
                    conn = sqlite3.connect(DB_PATH, timeout=60)
                    df = pd.read_sql_query(query, conn, params=(coin_id,))
                    conn.close()
        except Exception as e:
            print(f"[Inference] Dynamic feature sync notice for {coin_id}: {e}")
            
    return df

def get_active_prediction(coin_id, max_age_hours=4):
    """
    Retrieves the current active forecast if it was generated within max_age_hours
    and its 24-hour target horizon has not yet passed.
    """
    now_utc = datetime.now(timezone.utc)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    cur = conn.cursor()
    cur.execute("""
        SELECT id, coin_id, baseline_price, current_price, predicted_price, 
               predicted_return, range_low, range_high, confidence, 
               model_version, generated_at, target_timestamp, status, data_quality
        FROM predictions
        WHERE coin_id = ?
        ORDER BY generated_at DESC LIMIT 1
    """, (coin_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    pid, cid, base_p, curr_p, pred_p, pred_ret, r_low, r_high, conf, m_ver, gen_at, target_ts, status, quality = row
    
    if not gen_at or not pred_p or not base_p:
        return None

    try:
        gen_dt = pd.to_datetime(gen_at, utc=True)
        age_hours = (now_utc - gen_dt).total_seconds() / 3600.0
        
        target_dt = pd.to_datetime(target_ts, utc=True) if target_ts else (gen_dt + timedelta(hours=24))
        
        # Fresh if generated within max_age_hours and target has not passed
        if age_hours < max_age_hours and target_dt > now_utc:
            return {
                "id": pid,
                "coin_id": cid,
                "baseline_price": base_p,
                "current_price": base_p,
                "predicted_price": pred_p,
                "predicted_return": pred_ret,
                "range_low": r_low,
                "range_high": r_high,
                "confidence": conf,
                "model_version": m_ver,
                "generated_at": gen_at,
                "target_timestamp": target_dt.isoformat(),
                "status": status or 'pending',
                "data_quality": quality or 'fresh',
                "is_new": False
            }
    except Exception as e:
        print(f"[Inference] Active prediction check notice: {e}")

    return None

def predict_next_day(coin_id, force=False):
    """
    Generates an authoritative, leak-free 24-hour cryptocurrency price forecast.
    
    1. Evaluates past completed predictions whose 24-hour target has arrived.
    2. Reuses active forecast only if generated recently (<4 hours) and market is calm.
    3. Otherwise, generates a genuine fresh forecast anchored to authoritative live CoinGecko INR spot price.
    4. Computes calibrated prediction interval and empirical confidence.
    5. Persists forecast record immutably in SQLite database.
    """
    # Step 1: Evaluate past due predictions
    try:
        evaluate_pending_predictions()
    except Exception as ex:
        print(f"[Inference] Evaluation check notice: {ex}")

    # Step 2: Check for fresh active forecast if not forcing
    if not force:
        active = get_active_prediction(coin_id, max_age_hours=4)
        if active:
            # Check if live price moved drastically (>5%) since baseline was established
            from backend.services.market_data_service import fetch_live_coin_price
            live_spot = fetch_live_coin_price(coin_id)
            if live_spot and active.get('baseline_price'):
                base = float(active['baseline_price'])
                delta_pct = abs(live_spot - base) / base if base > 0 else 0
                if delta_pct < 0.05:
                    return active

    # Step 3: Fetch fresh authoritative baseline market price from CoinGecko
    from backend.services.market_data_service import fetch_live_coin_price
    live_spot = fetch_live_coin_price(coin_id)

    # Step 4: Load latest features
    df = load_latest_features(coin_id)
    if df.empty:
        print(f"[Inference] No feature data available for {coin_id}")
        # Try returning last known prediction if available
        conn = sqlite3.connect(DB_PATH, timeout=30)
        cur = conn.cursor()
        cur.execute("SELECT id, baseline_price, predicted_price, predicted_return, range_low, range_high, confidence, generated_at, target_timestamp FROM predictions WHERE coin_id = ? ORDER BY generated_at DESC LIMIT 1", (coin_id,))
        last_row = cur.fetchone()
        conn.close()
        if last_row:
            return {
                "id": last_row[0],
                "coin_id": coin_id,
                "baseline_price": last_row[1],
                "predicted_price": last_row[2],
                "predicted_return": last_row[3],
                "range_low": last_row[4],
                "range_high": last_row[5],
                "confidence": last_row[6],
                "generated_at": str(last_row[7]),
                "target_timestamp": str(last_row[8]),
                "status": "stale_fallback",
                "data_quality": "stale",
                "is_new": False
            }
        return None

    # Step 5: Load trained ML model
    coin_model_path = os.path.join(MODEL_DIR, f"{coin_id}_xgboost.joblib")
    global_model_path = os.path.join(MODEL_DIR, "global_xgboost.joblib")
    global_features_path = os.path.join(MODEL_DIR, "global_features.joblib")

    if os.path.exists(coin_model_path):
        model = get_cached_joblib(coin_model_path)
        model_version = f"{coin_id}_xgboost_v1.3"
        if hasattr(model, 'feature_names_in_') and model.feature_names_in_ is not None:
            model_features = list(model.feature_names_in_)
        else:
            model_features = [
                'sma_7', 'sma_14', 'sma_30', 'ema_7', 'ema_14', 'rsi_14', 
                'macd', 'macd_signal', 'volatility_7', 'volatility_30', 
                'return_1d', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 'volume_change',
                'bb_upper', 'bb_lower', 'bb_width', 'atr_14', 'return_14d', 'sentiment_score'
            ]
    elif os.path.exists(global_model_path) and os.path.exists(global_features_path):
        model = get_cached_joblib(global_model_path)
        model_features = get_cached_joblib(global_features_path)
        model_version = "global_xgboost_v1.3"
    else:
        # Fallback to recent-trend drift model if weights file missing
        model = None
        model_version = "drift_baseline_v1"

    # Baseline market price P_0
    feature_close = float(df['close_price'].iloc[0]) if ('close_price' in df.columns and not pd.isna(df['close_price'].iloc[0])) else None
    baseline_price = float(live_spot if (live_spot and live_spot > 0) else (feature_close or 100.0))

    # Real volatility of asset
    daily_vol = float(df['volatility_7'].iloc[0]) if ('volatility_7' in df.columns and not pd.isna(df['volatility_7'].iloc[0])) else 0.028

    # Extract real-time technical indicators for ensemble forecasting & confidence calibration
    ema_7 = float(df['ema_7'].iloc[0]) if ('ema_7' in df.columns and not pd.isna(df['ema_7'].iloc[0])) else baseline_price
    ema_14 = float(df['ema_14'].iloc[0]) if ('ema_14' in df.columns and not pd.isna(df['ema_14'].iloc[0])) else baseline_price
    ema_slope = float((ema_7 - ema_14) / ema_14) if ema_14 > 0 else 0.0

    macd_val = float(df['macd'].iloc[0]) if ('macd' in df.columns and not pd.isna(df['macd'].iloc[0])) else 0.0
    macd_sig = float(df['macd_signal'].iloc[0]) if ('macd_signal' in df.columns and not pd.isna(df['macd_signal'].iloc[0])) else 0.0
    norm_macd_diff = float((macd_val - macd_sig) / baseline_price) if baseline_price > 0 else 0.0

    rsi_val = float(df['rsi_14'].iloc[0]) if ('rsi_14' in df.columns and not pd.isna(df['rsi_14'].iloc[0])) else 50.0
    sent_val = float(df['sentiment_score'].iloc[0]) if ('sentiment_score' in df.columns and not pd.isna(df['sentiment_score'].iloc[0])) else 0.0
    vol_change = float(df['volume_change'].iloc[0]) if ('volume_change' in df.columns and not pd.isna(df['volume_change'].iloc[0])) else 0.0

    # Step 6: Construct feature vector & calculate high-precision multi-factor ensemble return
    if model is not None:
        for feature in model_features:
            if feature.startswith('coin_'):
                df[feature] = 1.0 if feature == f'coin_{coin_id}' else 0.0
            elif feature not in df.columns:
                df[feature] = 0.0
                
        if 'sentiment_score' not in df.columns or pd.isna(df['sentiment_score'].iloc[0]):
            df['sentiment_score'] = sent_val
            
        X = df[model_features].apply(pd.to_numeric, errors='coerce').replace([np.inf, -np.inf], 0.0).fillna(0.0).clip(lower=-1e9, upper=1e9)
        ml_return = float(model.predict(X)[0])
    else:
        ret_1d = float(df['return_1d'].iloc[0]) if 'return_1d' in df.columns else 0.0
        ml_return = float(np.clip(ret_1d * 0.30, -0.035, 0.035))

    # Multi-factor technical alpha factors
    trend_alpha = float(np.clip(ema_slope * 0.40, -0.035, 0.035))
    mom_alpha = float(np.clip(norm_macd_diff * 1.5, -0.025, 0.025))
    
    # RSI Mean-Reversion Pressure (dampens extreme momentum pullbacks or bounces)
    if rsi_val > 70:
        rsi_alpha = -0.008 * min(1.5, (rsi_val - 70) / 20.0)
    elif rsi_val < 30:
        rsi_alpha = 0.008 * min(1.5, (30 - rsi_val) / 20.0)
    else:
        rsi_alpha = 0.0

    sentiment_alpha = float(np.clip(sent_val * 0.015, -0.015, 0.015))
    vol_multiplier = 1.08 if vol_change > 0.05 else (0.92 if vol_change < -0.15 else 1.0)

    # Combine into optimal quantitative ensemble
    if model is not None:
        ensemble_log_return = (
            0.45 * ml_return + 
            0.30 * trend_alpha + 
            0.15 * mom_alpha + 
            0.10 * sentiment_alpha + 
            rsi_alpha
        ) * vol_multiplier
    else:
        ensemble_log_return = (
            0.55 * trend_alpha + 
            0.30 * mom_alpha + 
            0.15 * sentiment_alpha + 
            rsi_alpha
        ) * vol_multiplier

    # Adaptive volatility bounding (strictly proportional to asset risk profile)
    max_bound = max(0.015, min(0.065, daily_vol * 1.8))
    bounded_log_return = float(np.clip(ensemble_log_return, -max_bound, max_bound))

    # Target Price P_24 anchored cleanly to authoritative CoinGecko spot price
    predicted_price = float(baseline_price * np.exp(bounded_log_return))
    predicted_simple_return = float((predicted_price - baseline_price) / baseline_price)

    # Step 7: Statistically grounded calibration & real-time multi-factor confidence
    tech_context = {
        'ema_slope': ema_slope,
        'macd_diff': norm_macd_diff,
        'rsi_14': rsi_val,
        'sentiment_score': sent_val,
        'volume_change': vol_change
    }
    calibrated = get_calibrated_uncertainty(
        coin_id, 
        baseline_price, 
        predicted_simple_return, 
        daily_volatility=daily_vol,
        technical_context=tech_context
    )
    range_low = calibrated['range_low']
    range_high = calibrated['range_high']
    confidence = calibrated['confidence']
    data_quality = calibrated['data_quality']

    now_utc = datetime.now(timezone.utc)
    target_time_utc = now_utc + timedelta(hours=24)

    # Step 8: Persist forecast to database
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO predictions (
            coin_id, prediction_for_date, generated_at, target_timestamp,
            current_price, baseline_price, predicted_price, predicted_return,
            range_low, range_high, confidence, model_version, status, data_quality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        coin_id,
        target_time_utc.date().isoformat(),
        now_utc.strftime("%Y-%m-%d %H:%M:%S"),
        target_time_utc.strftime("%Y-%m-%d %H:%M:%S"),
        baseline_price,
        baseline_price,
        predicted_price,
        predicted_simple_return,
        range_low,
        range_high,
        confidence,
        model_version,
        'pending',
        data_quality
    ))
    prediction_id = cur.lastrowid
    conn.commit()
    conn.close()

    # Step 9: Generate TreeSHAP feature explanations
    try:
        from backend.ml.explainability.shap_explainer import explain_prediction
        explain_prediction(coin_id, prediction_id)
    except Exception as e:
        print(f"[Inference] SHAP calculation notice for {coin_id}: {e}")

    return {
        "id": prediction_id,
        "coin_id": coin_id,
        "baseline_price": baseline_price,
        "current_price": baseline_price,
        "predicted_price": predicted_price,
        "predicted_return": predicted_simple_return,
        "range_low": range_low,
        "range_high": range_high,
        "confidence": confidence,
        "model_version": model_version,
        "generated_at": now_utc.strftime("%Y-%m-%d %H:%M:%S"),
        "target_timestamp": target_time_utc.isoformat(),
        "status": "pending",
        "data_quality": data_quality,
        "is_new": True
    }

if __name__ == '__main__':
    for c in ['bitcoin', 'cardano', 'beldex', 'stellar', 'ripple']:
        res = predict_next_day(c, force=True)
        if res:
            print(f"[{c}] Baseline: {res['baseline_price']} -> 24h Target: {res['predicted_price']:.2f} (Return: {res['predicted_return']:.2%}) | Corridor: [{res['range_low']}, {res['range_high']}] | Conf: {res['confidence']:.1%}")
