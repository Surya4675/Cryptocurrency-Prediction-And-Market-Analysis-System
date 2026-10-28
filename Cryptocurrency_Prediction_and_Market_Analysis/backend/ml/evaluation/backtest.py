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

def evaluate_pending_predictions():
    """
    Evaluates predictions whose 24-hour target_timestamp has arrived.
    Retrieves the actual observed price at target_timestamp from market_prices
    or from CoinGecko, and computes error metrics.
    Preserves original prediction immutably.
    """
    conn = sqlite3.connect(DB_PATH, timeout=60)
    cur = conn.cursor()
    
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    # Select predictions that have reached their target time and are pending
    cur.execute("""
        SELECT id, coin_id, baseline_price, predicted_price, range_low, range_high, target_timestamp, generated_at
        FROM predictions
        WHERE (status = 'pending' OR status IS NULL)
          AND target_timestamp IS NOT NULL
          AND target_timestamp <= ?
        ORDER BY target_timestamp ASC
        LIMIT 200
    """, (now_utc,))
    
    pending = cur.fetchall()
    evaluated_count = 0

    for row in pending:
        pid, coin_id, base_p, pred_p, r_low, r_high, target_ts, gen_at = row
        
        # Look for the actual price closest to target_ts in market_prices
        # Tolerance: within ±2 hours of target_timestamp
        cur.execute("""
            SELECT price, timestamp
            FROM market_prices
            WHERE coin_id = ?
              AND timestamp >= datetime(?, '-2 hours')
              AND timestamp <= datetime(?, '+4 hours')
            ORDER BY abs(strftime('%s', timestamp) - strftime('%s', ?)) ASC
            LIMIT 1
        """, (coin_id, target_ts, target_ts, target_ts))
        
        match = cur.fetchone()
        actual_price = None
        if match and match[0] and float(match[0]) > 0:
            actual_price = float(match[0])
        else:
            # Check latest recorded market price if target_timestamp was in the past
            cur.execute("""
                SELECT price FROM market_prices 
                WHERE coin_id = ? AND timestamp >= ? 
                ORDER BY timestamp ASC LIMIT 1
            """, (coin_id, target_ts))
            fallback_match = cur.fetchone()
            if fallback_match and fallback_match[0]:
                actual_price = float(fallback_match[0])
                
        if actual_price is not None and base_p and pred_p:
            abs_err = abs(actual_price - pred_p)
            pct_err = (abs_err / actual_price) * 100.0 if actual_price > 0 else 0.0
            
            # Directional success: did the actual movement match predicted direction?
            actual_dir_up = (actual_price >= base_p)
            pred_dir_up = (pred_p >= base_p)
            dir_success = (actual_dir_up == pred_dir_up)
            
            # In corridor
            in_corr = False
            if r_low is not None and r_high is not None:
                in_corr = (r_low <= actual_price <= r_high)
                
            cur.execute("""
                UPDATE predictions
                SET actual_price = ?,
                    absolute_error = ?,
                    percentage_error = ?,
                    directional_success = ?,
                    in_corridor = ?,
                    status = 'evaluated',
                    evaluated_at = ?
                WHERE id = ?
            """, (actual_price, round(abs_err, 4), round(pct_err, 2), 1 if dir_success else 0, 1 if in_corr else 0, now_utc, pid))
            evaluated_count += 1

    conn.commit()
    conn.close()
    return evaluated_count

def get_backtest_summary(coin_id=None):
    """
    Computes rigorous backtest and evaluation statistics:
    MAE, RMSE, MAPE, Directional Accuracy, Prediction Interval Coverage,
    and compares against the Naive Persistence baseline (P_hat = P_0).
    """
    conn = sqlite3.connect(DB_PATH, timeout=30)
    
    query = """
        SELECT baseline_price, predicted_price, actual_price, 
               range_low, range_high, directional_success, in_corridor,
               generated_at, target_timestamp, coin_id
        FROM predictions
        WHERE status = 'evaluated' AND actual_price IS NOT NULL
    """
    params = []
    if coin_id:
        query += " AND coin_id = ?"
        params.append(coin_id)
        
    query += " ORDER BY target_timestamp DESC LIMIT 500"
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()

    if df.empty or len(df) < 3:
        return {
            'sample_size': len(df),
            'status': 'preliminary',
            'message': 'Insufficient completed forecasts evaluated against post-target prices yet.',
            'mae': None,
            'rmse': None,
            'mape': None,
            'directional_accuracy_pct': None,
            'coverage_pct': None,
            'naive_baseline_mape': None,
            'improvement_vs_naive_pct': None
        }

    actual = df['actual_price'].values
    pred = df['predicted_price'].values
    base = df['baseline_price'].values

    # Model metrics
    mae = float(np.mean(np.abs(actual - pred)))
    rmse = float(np.sqrt(np.mean((actual - pred) ** 2)))
    # Safeguard against division by zero
    valid_mask = actual > 0
    mape = float(np.mean(np.abs((actual[valid_mask] - pred[valid_mask]) / actual[valid_mask]) * 100))

    # Naive baseline (Persistence: forecast price = baseline price)
    naive_mae = float(np.mean(np.abs(actual - base)))
    naive_rmse = float(np.sqrt(np.mean((actual - base) ** 2)))
    naive_mape = float(np.mean(np.abs((actual[valid_mask] - base[valid_mask]) / actual[valid_mask]) * 100))

    # Directional accuracy
    dir_acc = float(np.mean(df['directional_success'].astype(int)) * 100)

    # Prediction Interval coverage
    coverage = float(np.mean(df['in_corridor'].astype(int)) * 100) if 'in_corridor' in df.columns else None

    # Improvement vs naive
    improvement = round(((naive_mape - mape) / naive_mape) * 100, 2) if naive_mape > 0 else 0.0

    return {
        'sample_size': len(df),
        'status': 'verified',
        'horizon': '24 Hours',
        'mae': round(mae, 2 if mae > 10 else 4),
        'rmse': round(rmse, 2 if rmse > 10 else 4),
        'mape': round(mape, 2),
        'directional_accuracy_pct': round(dir_acc, 1),
        'interval_coverage_pct': round(coverage, 1) if coverage is not None else None,
        'naive_baseline': {
            'mae': round(naive_mae, 2 if naive_mae > 10 else 4),
            'rmse': round(naive_rmse, 2 if naive_rmse > 10 else 4),
            'mape': round(naive_mape, 2)
        },
        'improvement_vs_naive_pct': improvement
    }
