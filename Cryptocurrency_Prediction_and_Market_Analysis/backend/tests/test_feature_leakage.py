import pytest
import pandas as pd
import numpy as np
from backend.ml.features.build_features import generate_technical_features

def test_feature_engineering_no_future_leakage():
    """Verify that all engineered technical features only rely on past/present observations."""
    # Create deterministic sequential price time-series with 25 days
    prices = [
        100.0, 102.0, 101.0, 105.0, 107.0, 106.0, 110.0, 112.0, 111.0, 115.0,
        114.0, 118.0, 117.0, 120.0, 122.0, 121.0, 125.0, 124.0, 128.0, 130.0,
        129.0, 132.0, 131.0, 135.0, 134.0
    ]
    dates = pd.date_range(start='2026-01-01', periods=len(prices), freq='D')
    
    df = pd.DataFrame({
        'date': dates,
        'price': prices,
        'volume': [1000] * len(prices)
    })
    
    feats = generate_technical_features(df)
    
    # Test SMA-7 at row 6: must equal average of prices from row 0 to 6
    expected_sma7_at_6 = np.mean(prices[0:7])
    actual_sma7_at_6 = feats['sma_7'].iloc[6]
    assert np.isclose(expected_sma7_at_6, actual_sma7_at_6)

    # Test lag_1 at row 5: must equal price at row 4
    assert feats['lag_1'].iloc[5] == prices[4]

    # Test return_1d at row 3: (prices[3] - prices[2]) / prices[2]
    expected_ret = (prices[3] - prices[2]) / prices[2]
    assert np.isclose(feats['return_1d'].iloc[3], expected_ret)

    # Modifying future rows (e.g. row 24) must NOT change feature values at row 15
    df_perturbed = df.copy()
    df_perturbed.loc[24, 'price'] = 999.0
    feats_perturbed = generate_technical_features(df_perturbed)
    
    assert feats['sma_7'].iloc[15] == feats_perturbed['sma_7'].iloc[15]
    assert np.isclose(feats['rsi_14'].iloc[15], feats_perturbed['rsi_14'].iloc[15])
    assert feats['return_1d'].iloc[15] == feats_perturbed['return_1d'].iloc[15]
    assert feats['volatility_7'].iloc[15] == feats_perturbed['volatility_7'].iloc[15]
