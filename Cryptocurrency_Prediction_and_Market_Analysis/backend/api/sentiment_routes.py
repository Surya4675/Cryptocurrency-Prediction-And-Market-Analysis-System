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
    
    # Calculate source breakdown
    breakdown_results = db.session.query(
        NewsArticle.source,
        func.count(NewsArticle.id).label('count'),
        func.avg(SentimentResult.positive_score).label('avg_pos'),
        func.avg(SentimentResult.negative_score).label('avg_neg')
    ).join(SentimentResult, SentimentResult.news_id == NewsArticle.id)\
     .filter(NewsArticle.coin_id == coin_id)\
     .group_by(NewsArticle.source).all()
     
    source_breakdown = {}
    for r in breakdown_results:
        sentiment_label = 'Neutral'
        if r.avg_pos > r.avg_neg + 0.1: sentiment_label = 'Bullish'
        elif r.avg_neg > r.avg_pos + 0.1: sentiment_label = 'Bearish'
        
        # Fallback to "Unknown" if source is None
        source_name = r.source if r.source else 'Unknown'
        source_breakdown[source_name] = {
            'count': r.count,
            'sentiment': sentiment_label
        }
    
    # Determine overall label
    scores = {'positive': avg_pos, 'neutral': avg_neu, 'negative': avg_neg}
    overall_label = max(scores, key=scores.get)
    
    return jsonify({
        'coin_id': coin_id,
        'label': overall_label,
        'positive_score': float(avg_pos),
        'neutral_score': float(avg_neu),
        'negative_score': float(avg_neg),
        'source_breakdown': source_breakdown
    })
