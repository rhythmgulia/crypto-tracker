import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

// Get stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    if (response.data['Error Message']) {
      return res.status(400).json({ error: response.data['Error Message'] });
    }
    
    if (response.data['Note']) {
      return res.status(429).json({ error: 'API rate limit exceeded. Please use demo key or wait.' });
    }
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get intraday data
router.get('/intraday/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '5min' } = req.query;
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol,
        interval: interval,
        apikey: API_KEY
      }
    });
    
    if (response.data['Error Message']) {
      return res.status(400).json({ error: response.data['Error Message'] });
    }
    
    if (response.data['Note']) {
      return res.status(429).json({ error: 'API rate limit exceeded' });
    }
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily data
router.get('/daily/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    if (response.data['Error Message']) {
      return res.status(400).json({ error: response.data['Error Message'] });
    }
    
    if (response.data['Note']) {
      return res.status(429).json({ error: 'API rate limit exceeded' });
    }
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search stocks
router.get('/search/:keywords', async (req, res) => {
  try {
    const { keywords } = req.params;
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: keywords,
        apikey: API_KEY
      }
    });
    
    if (response.data['Error Message']) {
      return res.status(400).json({ error: response.data['Error Message'] });
    }
    
    if (response.data['Note']) {
      return res.status(429).json({ error: 'API rate limit exceeded' });
    }
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as alphaVantageRoutes };

