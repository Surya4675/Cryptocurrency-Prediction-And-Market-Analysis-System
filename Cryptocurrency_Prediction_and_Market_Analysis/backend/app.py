from flask import Flask, jsonify
from flask_cors import CORS
from flask_caching import Cache
from .config import Config
from .models.db_models import db

# Initialize cache
cache = Cache()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure Cache
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 60
    cache.init_app(app)
    cache.app = app  # Fix for flask-caching factory pattern bug
    
    CORS(app)
    db.init_app(app)
    
    # Import and register blueprints
    from .api.health_routes import bp as health_bp
    from .api.market_routes import bp as market_bp
    from .api.prediction_routes import bp as prediction_bp
    from .api.news_routes import bp as news_bp
    from .api.sentiment_routes import bp as sentiment_bp
    from .api.watchlist_routes import bp as watchlist_bp
    
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(market_bp, url_prefix='/api/market')
    app.register_blueprint(prediction_bp, url_prefix='/api/prediction')
    app.register_blueprint(news_bp, url_prefix='/api/news')
    app.register_blueprint(sentiment_bp, url_prefix='/api/sentiment')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')

    # Register error handlers
    from .utils.error_handlers import register_error_handlers
    register_error_handlers(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
