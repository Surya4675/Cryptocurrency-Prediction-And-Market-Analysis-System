import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Lightbulb } from 'lucide-react';

const PredictionCard = ({ prediction, livePrice }) => {
  const { formatPrice } = useCurrency();

  if (!prediction) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-4">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
          <Activity className="w-10 h-10 text-blue-400 relative animate-pulse" />
        </div>
        <h3 className="text-gray-100 font-medium text-lg mb-2">Training in Progress</h3>
        <p className="text-sm text-gray-400 max-w-[250px] leading-relaxed">
          We've added this coin to our priority queue. Please check back during the next 5-minute update cycle for AI insights.
        </p>
      </div>
    );
  }

  const targetPrice = prediction.predicted_price || 0;
  const currentPrice = livePrice || prediction.current_price;
  const isUp = targetPrice > currentPrice;
  const changePercent = currentPrice ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
  const confidence = prediction.confidence || 0.85; // Default if backend doesn't provide it yet
  
  // Format SHAP explanations feature names
  const formatFeatureName = (name) => {
    const map = {
      'sma_7': '7-Day Trend',
      'sma_14': '14-Day Trend',
      'sma_30': '30-Day Trend',
      'ema_7': 'Short Momentum',
      'ema_14': 'Mid Momentum',
      'rsi_14': 'RSI (Momentum)',
      'macd': 'MACD',
      'volatility_7': 'Recent Volatility',
      'volatility_30': 'Macro Volatility',
      'return_1d': 'Yesterday Return',
      'sentiment_score': 'Market Sentiment'
    };
    return map[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-200 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-purple-400" />
          24h AI Forecast
        </h3>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          confidence > 0.7 ? 'bg-green-500/10 text-green-400' : 
          confidence > 0.4 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {Math.round(confidence * 100)}% Confidence
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-2">
        <div className="text-sm text-gray-400 mb-1">Target Price</div>
        <div className="text-4xl font-bold font-mono tracking-tight text-white mb-2">
          {formatPrice(targetPrice)}
        </div>
        <div className={`flex items-center text-lg font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </div>
      </div>

      {prediction.explanations && prediction.explanations.length > 0 && (
        <div className="mt-2 mb-2 bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center text-sm font-medium text-blue-400 mb-2">
            <Lightbulb className="w-4 h-4 mr-1.5" />
            AI Insights
          </div>
          <ul className="space-y-1.5">
            {prediction.explanations.slice(0, 2).map((exp, idx) => {
              const impact = exp.shap_value > 0 ? 'bullish' : 'bearish';
              return (
                <li key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate pr-2">{formatFeatureName(exp.feature_name)}</span>
                  <span className={`px-1.5 py-0.5 rounded ${impact === 'bullish' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {impact === 'bullish' ? 'Pushing Up' : 'Pushing Down'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-gray-800/50 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Current Price</span>
          <span className="font-mono text-gray-200">{formatPrice(currentPrice)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Expected Change</span>
          <span className={`font-mono ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{formatPrice(targetPrice - currentPrice)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
