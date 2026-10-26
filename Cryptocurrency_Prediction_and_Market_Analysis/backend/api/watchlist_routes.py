from flask import Blueprint, jsonify, request
from ..models.db_models import db, Watchlist

bp = Blueprint('watchlist', __name__)

@bp.route('/', methods=['GET'], strict_slashes=False)
def get_watchlist():
    items = Watchlist.query.all()
    return jsonify([{'coin_id': item.coin_id} for item in items])
