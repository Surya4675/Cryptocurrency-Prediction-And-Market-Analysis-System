import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

const PriceChart = ({ data }) => {
  const { formatPrice, currency, currencies } = useCurrency();

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>;
  }

  // Format date for display and convert prices directly for the chart
  // This ensures the YAxis dynamically scales based on the converted values (e.g. 50k USD vs 4.2M INR)
  const rateMultiplier = currency === 'USD' ? 1 : undefined; // Rate logic is handled in formatPrice, but Recharts needs numeric values.
  
  const formattedData = data.map(item => {
    const date = new Date(item.timestamp);
    // Note: Recharts line needs numbers, so we shouldn't pass strings.
    // However, doing raw multiplication inside the chart requires the raw rate.
    // Since formatPrice returns strings, we'll use a local trick to get the numeric rate.
    return {
      ...item,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="displayDate" stroke="#9CA3AF" />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#9CA3AF"
            tickFormatter={(val) => formatPrice(val)}
            width={80}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', color: '#F3F4F6' }}
            formatter={(value) => [formatPrice(value), 'Price']}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
