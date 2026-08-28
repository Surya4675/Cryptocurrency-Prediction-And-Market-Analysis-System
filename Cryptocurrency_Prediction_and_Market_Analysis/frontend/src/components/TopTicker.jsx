import React, { useState, useEffect } from 'react';
import { marketApi } from '../api/client';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const TopTicker = () => {
  const { formatPrice } = useCurrency();
  const [tickerCoins, setTickerCoins] = useState([]);

  useEffect(() => {
    const fetchTopCoins = async () => {
      try {
        const response = await marketApi.getSummary();
        // Just get top 10 for the ticker
        setTickerCoins(response.data.coins.slice(0, 10));
      } catch (error) {
        console.error("Failed to fetch top coins for ticker:", error);
      }
    };
    fetchTopCoins();
  }, []);

  if (tickerCoins.length === 0) return null;

  return (
    <div className="bg-[#0a0e17] border-b border-slate-800/50 py-2 overflow-hidden sticky top-0 z-10 hidden sm:block shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]">
      <div className="flex animate-marquee whitespace-nowrap">
        {/* Duplicate the array to make the marquee seamless */}
        {[...tickerCoins, ...tickerCoins, ...tickerCoins].map((coin, index) => {
          const isPositive = coin.price_change_percentage_24h > 0;
          return (
            <div key={`${coin.id}-${index}`} className="flex items-center mx-6">
              <span className="font-bold text-gray-300 mr-2">{coin.symbol.toUpperCase()}</span>
              <span className="text-white font-mono">{formatPrice(coin.current_price)}</span>
              <span className={`ml-2 flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopTicker;
