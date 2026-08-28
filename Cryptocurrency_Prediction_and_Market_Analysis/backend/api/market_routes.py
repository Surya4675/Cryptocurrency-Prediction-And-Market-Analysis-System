import requests
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request
from ..models.db_models import db, Cryptocurrency, MarketPrice
from ..app import cache
from ..config import Config

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
    
    # Track user demand using SQLAlchemy ORM instead of raw sqlite3
    try:
        coin = Cryptocurrency.query.filter_by(coin_id=coin_id).first()
        if coin:
            coin.last_requested_at = datetime.now(timezone.utc).isoformat()
            db.session.commit()
    except Exception as e:
        print(f"Failed to update demand for {coin_id}: {e}")
        db.session.rollback()
            
    # Fetch real-time high-granularity data directly from CoinGecko for the chart
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": "usd", 
        "days": str(days)
    }
    
    # Safely attach API key if it exists
    if Config.COINGECKO_API_KEY and Config.COINGECKO_API_KEY != "your_coingecko_api_key_here":
        params["x_cg_demo_api_key"] = Config.COINGECKO_API_KEY
        
    headers = {"accept": "application/json"}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        prices = data.get("prices", [])
        history = []
        
        for p in prices:
            dt = datetime.fromtimestamp(p[0] / 1000.0, tz=timezone.utc)
            history.append({
                'timestamp': dt.isoformat(),
                'price': p[1],
                'volume': 0,
                'market_cap': 0
            })
            
        # Append the absolute latest live data from our DB to ensure perfect UI sync
        latest_live = MarketPrice.query.filter_by(coin_id=coin_id).order_by(MarketPrice.timestamp.desc()).first()
        if latest_live and len(history) > 0:
            history.append({
                'timestamp': latest_live.timestamp.isoformat() if hasattr(latest_live.timestamp, 'isoformat') else str(latest_live.timestamp),
                'price': latest_live.price,
                'volume': latest_live.volume or 0,
                'market_cap': latest_live.market_cap or 0
            })
            
        return jsonify(history)
    except Exception as e:
        print(f"Error fetching real-time chart data: {e}")
        # Fallback to local database if API fails
        history = MarketPrice.query.filter_by(coin_id=coin_id).order_by(MarketPrice.timestamp.asc()).all()
        return jsonify([{
            'timestamp': h.timestamp.isoformat() if hasattr(h.timestamp, 'isoformat') else str(h.timestamp),
            'price': h.price,
            'volume': h.volume,
            'market_cap': h.market_cap
        } for h in history])

@bp.route('/summary', methods=['GET'])
def get_market_summary():
    coins = Cryptocurrency.query.limit(50).all()
    result = []
    
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    day_ago_iso = day_ago.isoformat()
    buffer_time = (day_ago - timedelta(hours=48)).isoformat()
    
    coin_ids = [c.coin_id for c in coins]
    
    # N+1 Query Fix: Fetch all relevant prices in a single query
    # We fetch prices for the last 3 days to guarantee we find a 24h old price
    all_prices = MarketPrice.query.filter(
        MarketPrice.coin_id.in_(coin_ids),
        MarketPrice.timestamp >= buffer_time
    ).order_by(MarketPrice.timestamp.asc()).all()
    
    prices_by_coin = {c_id: [] for c_id in coin_ids}
    for p in all_prices:
        prices_by_coin[p.coin_id].append(p)
        
    for c in coins:
        coin_prices = prices_by_coin[c.coin_id]
        
        if not coin_prices:
            # Fallback if no recent data, just try to get the absolute latest price (1 query per missing coin, rare)
            latest = MarketPrice.query.filter_by(coin_id=c.coin_id).order_by(MarketPrice.timestamp.desc()).first()
            if not latest:
                continue
            coin_prices = [latest]
            
        latest_price_obj = coin_prices[-1]
        
        past_price_obj = None
        # Traverse backwards to find the price closest to, but older than or equal to, 24h ago
        for p in reversed(coin_prices):
            # timestamp might be string or datetime
            p_ts = p.timestamp.isoformat() if hasattr(p.timestamp, 'isoformat') else str(p.timestamp)
            if p_ts <= day_ago_iso:
                past_price_obj = p
                break
                
        if not past_price_obj:
            past_price_obj = coin_prices[0] # Use oldest available if we don't have exactly 24h ago
            
        percent_change = 0.0
        if past_price_obj and past_price_obj.price > 0:
            percent_change = ((latest_price_obj.price - past_price_obj.price) / past_price_obj.price) * 100
            
        result.append({
            'id': c.id,
            'coin_id': c.coin_id,
            'symbol': c.symbol,
            'name': c.name,
            'image': f"https://ui-avatars.com/api/?name={c.symbol}&background=1e293b&color=fff&rounded=true&bold=true",
            'current_price': latest_price_obj.price,
            'price_change_percentage_24h': percent_change,
            'market_cap': latest_price_obj.market_cap or 0.0,
            'total_volume': latest_price_obj.volume or 0.0
        })
            
    return jsonify({"coins": result})
