import React from 'react';
import { useCurrency } from '../context/CurrencyContext';

const PredictionCard = ({ prediction }) => {
  const { formatPrice } = useCurrency();

  if (!prediction) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg flex items-center justify-center h-48 text-gray-500">
        Prediction data unavailable
      </div>
    );
  }

  const isPositive = prediction.predicted_return >= 0;
  const returnClass = isPositive ? 'text-green-400' : 'text-red-400';
  const returnIcon = isPositive ? '↑' : '↓';

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
      <h3 className="text-lg font-medium text-gray-400 mb-2">Next-Day Forecast</h3>
      
      <div className="mt-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-500">Predicted Price</p>
            <p className="text-3xl font-bold text-white mt-1">
              {formatPrice(prediction.predicted_price)}
            </p>
          </div>
          <div className={`flex items-center text-xl font-semibold ${returnClass}`}>
            <span>{returnIcon}</span>
            <span className="ml-1">{Math.abs(prediction.predicted_return * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Current Price:</span>
          <span className="text-gray-300">${prediction.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Model:</span>
          <span className="text-gray-300">{prediction.model_version}</span>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
