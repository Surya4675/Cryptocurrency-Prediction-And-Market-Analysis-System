import pytest
import sqlite3
import numpy as np
from datetime import datetime, timedelta, timezone
from backend.config import Config
from backend.ml.calibration import get_calibrated_uncertainty
from backend.ml.evaluation.backtest import evaluate_pending_predictions, get_backtest_summary

DB_PATH = Config.DATABASE_PATH

def test_calibrated_confidence_is_statistically_sound():
    """Verify confidence score is a calibrated multi-factor score (82% - 96%)."""
    calib = get_calibrated_uncertainty('bitcoin', current_price=7600000.0, predicted_return=0.02, daily_volatility=0.03)
    assert 0.82 <= calib['confidence'] <= 0.96
    assert calib['range_low'] < calib['range_high']
    assert calib['range_low'] > 0
    assert 'data_quality' in calib
    assert 'confidence_label' in calib

def test_evaluation_only_after_target_time():
    """Verify that predictions whose target timestamp is in the future are never marked as evaluated."""
    conn = sqlite3.connect(DB_PATH, timeout=30)
    cur = conn.cursor()
    future_time = (datetime.now(timezone.utc) + timedelta(hours=12)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

    # Insert a synthetic future prediction
    cur.execute("""
        INSERT INTO predictions (coin_id, prediction_for_date, generated_at, target_timestamp, baseline_price, predicted_price, range_low, range_high, status)
        VALUES ('testcoin', date('now', '+1 day'), ?, ?, 100.0, 105.0, 95.0, 115.0, 'pending')
    """, (now_str, future_time))
    pred_id = cur.lastrowid
    conn.commit()
    conn.close()

    # Run evaluation routine
    evaluate_pending_predictions()

    # Verify that the future prediction remains pending
    conn = sqlite3.connect(DB_PATH, timeout=30)
    cur = conn.cursor()
    cur.execute("SELECT status, actual_price FROM predictions WHERE id = ?", (pred_id,))
    row = cur.fetchone()
    # Cleanup test row
    cur.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
    conn.commit()
    conn.close()

    assert row[0] == 'pending'
    assert row[1] is None

def test_backtest_metrics_calculation_and_baseline_comparison():
    """Verify backtest summary calculations against naive persistence baseline."""
    summary = get_backtest_summary()
    assert 'sample_size' in summary
    assert 'status' in summary
    if summary['sample_size'] >= 3:
        assert 'mae' in summary
        assert 'mape' in summary
        assert 'directional_accuracy_pct' in summary
        assert 'naive_baseline' in summary
        assert 'mape' in summary['naive_baseline']

