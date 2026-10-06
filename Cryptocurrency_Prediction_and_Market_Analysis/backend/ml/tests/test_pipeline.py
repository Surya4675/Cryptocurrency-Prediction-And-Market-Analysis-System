import pytest

def test_pipeline_import():
    """Ensure the ML pipeline modules can be imported without syntax errors."""
    try:
        from backend.ml.features import build_features
        from backend.ml.training import train_xgboost
        from backend.ml.inference import predict
        assert True
    except ImportError as e:
        pytest.fail(f"Failed to import ML pipeline modules: {e}")
