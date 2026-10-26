import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_caching import Cache
from .config import Config
from .models.db_models import db

# Initialize cache
cache = Cache()

def create_app(config_class=Config):
    frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
    app = Flask(
        __name__,
        static_folder=os.path.join(frontend_dist, 'assets') if os.path.exists(os.path.join(frontend_dist, 'assets')) else None,
        static_url_path='/assets'
    )
    app.config.from_object(config_class)
    
    # Configure Cache
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 15
    cache.init_app(app)
    cache.app = app  # Fix for flask-caching factory pattern bug
    try:
        with app.app_context():
            cache.clear()
    except Exception:
        pass
    
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
    
    # Serve SPA Frontend in production if built
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Endpoint not found', 'status': 404}), 404
        if path != "" and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        if os.path.exists(os.path.join(frontend_dist, 'index.html')):
            return send_from_directory(frontend_dist, 'index.html')
        return jsonify({"message": "Cryptocurrency API is running", "status": "online"}), 200

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)

