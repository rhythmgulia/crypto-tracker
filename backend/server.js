import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { coinGeckoRoutes } from './routes/coingecko.js';
import { alphaVantageRoutes } from './routes/alphavantage.js';
import { portfolioRoutes } from './routes/portfolio.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/crypto', coinGeckoRoutes);
app.use('/api/stock', alphaVantageRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

