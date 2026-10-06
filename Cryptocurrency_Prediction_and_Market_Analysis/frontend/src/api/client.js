import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add robust auto-retry logic for network instability or 5xx errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Default to 3 retries
    if (!config || !config.retry) {
      config.retry = {
        count: 0,
        maxRetries: 3,
        baseDelay: 1000
      };
    }
    
    // Only retry on network errors or 5xx server errors
    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);
    
    if (shouldRetry && config.retry.count < config.retry.maxRetries) {
      config.retry.count += 1;
      const delay = config.retry.baseDelay * (2 ** (config.retry.count - 1));
      
      console.warn(`API request failed, retrying (${config.retry.count}/${config.retry.maxRetries}) in ${delay}ms...`);
      
      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry request
      return client(config);
    }
    
    return Promise.reject(error);
  }
);

export const marketApi = {
  getCoins: () => client.get('/market/coins'),
  getSummary: (params = {}) => client.get('/market/summary', { params }),
  getHistory: (coinId, days = 30) => client.get(`/market/${coinId}/history?days=${days}`),
  getStats: (coinId) => client.get(`/market/${coinId}/stats`),
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
