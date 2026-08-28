from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Cryptocurrency(db.Model):
    __tablename__ = 'cryptocurrencies'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    coin_id = db.Column(db.String, unique=True, nullable=False)
    symbol = db.Column(db.String, nullable=False)
    name = db.Column(db.String, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_requested_at = db.Column(db.DateTime)
    
    market_prices = db.relationship('MarketPrice', backref='cryptocurrency', lazy=True)
    news_articles = db.relationship('NewsArticle', backref='cryptocurrency', lazy=True)
    predictions = db.relationship('Prediction', backref='cryptocurrency', lazy=True)
    watchlist = db.relationship('Watchlist', backref='cryptocurrency', uselist=False)

class MarketPrice(db.Model):
    __tablename__ = 'market_prices'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    coin_id = db.Column(db.String, db.ForeignKey('cryptocurrencies.coin_id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    open = db.Column(db.Float)
    high = db.Column(db.Float)
    low = db.Column(db.Float)
    close = db.Column(db.Float)
    price = db.Column(db.Float)
    volume = db.Column(db.Float)
    market_cap = db.Column(db.Float)
    source = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('coin_id', 'timestamp', name='_coin_timestamp_uc'),)

class NewsArticle(db.Model):
    __tablename__ = 'news_articles'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    external_id = db.Column(db.String)
    coin_id = db.Column(db.String, db.ForeignKey('cryptocurrencies.coin_id'))
    title = db.Column(db.String)
    description = db.Column(db.String)
    source = db.Column(db.String)
    url = db.Column(db.String)
    published_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sentiment = db.relationship('SentimentResult', backref='news_article', uselist=False)

class SentimentResult(db.Model):
    __tablename__ = 'sentiment_results'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    news_id = db.Column(db.Integer, db.ForeignKey('news_articles.id'), nullable=False)
    label = db.Column(db.String)
    positive_score = db.Column(db.Float)
    neutral_score = db.Column(db.Float)
    negative_score = db.Column(db.Float)
    model_name = db.Column(db.String)
    model_version = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Feature(db.Model):
    __tablename__ = 'features'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    coin_id = db.Column(db.String, db.ForeignKey('cryptocurrencies.coin_id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    sma_7 = db.Column(db.Float)
    sma_14 = db.Column(db.Float)
    sma_30 = db.Column(db.Float)
    ema_7 = db.Column(db.Float)
    ema_14 = db.Column(db.Float)
    rsi_14 = db.Column(db.Float)
    macd = db.Column(db.Float)
    macd_signal = db.Column(db.Float)
    volatility_7 = db.Column(db.Float)
    volatility_30 = db.Column(db.Float)
    return_1d = db.Column(db.Float)
    lag_1 = db.Column(db.Float)
    lag_2 = db.Column(db.Float)
    lag_3 = db.Column(db.Float)
    lag_7 = db.Column(db.Float)
    volume_change = db.Column(db.Float)
    sentiment_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('coin_id', 'date', name='_coin_date_uc'),)

class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    coin_id = db.Column(db.String, db.ForeignKey('cryptocurrencies.coin_id'), nullable=False)
    prediction_for_date = db.Column(db.Date, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    current_price = db.Column(db.Float)
    predicted_price = db.Column(db.Float)
    predicted_return = db.Column(db.Float)
    model_version = db.Column(db.String)
    feature_version = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    explanations = db.relationship('PredictionExplanation', backref='prediction', lazy=True)

class PredictionExplanation(db.Model):
    __tablename__ = 'prediction_explanations'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    prediction_id = db.Column(db.Integer, db.ForeignKey('predictions.id'), nullable=False)
    feature_name = db.Column(db.String, nullable=False)
    feature_value = db.Column(db.Float)
    shap_value = db.Column(db.Float)
    rank = db.Column(db.Integer)

class ModelRun(db.Model):
    __tablename__ = 'model_runs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    model_version = db.Column(db.String, nullable=False)
    training_start = db.Column(db.DateTime)
    training_end = db.Column(db.DateTime)
    validation_start = db.Column(db.DateTime)
    validation_end = db.Column(db.DateTime)
    test_start = db.Column(db.DateTime)
    test_end = db.Column(db.DateTime)
    mae = db.Column(db.Float)
    rmse = db.Column(db.Float)
    mape = db.Column(db.Float)
    directional_accuracy = db.Column(db.Float)
    parameters_json = db.Column(db.Text)
    feature_list_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Watchlist(db.Model):
    __tablename__ = 'watchlist'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    coin_id = db.Column(db.String, db.ForeignKey('cryptocurrencies.coin_id'), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
