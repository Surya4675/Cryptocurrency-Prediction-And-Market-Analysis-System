from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from ..models.db_models import db, Cryptocurrency
from ..app import cache
from ..services.market_data_service import (
    SUPPORTED_COINS,
    get_top_50_coins_summary,
    search_coins_summary,
    fetch_live_coin_price,
    fetch_live_24h_stats,
    fetch_chart_history,
    get_market_diagnostics
)

bp = Blueprint('market', __name__)

@bp.route('/coins', methods=['GET'])
@cache.cached(timeout=60)
def get_coins():
    # Return all 1,000 active cryptocurrencies for search/autocomplete
    POPULAR_ORDER = [
        'bitcoin', 'ethereum', 'solana', 'ripple', 'cardano', 'dogecoin', 
        'polkadot', 'chainlink', 'avalanche-2', 'litecoin', 'tether', 
        'binancecoin', 'usd-coin', 'tron', 'shiba-inu', 'uniswap', 'near',
        'sui', 'pepe', 'aptos', 'fetch-ai', 'render-token', 'bittensor'
    ]
    popular_map = {cid: idx for idx, cid in enumerate(POPULAR_ORDER)}
    
    coins = Cryptocurrency.query.filter_by(is_active=True).all()
    if coins:
        sorted_coins = sorted(
            coins,
            key=lambda c: (0 if c.coin_id in popular_map else 1, popular_map.get(c.coin_id, 9999), (c.name or '').lower())
        )
        return jsonify([{
            'id': c.id,
            'coin_id': c.coin_id,
            'symbol': c.symbol.upper() if c.symbol else '',
            'name': c.name,
            'is_active': c.is_active
        } for c in sorted_coins])

    top_50 = get_top_50_coins_summary()
    return jsonify([{
        'id': c['id'],
        'coin_id': c['coin_id'],
        'symbol': c['symbol'],
        'name': c['name'],
        'is_active': 1
    } for c in top_50])

@bp.route('/<coin_id>/history', methods=['GET'])
def get_market_history(coin_id):
    days = request.args.get('days', 30, type=int)
    currency = request.args.get('currency', 'inr').strip().lower()
    
    # Track user demand
    try:
        coin = Cryptocurrency.query.filter_by(coin_id=coin_id).first()
        if coin:
            coin.last_requested_at = datetime.now(timezone.utc)
            db.session.commit()
    except Exception:
        db.session.rollback()
        
    history = fetch_chart_history(coin_id, days, currency)
    return jsonify(history)

@bp.route('/summary', methods=['GET'])
def get_market_summary():
    search = request.args.get('search', '').strip().lower()
    limit = request.args.get('limit', 100, type=int)
    currency = request.args.get('currency', 'inr').strip().lower()
    
    if search:
        # Fast SQLite search across 1,000 coins
        results = search_coins_summary(search, limit=limit, currency=currency)
        return jsonify({"coins": results, "total_available": 1000, "query": search})
        
    # Default: Top cryptocurrencies with live stats
    top_coins = get_top_50_coins_summary(limit=limit, currency=currency)
    return jsonify({"coins": top_coins, "total_available": 1000})

@bp.route('/<coin_id>/stats', methods=['GET'])
def get_coin_stats(coin_id):
    currency = request.args.get('currency', 'inr').strip().lower()
    stats = fetch_live_24h_stats(coin_id, currency)
    return jsonify({
        "coin_id": stats.get('coin_id', coin_id),
        "symbol": stats.get('symbol', ''),
        "name": stats.get('name', ''),
        "image": stats.get('image', ''),
        "ath": stats.get('ath') or stats.get('current_price', 0),
        "high_24h": stats['high_24h'],
        "low_24h": stats['low_24h'],
        "price_change_percentage_24h": stats['price_change_percentage_24h'],
        "current_price": stats['current_price'],
        "total_volume": stats.get('total_volume', 0),
        "market_cap": stats.get('market_cap', 0),
        "source": stats.get('source', 'coingecko'),
        "is_stale": stats.get('is_stale', False),
        "retrieval_timestamp": stats.get('retrieval_timestamp'),
        "data_timestamp": stats.get('data_timestamp'),
        "data_age_seconds": stats.get('data_age_seconds', 0)
    })

@bp.route('/<coin_id>/diagnostics', methods=['GET'])
def get_coin_diagnostics(coin_id):
    currency = request.args.get('currency', 'inr').strip().lower()
    diag = get_market_diagnostics(coin_id, currency)
    return jsonify(diag)
