from flask import Blueprint, jsonify
from ..models.db_models import Prediction

bp = Blueprint('prediction', __name__)

@bp.route('/<coin_id>', methods=['GET'])
def get_prediction(coin_id):
    # Track user demand
    import sqlite3
    from datetime import datetime
    try:
        conn = sqlite3.connect("backend/database/app.db", timeout=60)
        cursor = conn.cursor()
        cursor.execute("UPDATE cryptocurrencies SET last_requested_at = ? WHERE coin_id = ?", (datetime.utcnow().isoformat(), coin_id))
        conn.commit()
    except Exception as e:
        print(f"Failed to update demand for {coin_id}: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

    prediction = Prediction.query.filter_by(coin_id=coin_id).order_by(Prediction.generated_at.desc()).first()
    
    if not prediction:
        return jsonify({'error': 'Prediction not found'}), 404
        
    # Fetch SHAP explanations
    import sqlite3
    conn = sqlite3.connect("backend/database/app.db", timeout=60)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT feature_name, feature_value, shap_value, rank 
        FROM prediction_explanations 
        WHERE prediction_id = ? 
        ORDER BY rank ASC
    ''', (prediction.id,))
    explanations = [
        {"feature_name": row[0], "feature_value": row[1], "shap_value": row[2], "rank": row[3]} 
        for row in cursor.fetchall()
    ]
    conn.close()
        
    return jsonify({
        'coin_id': prediction.coin_id,
        'current_price': prediction.current_price,
        'predicted_price': prediction.predicted_price,
        'predicted_return': prediction.predicted_return,
        'confidence': prediction.confidence,
        'model_version': prediction.model_version,
        'generated_at': prediction.generated_at.isoformat() if prediction.generated_at else None,
        'explanations': explanations
    })
