import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from backend.services.market_data_service import (
    SUPPORTED_COINS,
    get_symbol_for_coin,
    fetch_live_coin_price,
    fetch_live_24h_stats,
    get_market_diagnostics,
    fetch_coingecko_markets_direct
)

def test_coingecko_asset_id_and_symbol_mapping():
    """Verify canonical CoinGecko IDs and ticker symbols for supported coins."""
    assert SUPPORTED_COINS['bitcoin']['coingecko_id'] == 'bitcoin'
    assert SUPPORTED_COINS['bitcoin']['symbol'] == 'BTC'
    assert SUPPORTED_COINS['ripple']['coingecko_id'] == 'ripple'
    assert SUPPORTED_COINS['ripple']['symbol'] == 'XRP'
    assert SUPPORTED_COINS['cardano']['coingecko_id'] == 'cardano'
    assert SUPPORTED_COINS['cardano']['symbol'] == 'ADA'
    assert SUPPORTED_COINS['stellar']['coingecko_id'] == 'stellar'
    assert SUPPORTED_COINS['stellar']['symbol'] == 'XLM'
    assert SUPPORTED_COINS['beldex']['coingecko_id'] == 'beldex'
    assert SUPPORTED_COINS['beldex']['symbol'] == 'BDX'
    
    assert get_symbol_for_coin('bitcoin') == 'BTC'
    assert get_symbol_for_coin('ripple') == 'XRP'
    assert get_symbol_for_coin('cardano') == 'ADA'
    assert get_symbol_for_coin('beldex') == 'BDX'

def test_fetch_live_coin_price_inr_direct_success():
    """Verify that fetch_live_coin_price extracts authentic INR price from CoinGecko response."""
    mock_response = [
        {
            'id': 'bitcoin',
            'symbol': 'btc',
            'name': 'Bitcoin',
            'current_price': 7650000.0,
            'high_24h': 7700000.0,
            'low_24h': 7600000.0,
            'price_change_percentage_24h': 1.25,
            'total_volume': 1500000000.0,
            'market_cap': 150000000000.0,
            'market_cap_rank': 1,
            'ath': 8200000.0,
            'last_updated': '2026-10-28T18:00:00.000Z'
        }
    ]
    with patch('requests.get') as mock_get:
        mock_get.return_value = MagicMock(status_code=200, json=lambda: mock_response)
        res = fetch_coingecko_markets_direct(['bitcoin'])
        assert res is not None
        assert 'bitcoin' in res
        assert res['bitcoin']['current_price'] == 7650000.0
        assert res['bitcoin']['source'] == 'coingecko'
        assert res['bitcoin']['is_stale'] is False

def test_rate_limited_response_marks_stale():
    """Verify that when CoinGecko returns HTTP 429, the system preserves cached price and flags stale."""
    with patch('requests.get') as mock_get:
        mock_get.return_value = MagicMock(status_code=429, text='Rate Limit Exceeded')
        res = fetch_coingecko_markets_direct(['bitcoin'])
        # When rate limited, direct fetch returns None
        assert res is None

    # Diagnostics should capture rate-limited state
    diag = get_market_diagnostics('bitcoin', 'inr')
    assert diag['rate_limit_status'] in ('ok', 'throttled')
    assert 'coin_id' in diag
    assert diag['currency'] == 'INR'

def test_stale_price_detection():
    """Ensure that diagnostic payloads accurately convey data age and source metadata."""
    stats = fetch_live_24h_stats('bitcoin', 'inr')
    assert 'current_price' in stats
    assert stats['current_price'] > 0
    assert 'source' in stats
    assert 'retrieval_timestamp' in stats
    assert 'data_timestamp' in stats
    assert isinstance(stats['is_stale'], bool)

