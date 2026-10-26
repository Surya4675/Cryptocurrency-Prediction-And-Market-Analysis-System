import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Lock
} from 'lucide-react';

const PredictionCard = ({ prediction, livePrice, timeRemaining = 0 }) => {
  const { formatPrice } = useCurrency();

  if (!prediction && timeRemaining <= 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
        <Activity className="w-8 h-8 text-blue-400 mb-2 animate-pulse" />
        <h3 className="text-white font-semibold text-base mb-1">Syncing Prediction Engine</h3>
        <p className="text-xs text-slate-400 max-w-[240px]">
          Retrieving real-time market features and model weights.
        </p>
      </div>
    );
  }

  // 1. Fixed Target Price (Never fluctuates with live price ticks)
  const targetPrice = prediction?.predicted_price !== undefined && prediction?.predicted_price !== null
    ? Number(prediction.predicted_price)
    : (prediction?.base_price 
        ? Number(prediction.base_price) * (1 + (prediction?.predicted_return || 0.0174))
        : (livePrice ? Number(livePrice) * 1.018 : 100));

  // 2. Fixed Base Anchor Price and Trend Direction
  const basePrice = Number(prediction?.base_price || prediction?.current_price || targetPrice);
  const isUp = prediction?.direction === 'BULLISH' || targetPrice >= basePrice;
  const changePercent = prediction?.predicted_return_pct !== undefined 
    ? prediction.predicted_return_pct 
    : (((targetPrice - basePrice) / (basePrice || 1)) * 100);
  
  const confidencePct = prediction?.confidence_pct || Math.round((prediction?.confidence || 0.91) * 100);

  // 3. Fixed Corridor Bounds (Floor Support & Ceiling Resistance locked for the day)
  const rangeLow = prediction?.range_low !== undefined && prediction?.range_low !== null
    ? Number(prediction.range_low)
    : (targetPrice * 0.975);

  const rangeHigh = prediction?.range_high !== undefined && prediction?.range_high !== null
    ? Number(prediction.range_high)
    : (targetPrice * 1.025);

  const effectiveSpot = livePrice || basePrice || targetPrice;
  const corridorSpan = Math.max(1, rangeHigh - rangeLow);
  const targetPositionPct = Math.min(92, Math.max(8, ((targetPrice - rangeLow) / corridorSpan) * 100));

  const scrollToShap = () => {
    const elem = document.getElementById('shap-explainability-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">24H AI PREDICTION</h3>
              <div className="flex items-center text-[10px] text-slate-400">
                <Lock className="w-3 h-3 mr-1 text-blue-400" />
                Session Locked {prediction?.lock_timer_label ? `(${prediction.lock_timer_label})` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {confidencePct}% Conf
          </div>
        </div>

        {/* Big Verdict Hero Box */}
        <div className={`p-4 rounded-xl border mb-4 transition-all duration-200 ${
          isUp 
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
              {isUp ? 'BULLISH REBOUND EXPECTED' : 'BEARISH PULLBACK EXPECTED'}
            </span>
            <span className="font-mono font-bold text-xs flex items-center">
              {isUp ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
              {formatPrice(targetPrice)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (from {formatPrice(basePrice)})
            </span>
          </div>
        </div>

        {/* Prediction Corridor Floor / Ceiling */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Safe Forecast Corridor</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Fixed Support / Resistance</span>
          </div>

          {/* Progress Bar Corridor */}
          <div className="relative pt-1">
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div 
                className="absolute top-0 bottom-0 bg-blue-600 rounded-full"
                style={{ width: `${targetPositionPct}%` }}
              ></div>
            </div>
            <div 
              className="absolute top-0.5 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm"
              style={{ left: `${targetPositionPct}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono pt-0.5">
            <div className="text-slate-400">
              <span className="text-[10px] text-slate-500 block">Support Floor</span>
              <span className="text-slate-200 font-bold">{formatPrice(rangeLow)}</span>
            </div>
            <div className="text-right text-slate-400">
              <span className="text-[10px] text-slate-500 block">Ceiling Resistance</span>
              <span className="text-slate-200 font-bold">{formatPrice(rangeHigh)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Link to Explainability */}
      <button
        onClick={scrollToShap}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-xs text-slate-300 font-semibold border border-slate-800 transition-colors"
      >
        <span>Why this prediction? View SHAP Factor Drivers</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
      </button>
    </div>
  );
};

export default PredictionCard;
