from flask import Blueprint, jsonify
from ..models.db_models import Prediction

bp = Blueprint('prediction', __name__)

@bp.route('/<coin_id>', methods=['GET'])
def get_prediction(coin_id):
    prediction = Prediction.query.filter_by(coin_id=coin_id).order_by(Prediction.generated_at.desc()).first()
    
    if not prediction:
        return jsonify({'error': 'Prediction not found'}), 404
        
    return jsonify({
        'coin_id': prediction.coin_id,
        'current_price': prediction.current_price,
        'predicted_price': prediction.predicted_price,
        'predicted_return': prediction.predicted_return,
        'model_version': prediction.model_version,
        'generated_at': prediction.generated_at.isoformat() if prediction.generated_at else None
    })
