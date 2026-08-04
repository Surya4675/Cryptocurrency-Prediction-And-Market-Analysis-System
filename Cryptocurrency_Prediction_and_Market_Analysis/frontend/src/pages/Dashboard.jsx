import React, { useState, useEffect } from 'react';
import { marketApi, predictionApi, sentimentApi, newsApi } from '../api/client';
import PriceChart from '../components/PriceChart';
import PredictionCard from '../components/PredictionCard';
import SentimentCard from '../components/SentimentCard';
import NewsList from '../components/NewsList';
import CoinSelector from '../components/CoinSelector';

const Dashboard = () => {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await marketApi.getCoins();
        setCoins(response.data);
        if (response.data.length > 0 && !selectedCoin) {
          setSelectedCoin(response.data[0].coin_id);
        }
      } catch (error) {
        console.error("Failed to fetch coins:", error);
      }
    };
    fetchCoins();
  }, []);

  useEffect(() => {
    if (!selectedCoin) return;
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [historyRes, predRes, sentRes, newsRes] = await Promise.all([
          marketApi.getHistory(selectedCoin),
          predictionApi.getPrediction(selectedCoin),
          sentimentApi.getSentiment(selectedCoin),
          newsApi.getNews(selectedCoin)
        ]);
        
        setHistory(historyRes.data);
        setPrediction(predRes.data);
        setSentiment(sentRes.data);
        setNews(newsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [selectedCoin]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">Market Dashboard</h1>
        {coins.length > 0 && (
          <CoinSelector 
            coins={coins} 
            selectedCoin={selectedCoin} 
            onChange={(e) => setSelectedCoin(e.target.value)} 
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">Price History (30 Days)</h2>
              <PriceChart data={history} />
            </div>
            
            <div className="space-y-6">
              <PredictionCard prediction={prediction} />
              <SentimentCard sentiment={sentiment} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Latest News & Analysis</h2>
            <NewsList news={news} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
