import React from 'react';
import { MessageCircle, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const SentimentCard = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-4 py-8">
        <MessageCircle className="w-8 h-8 text-slate-500 mb-2" />
        <h3 className="text-slate-300 font-medium text-sm">No Sentiment Data</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
          Sentiment analysis and news scoring are not currently available for this asset.
        </p>
      </div>
    );
  }

  const { positive_score, negative_score, source_breakdown } = sentiment;
  
  // Calculate continuous score between -1 and 1
  const rawScore = (positive_score || 0) - (negative_score || 0);
  const scorePercent = Math.round(((rawScore + 1) / 2) * 100);
  
  let overall_sentiment = 'Neutral';
  if (scorePercent >= 60) overall_sentiment = 'Bullish';
  else if (scorePercent <= 40) overall_sentiment = 'Bearish';

  const getSentimentConfig = (type) => {
    switch(type) {
      case 'Bullish': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', icon: ThumbsUp };
      case 'Bearish': return { color: 'text-rose-400', bg: 'bg-rose-500/10', bar: 'bg-rose-500', icon: ThumbsDown };
      default: return { color: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-500', icon: Minus };
    }
  };

  const config = getSentimentConfig(overall_sentiment);
  const Icon = config.icon;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-blue-400" />
            Market Sentiment
          </h3>
          <span className={`px-2 py-0.5 text-xs rounded-full font-bold flex items-center border border-slate-700/60 ${config.bg} ${config.color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {overall_sentiment}
          </span>
        </div>

        {/* Fear & Greed Meter */}
        <div className="mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
            <span>Fear (0)</span>
            <span>Neutral (50)</span>
            <span>Greed (100)</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 opacity-60"></div>
            <div 
              className="absolute top-0 bottom-0 w-1.5 bg-white shadow-sm z-10 transition-all duration-700 ease-out"
              style={{ left: `${scorePercent}%` }}
            ></div>
          </div>
          <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium">FinBERT Mood Score</span>
            <div className="flex items-baseline">
              <span className="text-xl font-extrabold font-mono text-white">{scorePercent}</span>
              <span className="text-xs text-slate-500 ml-1">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* News Sources Analyzed */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sources Breakdown</h4>
        </div>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {source_breakdown && Object.entries(source_breakdown).map(([source, data]) => {
            if (!data || data.count === 0) return null;
            const sConfig = getSentimentConfig(data.sentiment);
            return (
              <div key={source} className="flex items-center justify-between bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-300 font-medium capitalize truncate max-w-[130px]" title={source}>{source}</span>
                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${sConfig.color}`}>
                    {data.sentiment}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{data.count} {data.count === 1 ? 'article' : 'articles'}</span>
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
