import React, { useState, useEffect } from 'react';
import { marketApi, predictionApi, sentimentApi, newsApi } from '../api/client';
import PriceChart from '../components/PriceChart';
import PredictionCard from '../components/PredictionCard';
import SentimentCard from '../components/SentimentCard';
import NewsList from '../components/NewsList';
import CoinSelector from '../components/CoinSelector';
import { RefreshCw } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const Dashboard = () => {
  const { formatPrice } = useCurrency();
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [timeRange, setTimeRange] = useState(1); // Default to 1D to match Google Finance

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await marketApi.getCoins();
        setCoins(response.data);
      } catch (error) {
        console.error("Failed to fetch coins:", error);
      }
    };
    fetchCoins();
  }, []);

  const fetchDashboardData = async (isBackground = false) => {
    if (!selectedCoin) return;
    if (!isBackground) setLoading(true);
    
    try {
      const [historyRes, predRes, sentRes, newsRes] = await Promise.all([
        marketApi.getHistory(selectedCoin, timeRange).catch(e => ({ data: [] })),
        predictionApi.getPrediction(selectedCoin).catch(e => ({ data: null })),
        sentimentApi.getSentiment(selectedCoin).catch(e => ({ data: null })),
        newsApi.getNews(selectedCoin).catch(e => ({ data: [] }))
      ]);
      
      setHistory(historyRes.data);
      setPrediction(predRes.data);
      setSentiment(sentRes.data);
      setNews(newsRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 60 seconds
    const interval = setInterval(() => fetchDashboardData(true), 60000);
    return () => clearInterval(interval);
  }, [selectedCoin, timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Market Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1 flex items-center">
            Live monitoring <span className="relative flex h-2 w-2 ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {history.length > 0 && (
            <div className="hidden sm:flex flex-col items-end mr-2 md:mr-4 max-w-[150px] md:max-w-xs">
              <div className="text-xl md:text-2xl font-bold text-white truncate w-full text-right" title={formatPrice(history[history.length - 1].price)}>
                {formatPrice(history[history.length - 1].price)}
              </div>
              <div className="text-[10px] md:text-xs text-green-400 font-medium tracking-wide uppercase">
                Live Price Updated
              </div>
            </div>
          )}
          <span className="text-xs text-gray-500 flex items-center hidden md:flex">
            <RefreshCw className="w-3 h-3 mr-1" />
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
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
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-xl p-6 h-96">
            <div className="skeleton-loader w-full h-full opacity-50"></div>
          </div>
          <div className="space-y-6 flex flex-col">
            <div className="glass-panel rounded-xl p-6 h-44">
              <div className="skeleton-loader w-full h-full opacity-40"></div>
            </div>
            <div className="glass-panel rounded-xl p-6 h-44">
              <div className="skeleton-loader w-full h-full opacity-40"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-100 flex items-center">
                  Price Action & Forecast
                </h2>
                <div className="flex bg-[#0a0e17] rounded-lg p-1 border border-gray-800">
                  {[
                    { label: '1D', value: 1 },
                    { label: '7D', value: 7 },
                    { label: '1M', value: 30 },
                    { label: '1Y', value: 365 }
                  ].map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setTimeRange(range.value)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        timeRange === range.value 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[26rem]">
                <PriceChart data={history} prediction={prediction} />
              </div>
            </div>
            
            <div className="space-y-6 flex flex-col w-full">
              <div className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <PredictionCard 
                  prediction={prediction} 
                  livePrice={history.length > 0 ? history[history.length - 1].price : null} 
                />
              </div>
              
              <div className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <SentimentCard sentiment={sentiment} />
              </div>
            </div>
          </div>
          
          <div className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>
            <h2 className="text-xl font-semibold mb-6 text-gray-100">Market Signals & Intelligence</h2>
            <NewsList news={news} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
