import React, { useState, useEffect } from 'react';
import { marketApi } from '../api/client';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { getCoinLogo, getFallbackCoinLogo } from '../utils/coinLogos';

const TopTicker = () => {
  const { formatPrice } = useCurrency();
  const [tickerCoins, setTickerCoins] = useState([]);

  const fetchTopCoins = async () => {
    try {
      const response = await marketApi.getSummary({ limit: 20 });
      if (response.data && response.data.coins) {
        setTickerCoins(response.data.coins.slice(0, 15));
      }
    } catch (error) {
      console.error("Failed to fetch top coins for ticker:", error);
    }
  };

  useEffect(() => {
    fetchTopCoins();
    const interval = setInterval(fetchTopCoins, 30000);
    return () => clearInterval(interval);
  }, []);

  if (tickerCoins.length === 0) return null;

  return (
    <div className="bg-[#0a0e17] border-b border-slate-800/60 py-1.5 overflow-hidden sticky top-0 z-10 hidden sm:block shadow-[0_4px_20px_-10px_rgba(0,0,0,0.6)]">
      <div className="flex animate-marquee whitespace-nowrap items-center">
        {/* Duplicate the array to make the marquee seamless */}
        {[...tickerCoins, ...tickerCoins, ...tickerCoins].map((coin, index) => {
          const change = Number(coin.price_change_percentage_24h || 0);
          const isPositive = change >= 0;
          const logoSrc = getCoinLogo(coin.symbol, coin.coin_id, coin.image);

          return (
            <div key={`${coin.id || coin.coin_id}-${index}`} className="flex items-center mx-5">
              <img 
                src={logoSrc} 
                alt={coin.symbol} 
                className="w-4 h-4 rounded-full object-contain mr-1.5 bg-slate-900 border border-slate-700/50 shadow-sm"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackCoinLogo(coin.symbol);
                }}
              />
              <span className="font-bold text-gray-300 mr-2 text-xs">{(coin.symbol || '').toUpperCase()}</span>
              <span className="text-white font-mono text-xs">{formatPrice(coin.current_price)}</span>
              <span className={`ml-2 flex items-center text-xs font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopTicker;
