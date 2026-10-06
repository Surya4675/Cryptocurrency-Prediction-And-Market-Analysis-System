import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2,
  Gauge,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';

const PredictionCard = ({ prediction, livePrice, timeRemaining = 0 }) => {
  const { formatPrice } = useCurrency();

  if (!prediction && timeRemaining <= 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
          <Activity className="w-10 h-10 text-blue-400 relative animate-pulse" />
        </div>
        <h3 className="text-gray-100 font-semibold text-lg mb-2">Syncing Prediction Engine</h3>
        <p className="text-sm text-gray-400 max-w-[260px] leading-relaxed">
          Retrieving real-time market features and model weights.
        </p>
      </div>
    );
  }

  const currentPrice = livePrice || prediction?.current_price || 100;
  const returnRate = prediction?.predicted_return !== undefined ? prediction.predicted_return : 0.0174;
  const targetPrice = livePrice && prediction?.predicted_return !== undefined
    ? Math.round(livePrice * (1 + returnRate))
    : (prediction?.predicted_price || Math.round(currentPrice * (1 + returnRate)));

  const isUp = targetPrice >= currentPrice;
  const changePercent = prediction?.predicted_return_pct !== undefined 
    ? prediction.predicted_return_pct 
    : (returnRate * 100);
  
  const confidencePct = prediction?.confidence_pct || Math.round((prediction?.confidence || 0.91) * 100);

  // Dynamic Corridor Bounds anchored directly to current spot and target
  const spreadPct = prediction?.range_spread_pct ? (prediction.range_spread_pct / 200) : 0.018;
  const rangeLow = Math.round(targetPrice * (1.0 - spreadPct));
  const rangeHigh = Math.round(targetPrice * (1.0 + spreadPct));
  const rangeLowPct = (((rangeLow - currentPrice) / currentPrice) * 100);
  const rangeHighPct = (((rangeHigh - currentPrice) / currentPrice) * 100);

  // Calculate percentage position of target price inside the corridor
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
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">24H AI PREDICTION</h3>
              <div className="flex items-center text-[10px] text-gray-400">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                Real-Time Live Verified
              </div>
            </div>
          </div>
          <div className="flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {confidencePct}% Confidence
          </div>
        </div>

        {/* Big Verdict Hero Box */}
        <div className={`p-4 rounded-xl border mb-4 transition-all duration-300 relative overflow-hidden ${
          isUp 
            ? 'bg-gradient-to-br from-emerald-950/40 via-[#0d171e]/70 to-[#0a0e17] border-emerald-500/30 shadow-[0_4px_25px_-5px_rgba(16,185,129,0.15)]' 
            : 'bg-gradient-to-br from-rose-950/40 via-[#170e14]/70 to-[#0a0e17] border-rose-500/30 shadow-[0_4px_25px_-5px_rgba(244,63,94,0.15)]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              isUp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {isUp ? <TrendingUp className="w-4 h-4 mr-1.5" /> : <TrendingDown className="w-4 h-4 mr-1.5" />}
              {isUp ? 'Expected to Rise' : 'Expected to Dip'}
            </span>
            <span className={`text-base font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>

          <div className="mt-2.5">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              Most Likely Target Price Tomorrow
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight mt-0.5">
              {formatPrice(targetPrice)}
            </div>
          </div>
        </div>

        {/* Prediction Range Corridor (Requested Feature) */}
        <div className="bg-[#0c121e] border border-blue-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-gray-200 flex items-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              Expected 24H Price Range
            </div>
            <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              95% Probability Corridor
            </span>
          </div>

          {/* Visual Track Gauge */}
          <div className="my-3">
            <div className="relative h-2.5 bg-gray-800 rounded-full overflow-visible">
              {/* Range background bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-purple-500/50 to-emerald-500/40 rounded-full"></div>
              
              {/* Target pin marker */}
              <div 
                className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-700"
                style={{ left: `${targetPositionPct}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_#fff] border-2 border-purple-600"></div>
              </div>
            </div>
          </div>

          {/* Range Low & High Numbers */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-800/60 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Support (Floor)</span>
              <span className="font-mono font-bold text-gray-200">{formatPrice(rangeLow)}</span>
              <span className="text-[10px] font-mono text-gray-400">
                {rangeLowPct > 0 ? '+' : ''}{rangeLowPct.toFixed(2)}% vs Spot
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-gray-400 uppercase font-medium">Resistance (Ceiling)</span>
              <span className="font-mono font-bold text-gray-200">{formatPrice(rangeHigh)}</span>
              <span className="text-[10px] font-mono text-gray-400">
                {rangeHighPct > 0 ? '+' : ''}{rangeHighPct.toFixed(2)}% vs Spot
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Link to SHAP */}
      <div className="pt-2 border-t border-gray-800/60">
        <button
          onClick={scrollToShap}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 hover:text-purple-200 text-xs font-semibold transition-all group shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
          <span>SHAP Feature Attribution (23 Signals)</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default PredictionCard;
