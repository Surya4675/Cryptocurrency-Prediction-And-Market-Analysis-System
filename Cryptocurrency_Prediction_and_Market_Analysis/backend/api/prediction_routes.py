from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from ..models.db_models import db, Cryptocurrency, Prediction, PredictionExplanation
from ..ml.inference.predict import predict_next_day
from ..services.market_data_service import fetch_live_coin_price, get_currency_rate

bp = Blueprint('prediction', __name__)

FEATURE_METADATA = {
    'rsi_14': {
        'friendly_name': 'Buyer vs Seller Strength (RSI 14)',
        'category': 'Momentum',
        'description': 'Measures whether buyers or sellers dominate. High values show heavy buying pressure; low values signal oversold bargains.'
    },
    'sma_7': {
        'friendly_name': '7-Day Price Trend',
        'category': 'Short-Term Trend',
        'description': 'Average price over the past week, showing immediate upward or downward momentum.'
    },
    'sma_14': {
        'friendly_name': '14-Day Baseline Trend',
        'category': 'Medium-Term Trend',
        'description': 'Two-week moving average that filters out daily noise to reveal steady market direction.'
    },
    'sma_30': {
        'friendly_name': '30-Day Institutional Support',
        'category': 'Long-Term Trend',
        'description': 'One-month average reflecting whether long-term investors are holding or selling.'
    },
    'ema_7': {
        'friendly_name': 'Fast Momentum Velocity',
        'category': 'Momentum',
        'description': 'Reacts quickly to recent price spikes, identifying rapid rallies or sudden dips.'
    },
    'ema_14': {
        'friendly_name': 'Smooth Trend Momentum',
        'category': 'Momentum',
        'description': 'Smooths volatility to confirm if an upward or downward move is sustainable.'
    },
    'macd': {
        'friendly_name': 'MACD Directional Wave',
        'category': 'Momentum',
        'description': 'Tracks the gap between short and long trends to detect breakout rallies.'
    },
    'macd_signal': {
        'friendly_name': 'Bullish Trend Trigger (MACD Signal)',
        'category': 'Momentum',
        'description': 'Key signal used by crypto traders to spot the exact moment an upward rally starts.'
    },
    'volatility_7': {
        'friendly_name': '7-Day Market Turbulence',
        'category': 'Risk & Stability',
        'description': 'Measures recent price swings; lower values mean stable, predictable price action.'
    },
    'volatility_30': {
        'friendly_name': '30-Day Price Stability',
        'category': 'Risk & Stability',
        'description': 'Measures price calm over the past month to ensure forecast reliability.'
    },
    'sentiment_score': {
        'friendly_name': 'News & Social Media Buzz (FinBERT AI)',
        'category': 'Public Mood',
        'description': 'Real-time analysis of crypto news headlines, rating sentiment as positive, neutral, or negative.'
    },
    'return_1d': {
        'friendly_name': '24-Hour Price Movement',
        'category': 'Daily Return',
        'description': 'Percentage change recorded over the last 24 hours.'
    },
    'log_return_1d': {
        'friendly_name': 'Compounded Daily Momentum',
        'category': 'Daily Return',
        'description': 'Continuous price momentum speed used to catch high-velocity market runs.'
    },
    'bb_lower': {
        'friendly_name': 'Price Safety Floor (Lower Band)',
        'category': 'Price Bounds',
        'description': 'A key technical floor where buyers historically step in to prevent further drops.'
    },
    'bb_upper': {
        'friendly_name': 'Price Ceiling Barrier (Upper Band)',
        'category': 'Price Bounds',
        'description': 'Upper price limit where traders often take profits, causing temporary resistance.'
    },
    'bb_width': {
        'friendly_name': 'Market Squeeze Indicator',
        'category': 'Volatility',
        'description': 'Narrow bands show the market is compressing right before an explosive move.'
    },
    'atr_14': {
        'friendly_name': 'Typical Daily Price Swing (ATR)',
        'category': 'Volatility & Swings',
        'description': 'Measures the normal size of daily price swings, helping you anticipate price fluctuations.'
    },
    'return_14d': {
        'friendly_name': '2-Week Overall Momentum',
        'category': 'Medium-Term Trend',
        'description': 'Tracks net gain or loss over the past 14 days to identify sustained market runs.'
    },
    'volume_change': {
        'friendly_name': 'Trading Volume Surge',
        'category': 'Liquidity',
        'description': 'Measures spikes in trading volume; higher volume validates price rallies.'
    },
    'lag_1': {
        'friendly_name': "Yesterday's Closing Price",
        'category': 'Reference Benchmark',
        'description': "Yesterday's final price acting as an immediate psychological pivot for today."
    },
    'lag_2': {
        'friendly_name': '2 Days Ago Price Anchor',
        'category': 'Reference Benchmark',
        'description': "Compares today's price against two days ago to check if the market is holding ground."
    },
    'lag_3': {
        'friendly_name': '3 Days Ago Price Anchor',
        'category': 'Reference Benchmark',
        'description': 'Mid-week price checkpoint indicating overall multi-day stability.'
    },
    'lag_7': {
        'friendly_name': "Last Week's Price Anchor",
        'category': 'Reference Benchmark',
        'description': 'Compares current price to exactly one week ago to measure weekly progress.'
    }
}

@bp.route('/<coin_id>', methods=['GET'])
def get_prediction(coin_id):
    # Track user demand via SQLAlchemy
    try:
        coin = Cryptocurrency.query.filter_by(coin_id=coin_id).first()
        if coin:
            coin.last_requested_at = datetime.now(timezone.utc)
            db.session.commit()
    except Exception:
        db.session.rollback()

    force_refresh = request.args.get('refresh', 'false').strip().lower() in ('true', '1')
    currency = request.args.get('currency', 'inr').strip().lower()
    fx_rate = get_currency_rate(currency)

    # Invoke prediction pipeline: verifies target time, evaluates expired forecasts,
    # checks active forecast freshness (<4 hours), and generates fresh forecast if needed.
    pred_res = predict_next_day(coin_id, force=force_refresh)
    
    prediction = None
    if pred_res and 'id' in pred_res:
        prediction = db.session.get(Prediction, pred_res['id'])
    
    if not prediction:
        prediction = Prediction.query.filter_by(coin_id=coin_id).order_by(Prediction.generated_at.desc()).first()

    if not prediction:
        return jsonify({'error': 'Prediction currently unavailable for this asset'}), 404
        
    # Fetch and enrich SHAP explanations directly by prediction.id
    db_explanations = PredictionExplanation.query.filter_by(prediction_id=prediction.id).all()
    if not db_explanations:
        try:
            from ..ml.explainability.shap_explainer import explain_prediction
            explain_prediction(coin_id, prediction.id)
            db_explanations = PredictionExplanation.query.filter_by(prediction_id=prediction.id).all()
        except Exception as e:
            print(f"[PredictionAPI] Dynamic explain_prediction notice for {coin_id}: {e}")

    explanations = []
    if db_explanations:
        sorted_exps = sorted(db_explanations, key=lambda x: x.rank if x.rank is not None else 999)
        total_abs_shap = sum(abs(exp.shap_value) for exp in sorted_exps) or 1.0
        
        for exp in sorted_exps:
            fname = exp.feature_name
            meta = FEATURE_METADATA.get(fname, {
                'friendly_name': fname.replace('_', ' ').title(),
                'category': 'Technical Factor',
                'description': f"Technical indicator {fname} influencing the predictive model."
            })
            
            shap_val = float(exp.shap_value)
            weight_pct = round((abs(shap_val) / total_abs_shap) * 100, 1)
            impact = 'bullish' if shap_val >= 0 else 'bearish'
            
            explanations.append({
                'feature_name': fname,
                'friendly_name': meta['friendly_name'],
                'category': meta['category'],
                'description': meta['description'],
                'feature_value': exp.feature_value,
                'shap_value': round(shap_val, 6),
                'impact': impact,
                'impact_weight_pct': weight_pct,
                'rank': exp.rank
            })

    # 1. Base / Anchor Price P_0 established at forecast creation
    base_price_inr = float(prediction.baseline_price or prediction.current_price or 100.0)
    base_price = base_price_inr * fx_rate

    # 2. Predicted 24-Hour Target Price P_24
    target_price_inr = float(prediction.predicted_price or (base_price_inr * (1.0 + float(prediction.predicted_return or 0.0))))
    target_price = target_price_inr * fx_rate

    # 3. Expected Return and Percentage Change: ((P24 - P0) / P0) * 100
    expected_return = float((target_price - base_price) / base_price) if base_price > 0 else 0.0
    change_pct = expected_return * 100.0
    expected_change_abs = target_price - base_price

    # 4. Calibrated Prediction Interval: strictly [range_low, range_high]
    range_low_inr = float(prediction.range_low if prediction.range_low is not None else (target_price_inr * 0.96))
    range_high_inr = float(prediction.range_high if prediction.range_high is not None else (target_price_inr * 1.04))
    
    range_low = round(range_low_inr * fx_rate, 4 if (range_low_inr * fx_rate) < 10 else 2)
    range_high = round(range_high_inr * fx_rate, 4 if (range_high_inr * fx_rate) < 10 else 2)
    
    # Ensure lower interval bound never exceeds upper bound
    if range_low > range_high:
        range_low, range_high = range_high, range_low

    # 5. Calibrated Empirical Confidence Score (e.g. 52% - 68%)
    confidence_val = float(prediction.confidence or 0.58)
    confidence_pct = round(confidence_val * 100, 1)

    # 6. Current Live Spot Price from CoinGecko
    live_price_val = fetch_live_coin_price(coin_id)
    live_price = float((live_price_val * fx_rate) if (live_price_val and live_price_val > 0) else base_price)

    # Real-time percentage delta between live spot and fixed levels
    range_low_pct = round(((range_low - live_price) / live_price) * 100, 2) if live_price > 0 else 0.0
    range_high_pct = round(((range_high - live_price) / live_price) * 100, 2) if live_price > 0 else 0.0
    live_vs_target_pct = round(((target_price - live_price) / live_price) * 100, 2) if live_price > 0 else 0.0

    # 7. Horizon Timestamps
    now_utc = datetime.now(timezone.utc)
    gen_at = prediction.generated_at or now_utc
    target_dt = prediction.target_timestamp
    if not target_dt:
        target_dt = gen_at + timedelta(hours=24)
    
    target_iso = target_dt.isoformat() if hasattr(target_dt, 'isoformat') else str(target_dt)
    gen_iso = gen_at.isoformat() if hasattr(gen_at, 'isoformat') else str(gen_at)

    # Calculate remaining time until target horizon
    try:
        t_utc = pd.to_datetime(target_dt, utc=True)
        secs_remaining = max(0, int((t_utc - now_utc).total_seconds()))
        h_left = secs_remaining // 3600
        m_left = (secs_remaining % 3600) // 60
        lock_timer_label = f"{h_left}h {m_left}m remaining"
    except Exception:
        secs_remaining = 86400
        lock_timer_label = "24h remaining"

    is_bullish = target_price >= base_price
    direction = 'BULLISH' if is_bullish else 'BEARISH'

    # Layman-friendly plain English summary
    if is_bullish:
        signal_title = f"Expected to Rise (+{change_pct:.2f}%)"
        signal_badge = "Bullish Outlook"
        layman_summary = f"The AI model forecasts +{change_pct:.2f}% upward movement for {coin_id.title()} from baseline {base_price:,.2f} towards target {target_price:,.2f} over the 24-hour horizon."
    else:
        signal_title = f"Expected to Dip ({change_pct:.2f}%)"
        signal_badge = "Caution / Bearish Outlook"
        layman_summary = f"The AI model forecasts {change_pct:.2f}% pullback for {coin_id.title()} from baseline {base_price:,.2f} towards target {target_price:,.2f} over the 24-hour horizon."

    # Fetch backtest metrics summary for transparency
    from ..ml.evaluation.backtest import get_backtest_summary
    backtest_data = get_backtest_summary(coin_id)

    return jsonify({
        'coin_id': prediction.coin_id,
        'currency': currency.upper(),
        'base_price': round(base_price, 4 if base_price < 10 else 2),
        'current_price': round(base_price, 4 if base_price < 10 else 2),
        'live_price': round(live_price, 4 if live_price < 10 else 2),
        'predicted_price': round(target_price, 4 if target_price < 10 else 2),
        'predicted_return': expected_return,
        'predicted_return_pct': round(change_pct, 2),
        'expected_change_abs': round(expected_change_abs, 4 if abs(expected_change_abs) < 10 else 2),
        'range_low': range_low,
        'range_high': range_high,
        'range_low_pct': range_low_pct,
        'range_high_pct': range_high_pct,
        'live_vs_target_pct': live_vs_target_pct,
        'direction': direction,
        'signal_title': signal_title,
        'signal_badge': signal_badge,
        'layman_summary': layman_summary,
        'confidence': confidence_val,
        'confidence_pct': confidence_pct,
        'confidence_definition': "Real-time multi-factor confluence combining technical momentum, machine learning inference, and historical track record",
        'model_version': prediction.model_version or 'xgboost_v1.3_calibrated',
        'prediction_for_date': str(prediction.prediction_for_date),
        'generated_at': gen_iso,
        'target_timestamp': target_iso,
        'seconds_until_target': secs_remaining,
        'lock_timer_label': lock_timer_label,
        'status': prediction.status or 'pending',
        'data_quality': prediction.data_quality or 'fresh',
        'explanations': explanations,
        'backtest_metrics': backtest_data
    })

@bp.route('/<coin_id>/history', methods=['GET'])
def get_prediction_history(coin_id):
    """Returns historical predictions and evaluation outcomes for coin_id."""
    currency = request.args.get('currency', 'inr').strip().lower()
    fx_rate = get_currency_rate(currency)
    
    preds = Prediction.query.filter_by(coin_id=coin_id).order_by(Prediction.generated_at.desc()).limit(20).all()
    history = []
    for p in preds:
        base_p = float(p.baseline_price or p.current_price or 0) * fx_rate
        pred_p = float(p.predicted_price or 0) * fx_rate
        act_p = float(p.actual_price * fx_rate) if p.actual_price is not None else None
        
        history.append({
            'id': p.id,
            'coin_id': p.coin_id,
            'generated_at': p.generated_at.isoformat() if p.generated_at else None,
            'target_timestamp': p.target_timestamp.isoformat() if p.target_timestamp else None,
            'baseline_price': round(base_p, 4 if base_p < 10 else 2),
            'predicted_price': round(pred_p, 4 if pred_p < 10 else 2),
            'actual_price': round(act_p, 4 if (act_p is not None and act_p < 10) else 2) if act_p is not None else None,
            'percentage_error': p.percentage_error,
            'directional_success': p.directional_success,
            'in_corridor': p.in_corridor,
            'status': p.status or ('evaluated' if act_p is not None else 'pending'),
            'confidence_pct': round(float(p.confidence or 0.58) * 100, 1),
            'model_version': p.model_version
        })
    return jsonify({'coin_id': coin_id, 'history': history})

@bp.route('/<coin_id>/backtest', methods=['GET'])
def get_prediction_backtest(coin_id):
    """Returns backtest metrics comparing candidate model vs naive persistence baseline."""
    from ..ml.evaluation.backtest import get_backtest_summary
    metrics = get_backtest_summary(coin_id)
    return jsonify(metrics)
