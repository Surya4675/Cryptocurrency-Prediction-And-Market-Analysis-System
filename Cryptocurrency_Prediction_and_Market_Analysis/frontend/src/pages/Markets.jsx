import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Search } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const Markets = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // 'All', 'Gainers', 'Losers'
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/market/summary');
        if (response.data && response.data.coins) {
          setCoins(response.data.coins);
        }
      } catch (error) {
        console.error("Failed to fetch market data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  // Process coins based on search and filter
  let processedCoins = [...coins].filter(coin => {
    const matchesSearch = (coin.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (coin.symbol || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'Gainers') return matchesSearch && coin.price_change_percentage_24h > 0;
    if (filter === 'Losers') return matchesSearch && coin.price_change_percentage_24h < 0;
    return matchesSearch;
  });

  // Sort gainers and losers
  if (filter === 'Gainers') {
    processedCoins.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  } else if (filter === 'Losers') {
    processedCoins.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-white">Global Markets</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search assets..."
              className="bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 shrink-0">
            {['All', 'Gainers', 'Losers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Asset</th>
                <th className="p-4 font-medium text-right">Price</th>
                <th className="p-4 font-medium text-right">24h Change</th>
                <th className="p-4 font-medium text-right hidden sm:table-cell">Market Cap</th>
                <th className="p-4 font-medium text-right hidden md:table-cell">Volume (24h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array(10).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><div className="skeleton-loader h-6 w-32"></div></td>
                    <td className="p-4"><div className="skeleton-loader h-6 w-20 ml-auto"></div></td>
                    <td className="p-4"><div className="skeleton-loader h-6 w-16 ml-auto"></div></td>
                    <td className="p-4 hidden sm:table-cell"><div className="skeleton-loader h-6 w-24 ml-auto"></div></td>
                    <td className="p-4 hidden md:table-cell"><div className="skeleton-loader h-6 w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : processedCoins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    No cryptocurrencies found matching your criteria.
                  </td>
                </tr>
              ) : (
                processedCoins.map((coin) => {
                  const isPositive = coin.price_change_percentage_24h >= 0;
                  return (
                    <tr key={coin.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full mr-3" />
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-white transition-colors">{coin.name}</div>
                            <div className="text-xs text-slate-500 uppercase">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className={`p-4 text-right font-medium flex items-center justify-end ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                      </td>
                      <td className="p-4 text-right text-slate-400 font-mono hidden sm:table-cell">
                        {coin.market_cap > 0 ? formatPrice(coin.market_cap) : 'N/A'}
                      </td>
                      <td className="p-4 text-right text-slate-400 font-mono hidden md:table-cell">
                        {coin.total_volume > 0 ? formatPrice(coin.total_volume) : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Markets;
