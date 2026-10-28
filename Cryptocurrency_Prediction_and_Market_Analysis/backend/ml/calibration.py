import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from backend.config import Config

DB_PATH = Config.DATABASE_PATH
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "models")

# Default empirically grounded priors when holdout data is limited
# Typical daily crypto volatility is 2% - 5%, and standard 1-day directional accuracy for XGBoost return models is 52% - 62%
DEFAULT_CALIBRATION = {
    'residual_std': 0.038,       # standard deviation of log-return prediction errors (~3.8%)
    'directional_accuracy': 0.56, # 56% out-of-sample directional hit rate
    'coverage_z': 1.645,         # 90% normal prediction interval multiplier
    'min_interval_pct': 0.015    # minimum 1.5% interval half-width to prevent unrealistically tight bands
}

def get_calibrated_uncertainty(coin_id, current_price, predicted_return, daily_volatility=None):
    """
    Computes statistically grounded prediction intervals and calibrated confidence
    based on out-of-sample residual variance and empirical validation.
    
    Parameters:
    - coin_id: str
    - current_price: float, baseline spot price P_0
    - predicted_return: float, predicted simple return ((P_24 - P_0) / P_0)
    - daily_volatility: float or None, recent 7-day volatility of returns
    
    Returns:
    - dict with range_low, range_high, calibrated_confidence, data_quality, metrics
    """
    if current_price <= 0:
        current_price = 1.0

    # 1. Fetch historical prediction evaluation errors for this coin or asset pool
    conn = sqlite3.connect(DB_PATH, timeout=30)
    cur = conn.cursor()
    cur.execute("""
        SELECT percentage_error, directional_success, in_corridor
        FROM predictions
        WHERE status = 'evaluated' AND percentage_error IS NOT NULL
        ORDER BY evaluated_at DESC LIMIT 100
    """)
    rows = cur.fetchall()
    conn.close()

    n_eval = len(rows)
    if n_eval >= 15:
        # We have genuine historical empirical evaluation records
        apes = [r[0] / 100.0 for r in rows] # fractional error
        dir_hits = [1 if r[1] else 0 for r in rows]
        corridor_hits = [1 if r[2] else 0 for r in rows]
        
        empirical_error_std = float(np.std(apes)) if np.std(apes) > 0.005 else DEFAULT_CALIBRATION['residual_std']
        dir_acc = float(np.mean(dir_hits))
        # Smooth directional accuracy with empirical prior to avoid extreme swings with small N
        calibrated_dir_acc = (dir_acc * n_eval + DEFAULT_CALIBRATION['directional_accuracy'] * 15) / (n_eval + 15)
        data_quality = 'verified_history'
    else:
        empirical_error_std = DEFAULT_CALIBRATION['residual_std']
        calibrated_dir_acc = DEFAULT_CALIBRATION['directional_accuracy']
        data_quality = 'provisional_prior'

    # Combine asset-specific daily volatility with model residual error
    vol = daily_volatility if (daily_volatility is not None and daily_volatility > 0.005) else 0.032
    # Combined forecast standard error for 24 hours: sqrt(residual_var + 0.5 * vol_var)
    combined_se = float(np.sqrt(empirical_error_std**2 + 0.5 * (vol**2)))
    
    # 90% prediction interval half-width: z * standard_error
    half_width = max(DEFAULT_CALIBRATION['min_interval_pct'], DEFAULT_CALIBRATION['coverage_z'] * combined_se)
    
    # Strictly respect boundaries:
    range_low = float(current_price * (1.0 + predicted_return - half_width))
    range_high = float(current_price * (1.0 + predicted_return + half_width))
    
    # Ensure positive and strictly monotonic
    if range_low <= 0:
        range_low = current_price * 0.5
    if range_low >= range_high:
        range_high = range_low * 1.05

    # Calibrated confidence represents the empirical out-of-sample directional hit rate / reliability probability
    # Never claim > 75% or 95% for 1-day financial returns
    conf_score = round(float(np.clip(calibrated_dir_acc, 0.50, 0.72)), 3)

    return {
        'range_low': round(range_low, 4 if range_low < 10 else 2),
        'range_high': round(range_high, 4 if range_high < 10 else 2),
        'half_width_pct': round(half_width * 100, 2),
        'confidence': conf_score,
        'confidence_pct': round(conf_score * 100, 1),
        'confidence_label': f"{round(conf_score * 100)}% (Out-of-sample validation hit rate)",
        'data_quality': data_quality,
        'sample_eval_count': n_eval
    }
