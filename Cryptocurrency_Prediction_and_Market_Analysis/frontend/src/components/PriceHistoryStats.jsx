import React, { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { marketApi } from '../api/client';
import { getCoinLogo, getFallbackCoinLogo } from '../utils/coinLogos';

const PriceHistoryStats = ({ 
  coinName = 'Bitcoin', 
  coinId, 
  timeRange, 
  setTimeRange,
  currentLivePrice,
  historyData = [],
  initialStats = null
}) => {
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(!initialStats);

  useEffect(() => {
    if (initialStats) {
      setStats(initialStats);
      setLoading(false);
    }
  }, [initialStats]);

  const fetchStats = async () => {
    if (!coinId) return;
    try {
      const response = await marketApi.getStats(coinId);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch coin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialStats) setLoading(true);
    fetchStats();
    // Poll stats every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [coinId]);

  const ranges = [
    { label: '24H', value: 1 },
    { label: '7D', value: 7 },
    { label: '1M', value: 30 },
    { label: '3M', value: 90 },
    { label: '1Y', value: 365 }
  ];

  const currentRangeLabel = ranges.find(r => r.value === timeRange)?.label || '24H';

  // Derive current price to show (prefer live from props, fallback to stats)
  const displayCurrentPrice = currentLivePrice || stats?.current_price;

  // Calculate dynamic stats from historyData if available
  const dynamicStats = useMemo(() => {
    if (!historyData || historyData.length === 0) return null;
    
    const prices = historyData.map(d => d.price).filter(p => typeof p === 'number' && !isNaN(p) && p > 0);
    if (prices.length === 0) return null;

    const high = Math.max(...prices);
    const low = Math.min(...prices);
    
    const firstPrice = prices[0];
    const lastPrice = displayCurrentPrice || prices[prices.length - 1];
    
    let changePercentage = 0;
    if (firstPrice && firstPrice > 0) {
      changePercentage = ((lastPrice - firstPrice) / firstPrice) * 100;
    }

    return { high, low, changePercentage };
  }, [historyData, displayCurrentPrice]);

  let displayHigh = dynamicStats?.high;
  let displayLow = dynamicStats?.low;

  if (stats?.high_24h) {
    if (timeRange === 1) {
      displayHigh = stats.high_24h;
    } else {
      displayHigh = Math.max(displayHigh || -Infinity, stats.high_24h);
    }
  }

  if (stats?.low_24h) {
    if (timeRange === 1) {
      displayLow = stats.low_24h;
    } else {
      displayLow = Math.min(displayLow || Infinity, stats.low_24h);
    }
  }

  const displayChange = useMemo(() => {
    if (timeRange === 1) {
      if (stats?.price_change_percentage_24h !== undefined && stats?.price_change_percentage_24h !== null) {
        if (Math.abs(stats.price_change_percentage_24h) >= 0.005) {
          return stats.price_change_percentage_24h;
        }
      }
      if (dynamicStats?.changePercentage !== undefined && Math.abs(dynamicStats.changePercentage) >= 0.005) {
        return dynamicStats.changePercentage;
      }
      return stats?.price_change_percentage_24h ?? dynamicStats?.changePercentage ?? 0;
    }
    return dynamicStats?.changePercentage ?? 0;
  }, [timeRange, stats, dynamicStats]);

  const logoSrc = getCoinLogo(stats?.symbol || coinId, coinId, stats?.image);

  return (
    <div className="flex flex-col mb-4">
      {/* Header with Title and Timeframe Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <img 
            src={logoSrc} 
            alt={coinName}
            className="w-7 h-7 rounded-full object-contain bg-slate-900 border border-slate-700/60 shadow-sm p-0.5"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getFallbackCoinLogo(coinId);
            }}
          />
          <h2 className="text-xl font-bold text-white capitalize tracking-tight">
            {coinName} Price Action
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            LIVE
          </span>
        </div>

        {/* Timeframe Controls */}
        <div className="flex bg-[#070b13] rounded-lg p-1 border border-gray-800">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === range.value 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 4 Spacious Clean Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3.5 bg-[#090d16] border border-gray-800/80 rounded-xl">
        {/* Spot Price */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
            Spot Price
          </span>
          <span className="text-xl font-extrabold font-mono text-white tracking-tight">
            {displayCurrentPrice ? formatPrice(displayCurrentPrice) : '—'}
          </span>
        </div>
        
        {/* Performance Return */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
            {currentRangeLabel} Return
          </span>
          <span className={`text-base font-extrabold font-mono flex items-center ${
            displayChange > 0 ? 'text-emerald-400' : displayChange < 0 ? 'text-rose-400' : 'text-gray-400'
          }`}>
            {displayChange !== undefined && displayChange !== null
              ? `${displayChange > 0 ? '+' : ''}${displayChange.toFixed(2)}%`
              : '—'}
          </span>
        </div>
        
        {/* Range High / Low */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
            {currentRangeLabel} High / Low
          </span>
          <div className="text-xs font-mono text-gray-300">
            <span className="text-emerald-400">{displayHigh ? formatPrice(displayHigh) : '—'}</span>
            <span className="text-gray-400 mx-1">/</span>
            <span className="text-rose-400">{displayLow ? formatPrice(displayLow) : '—'}</span>
          </div>
        </div>
        
        {/* All-Time High */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
            All-Time High (ATH)
          </span>
          <span className="text-sm font-mono font-semibold text-gray-300">
            {stats?.ath ? formatPrice(stats.ath) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceHistoryStats;
