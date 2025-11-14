import axios from 'axios';

// Use environment variable if set, otherwise use relative URL to leverage Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhance error messages for common issues
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      error.userMessage = 'Cannot connect to the backend server. Please make sure the server is running on port 5001.';
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      error.userMessage = 'Request timed out. The server may be slow or unavailable.';
    } else if (error.response) {
      // Server responded with error status
      error.userMessage = error.response.data?.error || `Server error: ${error.response.status}`;
    } else {
      error.userMessage = error.message || 'An unexpected error occurred';
    }
    return Promise.reject(error);
  }
);

// Crypto API
export const cryptoAPI = {
  getTop: (limit = 10) => api.get(`/crypto/top?limit=${limit}`),
  getById: (id) => api.get(`/crypto/${id}`),
  getHistory: (id, days = 30) => api.get(`/crypto/${id}/history?days=${days}`),
  search: (query) => api.get(`/crypto/search/${query}`),
};

// Stock API
export const stockAPI = {
  getQuote: (symbol) => api.get(`/stock/quote/${symbol}`),
  getIntraday: (symbol, interval = '5min') => api.get(`/stock/intraday/${symbol}?interval=${interval}`),
  getDaily: (symbol) => api.get(`/stock/daily/${symbol}`),
  search: (keywords) => api.get(`/stock/search/${keywords}`),
};

// Portfolio API
export const portfolioAPI = {
  create: (data) => api.post('/portfolio', data),
  getUserPortfolios: (userId) => api.get(`/portfolio/user/${userId}`),
  getPortfolio: (portfolioId) => api.get(`/portfolio/${portfolioId}`),
  update: (portfolioId, data) => api.put(`/portfolio/${portfolioId}`, data),
  delete: (portfolioId) => api.delete(`/portfolio/${portfolioId}`),
  getLeaderboard: () => api.get('/portfolio/leaderboard/all'),
  updateLeaderboard: (data) => api.post('/portfolio/leaderboard', data),
};

export default api;

