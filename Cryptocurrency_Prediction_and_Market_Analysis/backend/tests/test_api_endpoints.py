import pytest
from backend.app import create_app
from backend.config import Config

class LiveTestConfig(Config):
    TESTING = True

@pytest.fixture
def test_client():
    app = create_app(LiveTestConfig)
    with app.test_client() as client:
        yield client

def test_market_stats_endpoint(test_client):
    """Verify /api/market/<coin_id>/stats returns CoinGecko live market data."""
    response = test_client.get('/api/market/bitcoin/stats?currency=inr')
    assert response.status_code == 200
    data = response.json
    assert data['coin_id'] == 'bitcoin'
    assert 'current_price' in data
    assert data['current_price'] > 0
    assert 'source' in data
    assert 'is_stale' in data

def test_market_diagnostics_endpoint(test_client):
    """Verify /api/market/<coin_id>/diagnostics returns full telemetry."""
    response = test_client.get('/api/market/cardano/diagnostics?currency=inr')
    assert response.status_code == 200
    data = response.json
    assert data['coin_id'] == 'cardano'
    assert data['canonical_coingecko_id'] == 'cardano'
    assert 'source' in data
    assert 'data_age_seconds' in data
    assert 'rate_limit_status' in data

def test_prediction_endpoint_structure_and_consistency(test_client):
    """Verify /api/prediction/<coin_id> returns synchronized forecast metrics."""
    response = test_client.get('/api/prediction/bitcoin?currency=inr')
    assert response.status_code == 200
    data = response.json
    assert data['coin_id'] == 'bitcoin'
    assert 'base_price' in data
    assert 'predicted_price' in data
    assert 'range_low' in data
    assert 'range_high' in data
    assert data['range_low'] <= data['range_high']
    assert 'confidence' in data
    assert 0.40 <= data['confidence'] <= 0.75
    assert 'generated_at' in data
    assert 'target_timestamp' in data
    assert 'backtest_metrics' in data

def test_prediction_history_endpoint(test_client):
    """Verify /api/prediction/<coin_id>/history returns historical forecasts."""
    response = test_client.get('/api/prediction/bitcoin/history?currency=inr')
    assert response.status_code == 200
    data = response.json
    assert 'history' in data
    assert isinstance(data['history'], list)

def test_prediction_backtest_endpoint(test_client):
    """Verify /api/prediction/<coin_id>/backtest returns backtest metrics."""
    response = test_client.get('/api/prediction/bitcoin/backtest')
    assert response.status_code == 200
    data = response.json
    assert 'sample_size' in data
    assert 'status' in data

