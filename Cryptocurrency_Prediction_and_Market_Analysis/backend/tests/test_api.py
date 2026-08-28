import pytest

def test_market_summary(client):
    """Test that the market summary endpoint returns a 200."""
    response = client.get('/api/market/summary')
    # Since DB is empty in memory, it should still return 200 with an empty list
    assert response.status_code == 200
    assert "coins" in response.json
