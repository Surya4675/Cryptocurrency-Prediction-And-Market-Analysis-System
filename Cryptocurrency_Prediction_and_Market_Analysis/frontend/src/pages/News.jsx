import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper } from 'lucide-react';
import NewsList from '../components/NewsList';
import CoinSelector from '../components/CoinSelector';

const News = () => {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/market/coins');
        setCoins(response.data);
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
        const response = await axios.get(`http://localhost:5000/api/news/${selectedCoin}`);
        setNews(response.data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [selectedCoin]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Newspaper className="w-8 h-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-white">Crypto News Feed</h1>
        </div>
        
        {coins.length > 0 && (
          <div className="glass-panel rounded-lg px-2 py-1">
            <CoinSelector 
              coins={coins} 
              selectedCoin={selectedCoin} 
              onChange={(e) => setSelectedCoin(e.target.value)} 
            />
          </div>
        )}
      </div>

      <div className="glass-panel rounded-xl p-6 min-h-[60vh]">
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
