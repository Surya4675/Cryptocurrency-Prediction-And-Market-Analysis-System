from flask import Blueprint, jsonify
from ..models.db_models import db, NewsArticle, SentimentResult
from sqlalchemy.sql import func

bp = Blueprint('sentiment', __name__)

@bp.route('/<coin_id>', methods=['GET'])
def get_sentiment(coin_id):
    # Get average sentiment scores for the coin's news
    result = db.session.query(
        func.avg(SentimentResult.positive_score).label('avg_pos'),
        func.avg(SentimentResult.neutral_score).label('avg_neu'),
        func.avg(SentimentResult.negative_score).label('avg_neg')
    ).join(NewsArticle, SentimentResult.news_id == NewsArticle.id)\
     .filter(NewsArticle.coin_id == coin_id).first()
     
    if not result or result.avg_pos is None:
        return jsonify({'error': 'No sentiment data available'}), 404
        
    avg_pos, avg_neu, avg_neg = result.avg_pos, result.avg_neu, result.avg_neg
    
    # Determine overall label
    scores = {'positive': avg_pos, 'neutral': avg_neu, 'negative': avg_neg}
    overall_label = max(scores, key=scores.get)
    
    return jsonify({
        'coin_id': coin_id,
        'label': overall_label,
        'positive_score': float(avg_pos),
        'neutral_score': float(avg_neu),
        'negative_score': float(avg_neg)
    })
