import React, { useState, useEffect } from 'react';
import { marketApi, predictionApi, sentimentApi, newsApi } from '../api/client';
import PriceChart from '../components/PriceChart';
import PredictionCard from '../components/PredictionCard';
import SentimentCard from '../components/SentimentCard';
import NewsList from '../components/NewsList';
import CoinSelector from '../components/CoinSelector';
import PriceHistoryStats from '../components/PriceHistoryStats';
import ShapExplainability from '../components/ShapExplainability';
import { RefreshCw, Clock, Sparkles } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCY_CONFIG } from '../utils/currencyConfig';
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
  const { 
    currency, 
    setCurrency, 
    currencies, 
    timeZone, 
    timeZoneLabel, 
    country, 
    flag 
  } = useCurrency();
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
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [timeRange, setTimeRange] = useState(1); // Default to 24H

  // Live ticking clock updated every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        marketApi.getStats(selectedCoin, currency).catch(() => ({ data: null })),
        marketApi.getHistory(selectedCoin, timeRange, currency).catch(() => ({ data: [] })),
        predictionApi.getPrediction(selectedCoin, currency).catch(() => ({ data: null })),
        sentimentApi.getSentiment(selectedCoin).catch(() => ({ data: null })),
        newsApi.getNews(selectedCoin).catch(() => ({ data: [] }))
      ]);

      setCoinStats(statsRes.data);
      setHistory(historyRes.data || []);
      setPrediction(predRes.data);
      setSentiment(sentRes.data);
      setNews(newsRes.data || []);
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
  }, [selectedCoin, timeRange, currency]);

  const livePrice = coinStats?.current_price || (history.length > 0 ? history[history.length - 1].price : null);

  return (
    <div className="space-y-6">
      {/* 1. Top Enterprise Banner & Action Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Clean solid typography, no rainbow gradients */}
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Market Intelligence
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                LIVE REAL-TIME FEED
              </span>
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900 text-slate-300 border border-slate-800"
                title={`Active Timezone for ${country} (${timeZone})`}
              >
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-mono text-slate-300">
                  {currentDateTime.toLocaleDateString('en-US', {
                    timeZone: timeZone || 'Asia/Kolkata',
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {currentDateTime.toLocaleTimeString('en-US', {
                    timeZone: timeZone || 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </span>
                <span className="ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {flag} {timeZoneLabel}
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Quantitative AI algorithms scanning technical indicators & FinBERT sentiment in real time.
            </p>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => fetchDashboardData(false)}
              disabled={refreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors shadow-2xs"
              title="Click to refresh market data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <div className="flex items-center bg-slate-900 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs shadow-2xs transition-colors">
              <span className="mr-1.5 text-sm">{flag}</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold outline-none cursor-pointer text-xs"
                title="Change Country Currency & Timezone"
              >
                {currencies.map(c => {
                  const item = CURRENCY_CONFIG[c];
                  return (
                    <option key={c} value={c} className="bg-slate-900 text-slate-200">
                      {item?.flag ? `${item.flag} ` : ''}{c} ({item?.timeZoneLabel || c})
                    </option>
                  );
                })}
              </select>
            </div>

            {coins.length > 0 && (
              <CoinSelector 
                coins={coins} 
                selectedCoin={selectedCoin} 
                onChange={(e) => setSelectedCoin(e.target.value)} 
              />
            )}
          </div>
        </div>

        {/* 2. Popular Asset Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold shrink-0 mr-1">
            Popular Assets:
          </span>
          {QUICK_COINS.map((c) => {
            const isSelected = selectedCoin === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCoin(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center space-x-2 ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-500' 
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
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
                <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {c.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 enterprise-panel p-6 h-96">
            <div className="skeleton-loader w-full h-full opacity-50"></div>
          </div>
          <div className="space-y-6 flex flex-col">
            <div className="enterprise-panel p-6 h-44">
              <div className="skeleton-loader w-full h-full opacity-40"></div>
            </div>
            <div className="enterprise-panel p-6 h-44">
              <div className="skeleton-loader w-full h-full opacity-40"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Main Hero Grid (2-Column Standard Financial Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Left 2 Cols: Price History & Main Chart */}
            <div className="lg:col-span-2 enterprise-panel p-5 relative overflow-hidden">
              <PriceHistoryStats 
                coinName={selectedCoin} 
                coinId={selectedCoin}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                currentLivePrice={livePrice}
                historyData={history}
                initialStats={coinStats}
              />
              
              <div className="h-[26rem] mt-3">
                <PriceChart 
                  data={history} 
                  prediction={prediction} 
                  priceChange24h={coinStats?.price_change_percentage_24h}
                />
              </div>
            </div>
            
            {/* Right 1 Col: AI Prediction & Sentiment */}
            <div className="space-y-5 flex flex-col w-full">
              <div className="enterprise-panel p-5">
                <PredictionCard 
                  prediction={prediction} 
                  livePrice={livePrice}
                />
              </div>
              
              <div className="enterprise-panel p-5">
                <SentimentCard sentiment={sentiment} />
              </div>
            </div>
          </div>
          
          {/* 4. SHAP Model Explainability */}
          <ShapExplainability prediction={prediction} coinName={selectedCoin} />

          {/* 5. Market News and Signals */}
          <div className="enterprise-panel p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Market Signals & Media Intelligence
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time crypto headlines evaluated with FinBERT NLP for market sentiment
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
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
