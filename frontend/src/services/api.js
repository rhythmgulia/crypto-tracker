import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

