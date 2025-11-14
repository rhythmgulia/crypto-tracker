# Crypto & Stock Market Tracker

A full-stack fintech application for tracking cryptocurrency and stock market prices in real-time, visualizing trends, and simulating investment returns.

## Features

- 📊 **Real-time Market Data**: Track top cryptocurrencies and stocks
- 📈 **Interactive Charts**: Visualize price trends with moving averages (MA 7, MA 30)
- 💼 **Portfolio Management**: Create virtual portfolios and track performance
- 🏆 **Leaderboard**: Compete with other users based on portfolio value
- 🎨 **Modern UI**: Beautiful, responsive design with dark theme

## Tech Stack

- **Frontend**: React, Vite, Plotly.js, React Router
- **Backend**: Node.js, Express
- **APIs**: CoinGecko API, Alpha Vantage API
- **Storage**: In-memory (can be upgraded to Firebase)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure environment variables (optional):**

   Create a `.env` file in the `backend` directory:
   ```
   PORT=5001
   ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```
   
   Note: Port 5000 is often used by macOS AirPlay Receiver. We use port 5001 by default to avoid conflicts.

   Note: Alpha Vantage API has rate limits. For production, get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key).

   CoinGecko API doesn't require an API key for basic usage.

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The server will run on `http://localhost:5001`

2. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will open at `http://localhost:3000`

## Usage

1. **Dashboard**: View overview of top cryptocurrencies and popular stocks
2. **Crypto**: Browse and search cryptocurrencies, view detailed charts with moving averages
3. **Stocks**: Search stocks by symbol, view intraday and daily charts
4. **Portfolio**: Create virtual portfolios, add holdings, track gains/losses
5. **Leaderboard**: See top portfolios ranked by total value

## API Endpoints

### Crypto
- `GET /api/crypto/top?limit=10` - Get top cryptocurrencies
- `GET /api/crypto/:id` - Get cryptocurrency details
- `GET /api/crypto/:id/history?days=30` - Get historical price data
- `GET /api/crypto/search/:query` - Search cryptocurrencies

### Stocks
- `GET /api/stock/quote/:symbol` - Get stock quote
- `GET /api/stock/intraday/:symbol` - Get intraday data
- `GET /api/stock/daily/:symbol` - Get daily data
- `GET /api/stock/search/:keywords` - Search stocks

### Portfolio
- `POST /api/portfolio` - Create portfolio
- `GET /api/portfolio/user/:userId` - Get user portfolios
- `GET /api/portfolio/:portfolioId` - Get portfolio details
- `PUT /api/portfolio/:portfolioId` - Update portfolio
- `DELETE /api/portfolio/:portfolioId` - Delete portfolio
- `GET /api/portfolio/leaderboard/all` - Get leaderboard
- `POST /api/portfolio/leaderboard` - Update leaderboard entry

## Notes

- Alpha Vantage API has rate limits (5 calls/minute, 500 calls/day for free tier)
- Portfolio data is stored in-memory by default and will reset on server restart
- **Firebase Integration**: Firebase is now supported for persistent storage! See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for setup instructions
- CoinGecko API is free but has rate limits (10-50 calls/minute)

## Future Enhancements

- [x] Firebase integration for persistent storage
- [ ] User authentication
- [ ] Real-time price updates via WebSockets
- [ ] Advanced charting tools
- [ ] Portfolio analytics and insights
- [ ] Price alerts and notifications

## License

ISC

