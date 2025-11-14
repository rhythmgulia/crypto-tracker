import { useState, useEffect } from 'react';
import { cryptoAPI, stockAPI } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [cryptoRes, stockRes1, stockRes2] = await Promise.all([
        cryptoAPI.getTop(5),
        stockAPI.getQuote('AAPL').catch(() => null),
        stockAPI.getQuote('MSFT').catch(() => null),
      ]);

      setCryptoData(cryptoRes.data);
      
      const stocks = [];
      if (stockRes1?.data?.['Global Quote']) {
        stocks.push(formatStockData(stockRes1.data['Global Quote'], 'AAPL'));
      }
      if (stockRes2?.data?.['Global Quote']) {
        stocks.push(formatStockData(stockRes2.data['Global Quote'], 'MSFT'));
      }
      setStockData(stocks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const formatStockData = (quote, symbol) => {
    return {
      symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    };
  };

  if (loading) {
    return <div className="loading">Loading market data...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Market Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <DollarSign size={24} />
            <span>Total Market Cap</span>
          </div>
          <div className="stat-value">
            ${cryptoData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0).toLocaleString()}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-header">
            <BarChart3 size={24} />
            <span>Active Markets</span>
          </div>
          <div className="stat-value">{cryptoData.length + stockData.length}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <h2>Top Cryptocurrencies</h2>
          <div className="market-list">
            {cryptoData.map((coin) => (
              <div key={coin.id} className="market-item">
                <div className="market-item-header">
                  <img src={coin.image} alt={coin.name} className="market-icon" />
                  <div>
                    <div className="market-name">{coin.name}</div>
                    <div className="market-symbol">{coin.symbol.toUpperCase()}</div>
                  </div>
                </div>
                <div className="market-price">
                  <div className="price">${coin.current_price?.toLocaleString()}</div>
                  <div className={`change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                    {coin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Popular Stocks</h2>
          <div className="market-list">
            {stockData.length > 0 ? (
              stockData.map((stock) => (
                <div key={stock.symbol} className="market-item">
                  <div className="market-item-header">
                    <div className="market-icon stock-icon">{stock.symbol}</div>
                    <div>
                      <div className="market-name">{stock.symbol}</div>
                      <div className="market-symbol">Stock</div>
                    </div>
                  </div>
                  <div className="market-price">
                    <div className="price">${stock.price?.toFixed(2)}</div>
                    <div className={`change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {stock.changePercent >= 0 ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                      {Math.abs(stock.changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Stock data unavailable. API rate limit may be exceeded.</p>
                <p className="hint">Alpha Vantage has rate limits. Use a valid API key for production.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

