import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

const CustomTooltip = ({ active, payload, formatPrice }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const isPrediction = dataPoint.isPrediction;

    if (isPrediction) {
      return (
        <div className="bg-[#0b101b] p-3 shadow-2xl border border-purple-500/40 rounded-lg min-w-[220px]">
          <div className="flex justify-between items-center text-xs font-semibold text-purple-300 mb-2">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-400 mr-1.5 animate-pulse"></span>
              24H ML Forecast
            </span>
            <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
              Tomorrow
            </span>
          </div>
          <div className="flex items-center justify-between text-white font-mono font-bold text-sm mb-1.5">
            <span className="text-gray-400 font-sans text-xs">Target</span>
            <span className="text-purple-300">{formatPrice(dataPoint.predictedPrice)}</span>
          </div>
          {dataPoint.rangeLow && dataPoint.rangeHigh && (
            <div className="pt-1.5 border-t border-gray-800 text-[11px] text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Corridor:</span>
                <span className="font-mono text-gray-200">
                  {formatPrice(dataPoint.rangeLow)} – {formatPrice(dataPoint.rangeHigh)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {dataPoint.confidencePct || 91}%
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    let dateObj;
    try {
      dateObj = new Date(dataPoint.timestamp);
      if (isNaN(dateObj.getTime())) dateObj = new Date();
    } catch {
      dateObj = new Date();
    }
    
    const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const val = payload[0].value;

    return (
      <div className="bg-[#0b101b] p-3 shadow-xl border border-gray-800 rounded-lg min-w-[200px]">
        <div className="flex justify-between items-center text-gray-400 text-[11px] font-mono mb-2 pb-1 border-b border-gray-800">
          <span>{dateStr}</span>
          <span className="text-gray-300 font-semibold">{timeStr}</span>
        </div>
        <div className="flex items-center justify-between text-white font-mono font-bold text-sm">
          <span className="text-gray-400 text-xs font-sans font-normal">Live Price</span>
          <span className="text-emerald-400">{formatPrice(val)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data, prediction, priceChange24h }) => {
  const { formatPrice, formatCompactPrice } = useCurrency();

  const sortedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .filter(item => item && item.timestamp && !isNaN(new Date(item.timestamp).getTime()))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data]);

  if (sortedData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton-loader w-full h-full opacity-40"></div>
      </div>
    );
  }

  // Calculate actual time span in days to pick the perfect X-axis label format
  const firstTime = new Date(sortedData[0].timestamp).getTime();
  const lastTime = new Date(sortedData[sortedData.length - 1].timestamp).getTime();
  const spanDays = Math.max(0.1, (lastTime - firstTime) / (1000 * 3600 * 24));

  const formattedData = sortedData.map(item => {
    const date = new Date(item.timestamp);
    let displayDate = '';

    if (spanDays <= 1.5) {
      // 24H: Clean hour with AM/PM (e.g. 12:00 AM, 4:00 AM, 8:00 AM)
      displayDate = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (spanDays <= 8) {
      // 7D: Weekday and Day of month (e.g. Mon 29, Tue 30)
      displayDate = `${date.toLocaleDateString([], { weekday: 'short' })} ${date.getDate()}`;
    } else if (spanDays <= 45) {
      // 1M (30 days): Month and day (e.g. Sep 15, Oct 1)
      displayDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else if (spanDays <= 120) {
      // 3M (90 days): Month and day (e.g. Jul 15, Aug 1)
      displayDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      // 1Y+ (365 days): Month and Year (e.g. Nov '25, Jan '26, Mar '26)
      displayDate = date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }

    return {
      ...item,
      displayDate,
      actualPrice: item.price
    };
  });

  const lastActualIndex = formattedData.length - 1;
  const firstPrice = formattedData[0]?.actualPrice || 0;
  const lastPrice = formattedData[lastActualIndex]?.actualPrice || 0;
  
  // Clean trend determination: if priceChange24h is provided, respect official 24h market move
  const isUptrend = priceChange24h !== undefined && priceChange24h !== null
    ? priceChange24h >= 0
    : lastPrice >= firstPrice;
  const trendColor = isUptrend ? '#10b981' : '#f43f5e';
  const targetPrice = prediction?.predicted_price;

  // Calculate clean Y-axis domain with natural breathing corridor (prevents optical illusion of wild drops)
  const yDomain = React.useMemo(() => {
    const prices = formattedData.map(d => d.actualPrice).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
    if (targetPrice && typeof targetPrice === 'number' && !isNaN(targetPrice) && targetPrice > 0) {
      prices.push(targetPrice);
    }
    if (prices.length === 0) return ['auto', 'auto'];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const delta = max - min;
    // Provide 25% padding or 1.2% minimum floor/ceiling buffer
    const pad = Math.max(delta * 0.25, min * 0.012);
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [formattedData, targetPrice]);

  return (
    <div className="w-full h-full flex flex-col pt-1">
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 12, right: 10, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="realtimeTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.18}/>
                <stop offset="100%" stopColor={trendColor} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#64748b" 
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
              minTickGap={45}
              dy={6}
            />
            <YAxis 
              domain={yDomain} 
              stroke="#64748b"
              tickFormatter={(val) => formatCompactPrice(val)}
              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}}
              axisLine={false}
              tickLine={false}
              width={65}
              orientation="right"
              dx={6}
            />
            <Tooltip 
              content={<CustomTooltip formatPrice={formatPrice} />} 
              cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '2 2' }} 
            />

            {/* Target Price Horizon Level */}
            {targetPrice && (
              <ReferenceLine 
                y={targetPrice} 
                stroke="#a855f7" 
                strokeDasharray="4 3" 
                strokeOpacity={0.6}
                label={{ 
                  value: 'Target', 
                  fill: '#c084fc', 
                  fontSize: 10, 
                  position: 'insideRight' 
                }} 
              />
            )}

            {/* Primary Real-Time Vector Curve */}
            <Area 
              type="monotone" 
              dataKey="actualPrice" 
              stroke={trendColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#realtimeTrendGradient)" 
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#0a0e17', fill: trendColor }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
