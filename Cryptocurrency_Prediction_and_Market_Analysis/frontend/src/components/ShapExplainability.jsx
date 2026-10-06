import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ShieldCheck, 
  Info,
  Filter
} from 'lucide-react';

const LAYMAN_DICTIONARY = {
  atr_14: {
    friendly_name: 'Typical Daily Price Swing (ATR)',
    category: 'Volatility & Swings',
    description: 'Measures the normal size of daily price swings, helping you anticipate price fluctuations.'
  },
  'atr 14': {
    friendly_name: 'Typical Daily Price Swing (ATR)',
    category: 'Volatility & Swings',
    description: 'Measures the normal size of daily price swings, helping you anticipate price fluctuations.'
  },
  rsi_14: {
    friendly_name: 'Buyer vs Seller Strength (RSI 14)',
    category: 'Momentum',
    description: 'Measures whether buyers or sellers dominate. High values show heavy buying pressure; low values signal oversold bargains.'
  },
  sma_7: {
    friendly_name: '7-Day Price Trend',
    category: 'Short-Term Trend',
    description: 'Average price over the past week, showing immediate upward or downward momentum.'
  },
  sma_14: {
    friendly_name: '14-Day Baseline Trend',
    category: 'Medium-Term Trend',
    description: 'Two-week moving average that filters out daily noise to reveal steady market direction.'
  },
  sma_30: {
    friendly_name: '30-Day Institutional Support',
    category: 'Long-Term Trend',
    description: 'One-month average reflecting whether long-term investors are holding or selling.'
  },
  ema_7: {
    friendly_name: 'Fast Momentum Velocity',
    category: 'Momentum',
    description: 'Reacts quickly to recent price spikes, identifying rapid rallies or sudden dips.'
  },
  ema_14: {
    friendly_name: 'Smooth Trend Momentum',
    category: 'Momentum',
    description: 'Smooths volatility to confirm if an upward or downward move is sustainable.'
  },
  macd: {
    friendly_name: 'MACD Directional Wave',
    category: 'Momentum',
    description: 'Tracks the gap between short and long trends to detect breakout rallies.'
  },
  macd_signal: {
    friendly_name: 'Bullish Trend Trigger (MACD Signal)',
    category: 'Momentum',
    description: 'Key signal used by crypto traders to spot the exact moment an upward rally starts.'
  },
  volatility_7: {
    friendly_name: '7-Day Market Turbulence',
    category: 'Risk & Stability',
    description: 'Measures recent price swings; lower values mean stable, predictable price action.'
  },
  volatility_30: {
    friendly_name: '30-Day Price Stability',
    category: 'Risk & Stability',
    description: 'Measures price calm over the past month to ensure forecast reliability.'
  },
  sentiment_score: {
    friendly_name: 'News & Social Media Buzz (FinBERT AI)',
    category: 'Public Mood',
    description: 'Real-time analysis of crypto news headlines, rating sentiment as positive, neutral, or negative.'
  },
  return_1d: {
    friendly_name: '24-Hour Price Movement',
    category: 'Daily Return',
    description: 'Percentage change recorded over the last 24 hours.'
  },
  log_return_1d: {
    friendly_name: 'Compounded Daily Momentum',
    category: 'Daily Return',
    description: 'Continuous price momentum speed used to catch high-velocity market runs.'
  },
  bb_lower: {
    friendly_name: 'Price Safety Floor (Lower Band)',
    category: 'Price Bounds',
    description: 'A key technical floor where buyers historically step in to prevent further drops.'
  },
  bb_upper: {
    friendly_name: 'Price Ceiling Barrier (Upper Band)',
    category: 'Price Bounds',
    description: 'Upper price limit where traders often take profits, causing temporary resistance.'
  },
  bb_width: {
    friendly_name: 'Market Squeeze Indicator',
    category: 'Volatility',
    description: 'Narrow bands show the market is compressing right before an explosive move.'
  },
  return_14d: {
    friendly_name: '2-Week Overall Momentum',
    category: 'Medium-Term Trend',
    description: 'Tracks net gain or loss over the past 14 days to identify sustained market runs.'
  },
  volume_change: {
    friendly_name: 'Trading Volume Surge',
    category: 'Liquidity',
    description: 'Measures spikes in trading volume; higher volume validates price rallies.'
  },
  lag_1: {
    friendly_name: "Yesterday's Closing Price",
    category: 'Reference Benchmark',
    description: "Yesterday's final price acting as an immediate psychological pivot for today."
  },
  lag_2: {
    friendly_name: '2 Days Ago Price Anchor',
    category: 'Reference Benchmark',
    description: "Compares today's price against two days ago to check if the market is holding ground."
  },
  lag_3: {
    friendly_name: '3 Days Ago Price Anchor',
    category: 'Reference Benchmark',
    description: 'Mid-week price checkpoint indicating overall multi-day stability.'
  },
  lag_7: {
    friendly_name: "Last Week's Price Anchor",
    category: 'Reference Benchmark',
    description: 'Compares current price to exactly one week ago to measure weekly progress.'
  }
};

const ShapExplainability = ({ prediction, coinName = 'Cryptocurrency' }) => {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'bullish', 'bearish'
  const [searchQuery, setSearchQuery] = useState('');

  if (!prediction || !prediction.explanations || prediction.explanations.length === 0) {
    return null;
  }

  // Normalize explanations with layman dictionary
  const explanations = prediction.explanations.map(exp => {
    const key = (exp.feature_name || exp.friendly_name || '').toLowerCase().trim();
    const fallback = LAYMAN_DICTIONARY[key] || LAYMAN_DICTIONARY[key.replace(/\s+/g, '_')];
    if (fallback) {
      return {
        ...exp,
        friendly_name: fallback.friendly_name,
        category: fallback.category,
        description: (!exp.description || exp.description.toLowerCase().includes('technical indicator')) 
          ? fallback.description 
          : exp.description
      };
    }
    return exp;
  });

  const bullishCount = explanations.filter(e => e.impact === 'bullish').length;
  const bearishCount = explanations.filter(e => e.impact === 'bearish').length;
  const topFactor = explanations[0];

  const totalBullishWeight = explanations
    .filter(e => e.impact === 'bullish')
    .reduce((sum, e) => sum + (e.impact_weight_pct || 0), 0);
  const totalBearishWeight = explanations
    .filter(e => e.impact === 'bearish')
    .reduce((sum, e) => sum + (e.impact_weight_pct || 0), 0);
  const totalWeight = Math.max(1, totalBullishWeight + totalBearishWeight);
  const bullishPct = Math.round((totalBullishWeight / totalWeight) * 100);
  const bearishPct = 100 - bullishPct;

  const filteredExplanations = explanations.filter(exp => {
    if (activeFilter === 'bullish' && exp.impact !== 'bullish') return false;
    if (activeFilter === 'bearish' && exp.impact !== 'bearish') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (exp.friendly_name || '').toLowerCase().includes(q);
      const matchCat = (exp.category || '').toLowerCase().includes(q);
      const matchDesc = (exp.description || '').toLowerCase().includes(q);
      return matchName || matchCat || matchDesc;
    }
    return true;
  });

  return (
    <div id="shap-explainability-section" className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Why Did AI Predict This?
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  SHAP Explainability
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Transparent factor-by-factor breakdown explaining tomorrow's forecast for <span className="text-gray-200 capitalize font-medium">{coinName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <input
            type="text"
            placeholder="Search factors (e.g. RSI, Sentiment)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0a0e17] border border-gray-800 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 w-48 sm:w-56"
          />

          {/* Filter Tabs */}
          <div className="flex items-center bg-[#0a0e17] rounded-lg p-1 border border-gray-800 shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({explanations.length})
            </button>
            <button
              onClick={() => setActiveFilter('bullish')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center ${
                activeFilter === 'bullish' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Pushing Up ({bullishCount})
            </button>
            <button
              onClick={() => setActiveFilter('bearish')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center ${
                activeFilter === 'bearish' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-rose-400'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 mr-1" />
              Pulling Down ({bearishCount})
            </button>
          </div>
        </div>
      </div>

      {/* Tug of War Force Balance Meter */}
      <div className="bg-[#0a0e17] border border-gray-800/90 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center text-xs mb-2">
          <div className="flex items-center text-emerald-400 font-bold">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Bullish Upward Force: {bullishPct}%
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold">
            {bullishPct >= bearishPct ? `+${bullishPct - bearishPct}% Net Bullish` : `-${bearishPct - bullishPct}% Net Bearish`}
          </span>
          <div className="flex items-center text-rose-400 font-bold">
            Bearish Resistance: {bearishPct}%
            <TrendingDown className="w-4 h-4 ml-1.5" />
          </div>
        </div>
        <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
            style={{ width: `${bullishPct}%` }}
          ></div>
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-rose-600 transition-all duration-700 shadow-[0_0_12px_rgba(244,63,94,0.5)]" 
            style={{ width: `${bearishPct}%` }}
          ></div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-[#0a0e17] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Top Driver</div>
            <div className="text-sm font-bold text-white mt-0.5 truncate max-w-[170px]" title={topFactor?.friendly_name}>
              {topFactor?.friendly_name || 'Market Trend'}
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
            topFactor?.impact === 'bullish' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {topFactor?.impact === 'bullish' ? '+' : '-'}{topFactor?.impact_weight_pct || 0}%
          </span>
        </div>

        <div className="bg-[#0a0e17] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Bullish Signals</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {bullishCount} <span className="text-[11px] text-gray-400 font-normal">factors</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0a0e17] border border-gray-800/80 rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Bearish Signals</div>
            <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
              {bearishCount} <span className="text-[11px] text-gray-400 font-normal">factors</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Feature Explanations List - Compact Enterprise Rows */}
      <div className="space-y-2">
        {filteredExplanations.map((item, index) => {
          const isBull = item.impact === 'bullish';
          const weight = item.impact_weight_pct || 1;
          const barWidth = Math.min(100, Math.max(8, weight * 2.8));

          return (
            <div 
              key={index}
              className="bg-[#0a0e17]/80 hover:bg-[#0f1422] border border-gray-800/70 hover:border-gray-700/80 rounded-lg px-3.5 py-2.5 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              {/* Feature Identity */}
              <div className="flex items-center space-x-2.5 min-w-[240px]">
                <span className="w-5 h-5 rounded bg-gray-800/80 text-[10px] font-mono text-gray-400 flex items-center justify-center font-bold">
                  #{item.rank || index + 1}
                </span>
                <span className="text-xs font-semibold text-gray-100">
                  {item.friendly_name}
                </span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-400 border border-gray-700/60 font-medium">
                  {item.category}
                </span>
              </div>

              {/* Visual Contribution Bar */}
              <div className="flex-1 max-w-md hidden sm:block mx-4">
                <div className="w-full bg-gray-800/50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBull 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-gradient-to-r from-rose-500 to-pink-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  ></div>
                </div>
              </div>

              {/* Impact Metric */}
              <div className="flex items-center justify-end space-x-2 shrink-0">
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                  isBull 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {isBull ? '+' : '-'}{weight}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Minimal Footer */}
      <div className="mt-5 pt-3 border-t border-gray-800/70 flex justify-between items-center text-[11px] text-gray-400">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TreeSHAP Exact Feature Attribution Engine</span>
        </div>
        <span className="font-mono text-gray-400">23 Active Features</span>
      </div>
    </div>
  );
};

export default ShapExplainability;
