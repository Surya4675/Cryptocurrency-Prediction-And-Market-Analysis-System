from flask import Blueprint, jsonify
from ..models.db_models import NewsArticle

bp = Blueprint('news', __name__)

from ..app import cache

@bp.route('/<coin_id>', methods=['GET'])
def get_news(coin_id):
    articles = NewsArticle.query.filter_by(coin_id=coin_id).order_by(NewsArticle.published_at.desc()).limit(10).all()
    
    if not articles:
        return jsonify([])
        
    return jsonify([{
        'title': art.title,
        'description': art.description,
        'source': art.source,
        'published_at': art.published_at.isoformat() if art.published_at else None,
        'url': art.url
    } for art in articles])
