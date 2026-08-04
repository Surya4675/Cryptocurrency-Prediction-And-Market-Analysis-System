import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const marketApi = {
  getCoins: () => client.get('/market/coins'),
  getHistory: (coinId, days = 30) => client.get(`/market/${coinId}/history?days=${days}`),
};

export const predictionApi = {
  getPrediction: (coinId) => client.get(`/prediction/${coinId}`),
};

export const sentimentApi = {
  getSentiment: (coinId) => client.get(`/sentiment/${coinId}`),
};

export const newsApi = {
  getNews: (coinId) => client.get(`/news/${coinId}`),
};

export const watchlistApi = {
  getWatchlist: () => client.get('/watchlist/'),
};

export default client;
