import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

const CustomTooltip = ({ active, payload, label, formatPrice }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 shadow-xl backdrop-blur-xl border border-slate-700/50 rounded-xl">
        <p className="text-slate-400 text-xs mb-2 font-medium tracking-wide uppercase">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center space-x-3 mb-1">
            <div className={`w-2 h-2 rounded-full`} style={{backgroundColor: entry.color}}></div>
            <span className="text-slate-300 text-sm">{entry.name === 'actualPrice' ? 'Actual Price' : 'Predicted Price'}:</span>
            <span className="text-white font-mono font-bold text-sm tracking-tight">{formatPrice(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PriceChart = ({ data, prediction }) => {
  const { formatPrice } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="skeleton-loader w-full h-full opacity-50"></div>
      </div>
    );
  }

  const formattedData = data.map(item => {
    const date = new Date(item.timestamp);
    return {
      ...item,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
      actualPrice: item.price
    };
  });

  let predictionDate = null;

  if (prediction && prediction.predicted_price) {
    const lastDate = new Date(data[data.length - 1].timestamp);
    const nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    predictionDate = `${nextDate.getMonth() + 1}/${nextDate.getDate()}`;
    
    formattedData.push({
      displayDate: predictionDate,
      predictedPrice: prediction.predicted_price,
      isPrediction: true
    });

    // Bridge the gap for the continuous line
    formattedData[formattedData.length - 2].predictedPrice = formattedData[formattedData.length - 2].actualPrice;
  }

  // Determine trend color
  const isUptrend = formattedData.length > 1 && formattedData[formattedData.length - 1].actualPrice >= formattedData[0].actualPrice;
  const trendColor = isUptrend ? '#10b981' : '#f43f5e'; // Emerald or Rose

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formattedData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={trendColor} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={trendColor} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={false} />
        <XAxis 
          dataKey="displayDate" 
          stroke="#475569" 
          tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
          dy={10}
        />
        <YAxis 
          domain={['auto', 'auto']} 
          stroke="#475569"
          tickFormatter={(val) => formatPrice(val).replace(/[^0-9.KMB]/g, '')}
          tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}}
          axisLine={false}
          tickLine={false}
          width={60}
          orientation="right"
          dx={10}
        />
        <Tooltip content={<CustomTooltip formatPrice={formatPrice} />} cursor={{ stroke: 'rgba(148, 163, 184, 0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        {predictionDate && (
           <ReferenceLine x={formattedData[formattedData.length - 2].displayDate} stroke="#475569" strokeDasharray="3 3" />
        )}
        <Area 
          type="monotone" 
          dataKey="actualPrice" 
          stroke={trendColor} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorPrice)" 
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#020617', fill: trendColor }}
          style={{ filter: 'url(#glow)' }}
        />
        <Area 
          type="monotone" 
          dataKey="predictedPrice" 
          stroke="#8B5CF6" 
          strokeWidth={3}
          strokeDasharray="5 5"
          fillOpacity={1} 
          fill="url(#colorPrediction)" 
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#020617', fill: '#8B5CF6' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
