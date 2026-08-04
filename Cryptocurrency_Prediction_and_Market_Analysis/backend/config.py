import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
    # Path to SQLite DB - adjust based on where the app runs
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_PATH = os.path.join(basedir, 'database', 'app.db')
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")
    NEWS_API_KEY = os.getenv("NEWS_API_KEY")
