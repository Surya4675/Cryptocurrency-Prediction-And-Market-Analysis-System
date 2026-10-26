import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

const CustomTooltip = ({ active, payload, formatPrice, formatCompactPrice, timeZone, activeMetric }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const isPrediction = dataPoint.isPrediction;

    if (isPrediction) {
      return (
        <div className="bg-[#0b0f19] p-3 shadow-2xl border border-purple-500/50 rounded-xl min-w-[210px] backdrop-blur-md">
          <div className="flex justify-between items-center text-xs font-semibold text-purple-300 mb-2">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-400 mr-1.5 animate-pulse"></span>
              24H AI Prediction
            </span>
            <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
              Forecast
            </span>
          </div>
          <div className="flex items-center justify-between text-white font-mono font-bold text-sm mb-1.5">
            <span className="text-slate-400 font-sans text-xs">Target</span>
            <span className="text-purple-300">{formatPrice(dataPoint.predictedPrice)}</span>
          </div>
          {dataPoint.rangeLow && dataPoint.rangeHigh && (
            <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Safe Corridor:</span>
                <span className="font-mono text-slate-200">
                  {formatPrice(dataPoint.rangeLow)} – {formatPrice(dataPoint.rangeHigh)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {dataPoint.confidencePct || 94}%
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
    
    const tz = timeZone || 'Asia/Kolkata';
    const dateStr = dateObj.toLocaleDateString('en-US', { 
      timeZone: tz, 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', { 
      timeZone: tz, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
    
    const priceVal = dataPoint.actualPrice;
    const volVal = dataPoint.volume;
    const mcapVal = dataPoint.market_cap;

    return (
      <div className="bg-[#0b0f19] p-3 shadow-2xl border border-slate-700/80 rounded-xl min-w-[210px] backdrop-blur-md">
        {/* Full Date & Time in Local Timezone */}
        <div className="text-[11px] font-mono text-slate-400 pb-1.5 mb-2 border-b border-slate-800 flex justify-between items-center gap-2">
          <span>{dateStr}</span>
          <span className="text-slate-200 font-bold">{timeStr}</span>
        </div>

        {/* Price Row */}
        <div className="flex items-center justify-between text-sm font-mono mb-1">
          <span className="text-slate-400 text-xs font-sans">Price</span>
          <span className="text-white font-bold">{formatPrice(priceVal)}</span>
        </div>

        {/* 24h Volume Row (if available) */}
        {volVal > 0 && (
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-400 text-[11px] font-sans">24h Volume</span>
            <span className="text-slate-300 font-medium">{formatCompactPrice(volVal)}</span>
          </div>
        )}

        {/* Market Cap Row (if available) */}
        {mcapVal > 0 && (
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 text-[11px] font-sans">Market Cap</span>
            <span className="text-slate-300 font-medium">{formatCompactPrice(mcapVal)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data = [], prediction, priceChange24h }) => {
  const { formatPrice, formatCompactPrice, timeZone, timeZoneLabel, regionName, flag } = useCurrency();
  const tz = timeZone || 'Asia/Kolkata';
  const [activeMetric, setActiveMetric] = useState('price'); // 'price' | 'market_cap'

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .filter(item => item && item.timestamp && !isNaN(new Date(item.timestamp).getTime()))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data]);

  const firstTime = sortedData.length > 0 ? new Date(sortedData[0].timestamp).getTime() : Date.now();
  const lastTime = sortedData.length > 0 ? new Date(sortedData[sortedData.length - 1].timestamp).getTime() : Date.now();
  const spanDays = Math.max(0.1, (lastTime - firstTime) / (1000 * 3600 * 24));

  const formattedData = useMemo(() => {
    return sortedData.map(item => {
      const date = new Date(item.timestamp);
      let displayDate = '';

      if (spanDays <= 1.5) {
        // 24H: 08:00 PM, 12:00 AM, etc.
        displayDate = date.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
      } else if (spanDays <= 8) {
        // 7D: Oct 22 8 PM or Thu 22
        const month = date.toLocaleDateString('en-US', { timeZone: tz, month: 'short' });
        const day = date.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
        displayDate = `${month} ${day}`;
      } else if (spanDays <= 45) {
        // 1M: Oct 15, Oct 22
        displayDate = date.toLocaleDateString('en-US', { timeZone: tz, month: 'short', day: 'numeric' });
      } else if (spanDays <= 120) {
        // 3M: Aug 15, Sep 01
        displayDate = date.toLocaleDateString('en-US', { timeZone: tz, month: 'short', day: 'numeric' });
      } else {
        // 1Y: Nov 25, Jan 26
        displayDate = date.toLocaleDateString('en-US', { timeZone: tz, month: 'short', year: '2-digit' });
      }

      return {
        ...item,
        displayDate,
        actualPrice: item.price,
        actualMarketCap: item.market_cap || (item.price * 10000000)
      };
    });
  }, [sortedData, spanDays, tz]);

  if (formattedData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="skeleton-loader w-full h-full opacity-40"></div>
      </div>
    );
  }

  const firstPoint = formattedData[0];
  const lastPoint = formattedData[formattedData.length - 1];

  const firstVal = activeMetric === 'market_cap' ? (firstPoint?.actualMarketCap || 0) : (firstPoint?.actualPrice || 0);
  const lastVal = activeMetric === 'market_cap' ? (lastPoint?.actualMarketCap || 0) : (lastPoint?.actualPrice || 0);

  const isUptrend = priceChange24h !== undefined && priceChange24h !== null
    ? priceChange24h >= 0
    : lastVal >= firstVal;

  // Authentic CoinGecko Brand Colors: Emerald #16C784 / Ruby #EA3943
  const trendColor = isUptrend ? '#16C784' : '#EA3943';
  const targetPrice = prediction?.predicted_price;

  // Calculate clean Y-axis domain
  const plotValues = formattedData
    .map(d => activeMetric === 'market_cap' ? d.actualMarketCap : d.actualPrice)
    .filter(v => typeof v === 'number' && !isNaN(v) && v > 0);

  if (activeMetric === 'price' && targetPrice && typeof targetPrice === 'number' && !isNaN(targetPrice) && targetPrice > 0) {
    plotValues.push(targetPrice);
  }

  let yDomain = ['auto', 'auto'];
  if (plotValues.length > 0) {
    const min = Math.min(...plotValues);
    const max = Math.max(...plotValues);
    const delta = max - min;
    const pad = Math.max(delta * 0.12, min * 0.015);
    const lower = Math.max(0, min - pad);
    const upper = max + pad;
    yDomain = [lower, upper];
  }

  return (
    <div className="w-full h-full flex flex-col pt-1">
      {/* CoinGecko Chart Subheader Bar */}
      <div className="flex flex-wrap justify-between items-center px-1 pb-2 text-[11px] text-slate-400 gap-2 border-b border-slate-800/80 mb-2">
        {/* Metric Switcher (Price | Market Cap) */}
        <div className="flex items-center bg-[#070b13] rounded-lg p-0.5 border border-slate-800">
          <button
            onClick={() => setActiveMetric('price')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
              activeMetric === 'price' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setActiveMetric('market_cap')}
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
              activeMetric === 'market_cap' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Market Cap
          </button>
        </div>

        {/* Timezone Badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>{flag} {regionName}</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">{timeZoneLabel}</span>
          </span>
        </div>
      </div>

      {/* Main Chart Graphic */}
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceTrendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.16}/>
                <stop offset="100%" stopColor={trendColor} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} opacity={0.6} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#64748B" 
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
              axisLine={{ stroke: '#1F2937' }}
              tickLine={false}
              minTickGap={40}
              dy={6}
            />
            <YAxis 
              domain={yDomain} 
              stroke="#64748B"
              tickFormatter={(val) => formatCompactPrice(val)}
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={65}
              orientation="right"
              dx={4}
            />
            <Tooltip 
              content={
                <CustomTooltip 
                  formatPrice={formatPrice} 
                  formatCompactPrice={formatCompactPrice}
                  timeZone={tz} 
                  activeMetric={activeMetric}
                />
              } 
              cursor={{ stroke: '#64748B', strokeWidth: 1, strokeDasharray: '3 3' }} 
            />

            {/* Target Price Horizon Level (if Price mode) */}
            {activeMetric === 'price' && targetPrice && (
              <ReferenceLine 
                y={targetPrice} 
                stroke="#A855F7" 
                strokeDasharray="4 3" 
                strokeOpacity={0.75}
                label={{ 
                  value: 'Target', 
                  fill: '#C084FC', 
                  fontSize: 10, 
                  position: 'insideRight' 
                }} 
              />
            )}

            {/* Primary Live Market Vector Curve */}
            <Area 
              type="monotone" 
              dataKey={activeMetric === 'market_cap' ? 'actualMarketCap' : 'actualPrice'} 
              stroke={trendColor} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#priceTrendGradient)" 
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#0B0F19', fill: trendColor }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
