from flask import Blueprint, jsonify
from ..models.db_models import db
from sqlalchemy import text

bp = Blueprint('health', __name__)

@bp.route('/', methods=['GET'], strict_slashes=False)
def health_check():
    health_status = {
        'status': 'healthy',
        'database': 'unknown'
    }
    try:
        db.session.execute(text('SELECT 1'))
        health_status['database'] = 'connected'
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['database'] = f'error: {str(e)}'
        return jsonify(health_status), 503
        
    return jsonify(health_status), 200
