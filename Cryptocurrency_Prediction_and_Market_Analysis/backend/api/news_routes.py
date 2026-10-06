from flask import Blueprint, jsonify
from ..services.news_service import get_live_news_for_coin

bp = Blueprint('news', __name__)

@bp.route('/<coin_id>', methods=['GET'])
def get_news(coin_id):
    articles = get_live_news_for_coin(coin_id, limit=12)
    return jsonify(articles)

