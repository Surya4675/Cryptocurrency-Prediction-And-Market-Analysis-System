from flask import Blueprint, jsonify, request
from ..models.db_models import db, Cryptocurrency, MarketPrice

bp = Blueprint('market', __name__)

@bp.route('/coins', methods=['GET'])
def get_coins():
    coins = Cryptocurrency.query.all()
    return jsonify([{
        'id': c.id,
        'coin_id': c.coin_id,
        'symbol': c.symbol,
        'name': c.name,
        'is_active': c.is_active
    } for c in coins])

@bp.route('/<coin_id>/history', methods=['GET'])
def get_market_history(coin_id):
    days = request.args.get('days', 30, type=int)
    # Simple query for now, typically we'd filter by timestamp > (now - days)
    history = MarketPrice.query.filter_by(coin_id=coin_id).order_by(MarketPrice.timestamp.asc()).all()
    
    return jsonify([{
        'timestamp': h.timestamp.isoformat(),
        'price': h.price,
        'volume': h.volume,
        'market_cap': h.market_cap
    } for h in history])
