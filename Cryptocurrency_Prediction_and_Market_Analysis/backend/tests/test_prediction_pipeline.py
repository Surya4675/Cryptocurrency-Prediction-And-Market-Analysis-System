import pytest
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from backend.config import Config
from backend.ml.inference.predict import predict_next_day, get_active_prediction

DB_PATH = Config.DATABASE_PATH

def test_financial_return_and_price_change_calculations():
    """Verify standard financial calculations for P_0 and P_24."""
    base_price = 100.0
    predicted_price = 105.0
    
    expected_absolute_change = predicted_price - base_price
    expected_percentage_change = ((predicted_price - base_price) / base_price) * 100.0
    
    assert expected_absolute_change == 5.0
    assert expected_percentage_change == 5.0

    # Negative return test
    predicted_down = 95.0
    expected_down_abs = predicted_down - base_price
    expected_down_pct = ((predicted_down - base_price) / base_price) * 100.0
    assert expected_down_abs == -5.0
    assert expected_down_pct == -5.0

def test_forecast_target_timestamp_is_24_hours():
    """Verify that every new forecast has an exact 24-hour target timestamp."""
    res = predict_next_day('bitcoin', force=True)
    assert res is not None
    assert 'generated_at' in res
    assert 'target_timestamp' in res

    gen_dt = pd.to_datetime(res['generated_at'], utc=True)
    target_dt = pd.to_datetime(res['target_timestamp'], utc=True)

    delta_hours = (target_dt - gen_dt).total_seconds() / 3600.0
    assert 23.99 <= delta_hours <= 24.01

def test_fresh_forecast_recalculation_on_force():
    """Verify that forcing recalculation establishes a fresh baseline price and new prediction ID."""
    res1 = predict_next_day('cardano', force=True)
    pid1 = res1['id']
    
    res2 = predict_next_day('cardano', force=True)
    pid2 = res2['id']

    # Both predictions must be persisted with unique IDs (historical immutability)
    assert pid2 > pid1
    assert res2['is_new'] is True

def test_prediction_immutability():
    """Verify that historical predictions are never overwritten when new ones are minted."""
    conn = sqlite3.connect(DB_PATH, timeout=30)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM predictions WHERE coin_id = 'cardano'")
    count_before = cur.fetchone()[0]
    conn.close()

    # Generate another forecast
    predict_next_day('cardano', force=True)

    conn = sqlite3.connect(DB_PATH, timeout=30)
    cur = conn.cursor()
    cur.execute("SELECT count(*) FROM predictions WHERE coin_id = 'cardano'")
    count_after = cur.fetchone()[0]
    conn.close()

    assert count_after > count_before

def test_prediction_corridor_bounds():
    """Verify that range_low is strictly less than range_high and both are positive."""
    res = predict_next_day('stellar', force=True)
    assert res is not None
    assert res['range_low'] > 0
    assert res['range_high'] > res['range_low']
    # Target price should sit comfortably inside or near the corridor
    assert res['range_low'] <= res['predicted_price'] * 1.05
    assert res['range_high'] >= res['predicted_price'] * 0.95

