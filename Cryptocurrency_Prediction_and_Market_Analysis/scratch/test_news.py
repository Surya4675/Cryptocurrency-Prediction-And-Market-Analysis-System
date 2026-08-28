import sys
import os
sys.path.append(os.path.abspath('.'))
from backend.data.update_pipeline import fetch_news_api
print(fetch_news_api("binancecoin", "BNB"))
