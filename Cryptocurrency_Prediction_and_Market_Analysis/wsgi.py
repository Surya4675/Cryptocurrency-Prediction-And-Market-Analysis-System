import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sub_dir = os.path.join(BASE_DIR, "Cryptocurrency_Prediction_and_Market_Analysis")
if os.path.exists(sub_dir) and sub_dir not in sys.path:
    sys.path.insert(0, sub_dir)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

try:
    from backend.app import create_app
except ImportError:
    from Cryptocurrency_Prediction_and_Market_Analysis.backend.app import create_app

app = create_app()

if __name__ == '__main__':
    app.run()
