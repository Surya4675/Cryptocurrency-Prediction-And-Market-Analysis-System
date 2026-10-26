import React, { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import NewsList from '../components/NewsList';
import CoinSelector from '../components/CoinSelector';
import { marketApi, newsApi } from '../api/client';

const News = () => {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await marketApi.getCoins();
        setCoins(response.data || []);
      } catch (error) {
        console.error("Failed to fetch coins:", error);
      }
    };
    fetchCoins();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      if (!selectedCoin) return;
      setLoading(true);
      try {
        const response = await newsApi.getNews(selectedCoin);
        setNews(response.data || []);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [selectedCoin]);

  const currentCoinObj = coins.find(c => c.coin_id === selectedCoin || c.id === selectedCoin);
  const displayName = currentCoinObj?.name || (selectedCoin ? selectedCoin.charAt(0).toUpperCase() + selectedCoin.slice(1) : 'Bitcoin');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Newspaper className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Crypto News Feed
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time financial news analyzed with FinBERT for natural language sentiment & market impact.
          </p>
        </div>
        
        {coins.length > 0 && (
          <CoinSelector 
            coins={coins} 
            selectedCoin={selectedCoin} 
            onChange={(e) => setSelectedCoin(e.target.value)} 
          />
        )}
      </div>

      <div className="enterprise-panel p-6 min-h-[60vh]">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Latest Headlines for {displayName}
          </span>
          <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            {news.length} Articles Analyzed
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton-loader h-32 w-full rounded-xl opacity-50"></div>
            ))}
          </div>
        ) : (
          <NewsList news={news} />
        )}
      </div>
    </div>
  );
};

export default News;
