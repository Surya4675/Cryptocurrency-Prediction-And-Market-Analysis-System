import React from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const SentimentCard = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
        <MessageCircle className="w-8 h-8 text-gray-500 mb-2" />
        <h3 className="text-gray-300 font-medium">No Sentiment Data</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Not enough news articles available to analyze sentiment.</p>
      </div>
    );
  }

  const { positive_score, neutral_score, negative_score, source_breakdown } = sentiment;
  
  // Calculate a continuous score between -1 and 1 based on positive vs negative
  const rawScore = (positive_score || 0) - (negative_score || 0);
  
  // Normalize rawScore (-1 to 1) to percentage (0 to 100)
  const scorePercent = Math.round(((rawScore + 1) / 2) * 100);
  
  let overall_sentiment = 'Neutral';
  if (scorePercent >= 60) overall_sentiment = 'Bullish';
  else if (scorePercent <= 40) overall_sentiment = 'Bearish';

  const getSentimentConfig = (type) => {
    switch(type) {
      case 'Bullish': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', icon: ThumbsUp };
      case 'Bearish': return { color: 'text-red-400', bg: 'bg-red-500/10', bar: 'bg-red-500', icon: ThumbsDown };
      default: return { color: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-500', icon: Minus };
    }
  };

  const config = getSentimentConfig(overall_sentiment);
  const Icon = config.icon;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-200 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2 text-teal-400" />
          Market Sentiment
        </h3>
        <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3 mr-1" />
          {overall_sentiment}
        </span>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Fear</span>
          <span className="text-gray-400">Greed</span>
        </div>
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden relative">
          {/* Gradient background for the gauge */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30"></div>
          {/* Indicator mark */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000 ease-out"
            style={{ left: `${scorePercent}%` }}
          ></div>
        </div>
        <div className="flex flex-col items-center mt-3">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold font-mono text-white tracking-tight">{scorePercent}</span>
            <span className="text-xs text-gray-500 ml-1 font-medium">/ 100</span>
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-medium bg-gray-900/50 px-2 py-0.5 rounded">
            0-40 Fear &bull; 40-60 Neutral &bull; 60-100 Greed
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 mt-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-400">News Sources Analyzed</h4>
        </div>
        <div className="overflow-y-auto pr-1 space-y-2 pb-2">
          {source_breakdown && Object.entries(source_breakdown).map(([source, data]) => {
            if (!data || data.count === 0) return null;
            const sConfig = getSentimentConfig(data.sentiment);
            return (
              <div key={source} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                <span className="text-sm text-gray-300 capitalize truncate pr-2 max-w-[120px] lg:max-w-[150px]" title={source}>{source}</span>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 ${sConfig.color}`}>
                    {data.sentiment}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{data.count} {data.count === 1 ? 'article' : 'articles'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SentimentCard;
