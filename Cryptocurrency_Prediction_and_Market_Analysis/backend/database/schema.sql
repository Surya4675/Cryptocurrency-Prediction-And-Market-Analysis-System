-- Database Schema for Cryptocurrency Prediction and Market Analysis System

CREATE TABLE IF NOT EXISTS cryptocurrencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_requested_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    price REAL,
    volume REAL,
    market_cap REAL,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coin_id, timestamp),
    FOREIGN KEY(coin_id) REFERENCES cryptocurrencies(coin_id)
);

CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,
    coin_id TEXT,
    title TEXT,
    description TEXT,
    source TEXT,
    url TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(coin_id) REFERENCES cryptocurrencies(coin_id)
);

CREATE TABLE IF NOT EXISTS sentiment_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id INTEGER NOT NULL,
    label TEXT,
    positive_score REAL,
    neutral_score REAL,
    negative_score REAL,
    model_name TEXT,
    model_version TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(news_id) REFERENCES news_articles(id)
);

CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id TEXT NOT NULL,
    date DATE NOT NULL,
    sma_7 REAL,
    sma_14 REAL,
    sma_30 REAL,
    ema_7 REAL,
    ema_14 REAL,
    rsi_14 REAL,
    macd REAL,
    macd_signal REAL,
    volatility_7 REAL,
    volatility_30 REAL,
    return_1d REAL,
    log_return_1d REAL,
    bb_upper REAL,
    bb_lower REAL,
    bb_width REAL,
    atr_14 REAL,
    return_14d REAL,
    lag_1 REAL,
    lag_2 REAL,
    lag_3 REAL,
    lag_7 REAL,
    volume_change REAL,
    sentiment_score REAL,
    close_price REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coin_id, date),
    FOREIGN KEY(coin_id) REFERENCES cryptocurrencies(coin_id)
);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id TEXT NOT NULL,
    prediction_for_date DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_price REAL,
    predicted_price REAL,
    predicted_return REAL,
    confidence REAL,
    model_version TEXT,
    feature_version TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(coin_id) REFERENCES cryptocurrencies(coin_id)
);

CREATE TABLE IF NOT EXISTS prediction_explanations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER NOT NULL,
    feature_name TEXT NOT NULL,
    feature_value REAL,
    shap_value REAL,
    rank INTEGER,
    FOREIGN KEY(prediction_id) REFERENCES predictions(id)
);

CREATE TABLE IF NOT EXISTS model_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_version TEXT NOT NULL,
    training_start TIMESTAMP,
    training_end TIMESTAMP,
    validation_start TIMESTAMP,
    validation_end TIMESTAMP,
    test_start TIMESTAMP,
    test_end TIMESTAMP,
    mae REAL,
    rmse REAL,
    mape REAL,
    directional_accuracy REAL,
    parameters_json TEXT,
    feature_list_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(coin_id) REFERENCES cryptocurrencies(coin_id)
);
