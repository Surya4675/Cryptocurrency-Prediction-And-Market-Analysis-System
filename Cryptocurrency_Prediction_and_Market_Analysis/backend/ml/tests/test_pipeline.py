import pytest

def test_pipeline_import():
    """Ensure the ML pipeline modules can be imported without syntax errors."""
    try:
        from backend.ml.features import build_features
        from backend.ml.model import train_xgboost
        assert True
    except ImportError:
        pytest.fail("Failed to import ML pipeline modules.")
