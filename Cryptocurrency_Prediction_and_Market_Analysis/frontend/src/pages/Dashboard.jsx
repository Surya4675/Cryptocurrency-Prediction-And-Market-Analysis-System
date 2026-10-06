import React, { useState, useEffect } from 'react';
import { marketApi, predictionApi, sentimentApi, newsApi } from '../api/client';
import PriceChart from '../components/PriceChart';
import PredictionCard from '../components/PredictionCard';
import SentimentCard from '../components/SentimentCard';
import NewsList from '../components/NewsList';
import CoinSelector from '../components/CoinSelector';
import PriceHistoryStats from '../components/PriceHistoryStats';
import ShapExplainability from '../components/ShapExplainability';
import { RefreshCw, Radio, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { getCoinLogo, getFallbackCoinLogo } from '../utils/coinLogos';

const QUICK_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
];

const Dashboard = () => {
  const { formatPrice } = useCurrency();
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(() => {
    return localStorage.getItem('selectedCoin') || 'bitcoin';
  });
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [news, setNews] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [timeRange, setTimeRange] = useState(1); // Default to 24H

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
    localStorage.setItem('selectedCoin', selectedCoin);
  }, [selectedCoin]);

  const fetchDashboardData = async (isBackground = false) => {
    if (!selectedCoin) return;
    if (!isBackground) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const [statsRes, historyRes, predRes, sentRes, newsRes] = await Promise.all([
        marketApi.getStats(selectedCoin).catch(() => ({ data: null })),
        marketApi.getHistory(selectedCoin, timeRange).catch(() => ({ data: [] })),
        predictionApi.getPrediction(selectedCoin).catch(() => ({ data: null })),
        sentimentApi.getSentiment(selectedCoin).catch(() => ({ data: null })),
        newsApi.getNews(selectedCoin).catch(() => ({ data: [] }))
      ]);

      setCoinStats(statsRes.data);
      setHistory(historyRes.data || []);
      setPrediction(predRes.data);
      setSentiment(sentRes.data);
      setNews(newsRes.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll real-time data every 25 seconds
    const interval = setInterval(() => fetchDashboardData(true), 25000);
    return () => clearInterval(interval);
  }, [selectedCoin, timeRange]);

  const livePrice = coinStats?.current_price || (history.length > 0 ? history[history.length - 1].price : null);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
                Market Intelligence
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
                LIVE REAL-TIME FEED
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center">
              Predictive AI algorithms scanning technical indicators & FinBERT sentiment in real time.
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition-colors shadow-sm"
              title="Click to refresh market data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {coins.length > 0 && (
              <CoinSelector 
                coins={coins} 
                selectedCoin={selectedCoin} 
                onChange={(e) => setSelectedCoin(e.target.value)} 
              />
            )}
          </div>
        </div>

        {/* Quick Crypto Asset Selector Pills for Laymen */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold shrink-0 mr-1">
            Popular Assets:
          </span>
          {QUICK_COINS.map((c) => {
            const isSelected = selectedCoin === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCoin(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center space-x-2 ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400' 
                    : 'bg-[#0f1422] text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-800'
                }`}
              >
                <img 
                  src={getCoinLogo(c.symbol, c.id)} 
                  alt={c.symbol} 
                  className="w-4 h-4 rounded-full object-contain" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackCoinLogo(c.symbol);
                  }}
                />
                <span>{c.name}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                  {c.symbol}
                </span>
              </button>
            );
          })}
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
          {/* Main Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <PriceHistoryStats 
                coinName={selectedCoin} 
                coinId={selectedCoin}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                currentLivePrice={livePrice}
                historyData={history}
                initialStats={coinStats}
              />
              
              <div className="h-[26rem]">
                <PriceChart 
                  data={history} 
                  prediction={prediction} 
                  priceChange24h={coinStats?.price_change_percentage_24h}
                />
              </div>
            </div>
            
            <div className="space-y-6 flex flex-col w-full">
              <div className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <PredictionCard 
                  prediction={prediction} 
                  livePrice={livePrice}
                />
              </div>
              
              <div className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <SentimentCard sentiment={sentiment} />
              </div>
            </div>
          </div>
          
          {/* SHAP Model Explainability */}
          <ShapExplainability prediction={prediction} coinName={selectedCoin} />

          {/* Market News and Signals */}
          <div className="glass-panel glass-panel-hover rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                  Market Signals & Media Intelligence
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time crypto headlines evaluated with FinBERT NLP for market sentiment
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700">
                {news.length} Sources Analyzed
              </span>
            </div>
            <NewsList news={news} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
