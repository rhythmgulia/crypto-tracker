import express from 'express';
import axios from 'axios';

const router = express.Router();

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Get top cryptocurrencies
router.get('/top', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const response = await axios.get(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search cryptocurrencies (must be before /:id route)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const response = await axios.get(
      `${COINGECKO_API}/search?query=${query}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical data for charts (must be before /:id route)
router.get('/:id/history', async (req, res) => {
  const { id } = req.params;
  const { days = 30 } = req.query;
  
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    );
    
    // Check if CoinGecko returned an error
    if (response.data.error) {
      return res.status(400).json({ error: response.data.error });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching history for ${id}:`, error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch historical data';
    res.status(statusCode).json({ error: errorMessage });
  }
});

// Get specific cryptocurrency data (must be last)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const response = await axios.get(
      `${COINGECKO_API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    );
    
    // Check if CoinGecko returned an error
    if (response.data.error) {
      return res.status(400).json({ error: response.data.error });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching data for ${id}:`, error.message);
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch cryptocurrency data';
    res.status(statusCode).json({ error: errorMessage });
  }
});

export { router as coinGeckoRoutes };

