import React from 'react';

const SentimentCard = ({ sentiment }) => {
  if (!sentiment) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex items-center justify-center h-48 text-gray-500">
        Sentiment data unavailable
      </div>
    );
  }

  const getLabelColor = (label) => {
    switch(label.toLowerCase()) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getBarColor = (label) => {
    switch(label.toLowerCase()) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
      <h3 className="text-lg font-medium text-gray-400 mb-2">Market Sentiment</h3>
      
      <div className="mt-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-sm text-gray-500">Overall Mood</p>
            <p className={`text-2xl font-bold capitalize mt-1 ${getLabelColor(sentiment.label)}`}>
              {sentiment.label}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Positive</span>
              <span>{(sentiment.positive_score * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${sentiment.positive_score * 100}%`}}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Neutral</span>
              <span>{(sentiment.neutral_score * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${sentiment.neutral_score * 100}%`}}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Negative</span>
              <span>{(sentiment.negative_score * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{width: `${sentiment.negative_score * 100}%`}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentCard;
