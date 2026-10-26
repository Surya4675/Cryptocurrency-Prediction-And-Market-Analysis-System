import React from 'react';
import { ExternalLink, Globe, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const NewsList = ({ news }) => {
  if (!news || news.length === 0) {
    return (
      <div className="text-slate-400 py-10 text-center font-medium bg-slate-900/40 rounded-xl border border-slate-800">
        No recent news articles found for this asset.
      </div>
    );
  }

  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 60 && diffMins >= 0) {
        return `${diffMins}m ago`;
      }
      if (diffHours < 24 && diffHours >= 0) {
        return `${diffHours}h ago`;
      }
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {news.slice(0, 9).map((item, index) => {
        const sentiment = item.sentiment;
        const label = sentiment?.label || 'neutral';
        const isBullish = label === 'positive';
        const isBearish = label === 'negative';
        
        let sentimentPct = 70;
        if (sentiment) {
          if (isBullish) sentimentPct = Math.round((sentiment.positive_score || 0.7) * 100);
          else if (isBearish) sentimentPct = Math.round((sentiment.negative_score || 0.7) * 100);
          else sentimentPct = Math.round((sentiment.neutral_score || 0.7) * 100);
        }

        return (
          <a 
            key={index} 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col justify-between bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 shadow-2xs"
          >
            <div>
              <div className="flex justify-between items-start mb-2.5">
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex items-center border border-blue-500/20">
                  <Globe className="w-3 h-3 mr-1" />
                  {item.source}
                </span>

                {/* Sentiment Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center border ${
                  isBullish 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : isBearish 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {isBullish && <TrendingUp className="w-2.5 h-2.5 mr-1" />}
                  {isBearish && <TrendingDown className="w-2.5 h-2.5 mr-1" />}
                  {!isBullish && !isBearish && <Minus className="w-2.5 h-2.5 mr-1" />}
                  {isBullish ? `Bullish ${sentimentPct}%` : isBearish ? `Bearish ${sentimentPct}%` : 'Neutral'}
                </span>
              </div>
              
              <h4 className="text-slate-200 font-semibold text-xs leading-snug line-clamp-2 mb-3 group-hover:text-blue-300 transition-colors">
                {item.title}
              </h4>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 mt-auto">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                <span>{formatDate(item.published_at)}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default NewsList;
