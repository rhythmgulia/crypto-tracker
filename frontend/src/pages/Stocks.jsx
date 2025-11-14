import { useState, useEffect } from 'react';
import { stockAPI } from '../services/api';
import Plot from 'react-plotly.js';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import './Stocks.css';

const Stocks = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [interval, setInterval] = useState('daily');

  const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];

  useEffect(() => {
    fetchStockData();
  }, [selectedSymbol, interval]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const [quoteRes, dataRes] = await Promise.all([
        stockAPI.getQuote(selectedSymbol).catch(() => null),
        interval === 'daily'
          ? stockAPI.getDaily(selectedSymbol).catch(() => null)
          : stockAPI.getIntraday(selectedSymbol, '5min').catch(() => null),
      ]);

      if (quoteRes?.data?.['Global Quote']) {
        const quote = quoteRes.data['Global Quote'];
        setStockData({
          symbol: selectedSymbol,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          open: parseFloat(quote['02. open']),
          high: parseFloat(quote['03. high']),
          low: parseFloat(quote['04. low']),
          volume: parseFloat(quote['06. volume']),
        });
      }

      if (dataRes?.data) {
        const timeSeriesKey = interval === 'daily' 
          ? 'Time Series (Daily)'
          : `Time Series (5min)`;
        
        const timeSeries = dataRes.data[timeSeriesKey];
        if (timeSeries) {
          const dates = Object.keys(timeSeries).sort();
          const prices = dates.map(date => ({
            x: new Date(date),
            y: parseFloat(timeSeries[date]['4. close']),
          }));

          // Calculate moving averages
          const ma7 = calculateMA(prices, 7);
          const ma30 = calculateMA(prices, 30);

          setChartData({
            prices,
            ma7: ma7.length > 0 ? ma7 : null,
            ma30: ma30.length > 0 ? ma30 : null,
          });
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setLoading(false);
    }
  };

  const calculateMA = (data, period) => {
    if (data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.y, 0);
      result.push({
        x: data[i].x,
        y: sum / period,
      });
    }
    return result;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const symbol = searchQuery.toUpperCase();
    setSelectedSymbol(symbol);
    setSearchQuery('');
  };

  if (loading && !stockData) {
    return <div className="loading">Loading stock data...</div>;
  }

  return (
    <div className="stocks-page">
      <h1 className="page-title">Stock Market Tracker</h1>

      <div className="stocks-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter stock symbol (e.g., AAPL, MSFT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>
            <Search size={20} />
          </button>
        </div>

        <div className="interval-selector">
          <button
            className={interval === 'intraday' ? 'active' : ''}
            onClick={() => setInterval('intraday')}
          >
            Intraday
          </button>
          <button
            className={interval === 'daily' ? 'active' : ''}
            onClick={() => setInterval('daily')}
          >
            Daily
          </button>
        </div>
      </div>

      <div className="popular-stocks">
        <h3>Popular Stocks</h3>
        <div className="stock-badges">
          {popularStocks.map((symbol) => (
            <button
              key={symbol}
              className={`stock-badge ${selectedSymbol === symbol ? 'active' : ''}`}
              onClick={() => setSelectedSymbol(symbol)}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {stockData ? (
        <div className="stock-content">
          <div className="stock-header">
            <div className="stock-header-left">
              <div className="stock-icon">{stockData.symbol}</div>
              <div>
                <h2>{stockData.symbol}</h2>
                <div className="stock-header-price">
                  ${stockData.price.toFixed(2)}
                  <span className={`change ${stockData.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {stockData.changePercent >= 0 ? '+' : ''}
                    {stockData.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="stock-stats">
              <div className="stat">
                <div className="stat-label">Open</div>
                <div className="stat-value">${stockData.open.toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">High</div>
                <div className="stat-value">${stockData.high.toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Low</div>
                <div className="stat-value">${stockData.low.toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Volume</div>
                <div className="stat-value">{stockData.volume.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {chartData && (
            <div className="chart-container">
              <Plot
                data={[
                  {
                    x: chartData.prices.map(d => d.x),
                    y: chartData.prices.map(d => d.y),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Price',
                    line: { color: '#6366f1', width: 2 },
                  },
                  ...(chartData.ma7 ? [{
                    x: chartData.ma7.map(d => d.x),
                    y: chartData.ma7.map(d => d.y),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'MA 7',
                    line: { color: '#f59e0b', width: 1.5, dash: 'dash' },
                  }] : []),
                  ...(chartData.ma30 ? [{
                    x: chartData.ma30.map(d => d.x),
                    y: chartData.ma30.map(d => d.y),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'MA 30',
                    line: { color: '#10b981', width: 1.5, dash: 'dash' },
                  }] : []),
                ]}
                layout={{
                  title: '',
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: '#cbd5e1' },
                  xaxis: {
                    gridcolor: '#334155',
                    showgrid: true,
                  },
                  yaxis: {
                    gridcolor: '#334155',
                    showgrid: true,
                  },
                  legend: {
                    x: 0,
                    y: 1,
                    bgcolor: 'rgba(0,0,0,0)',
                  },
                  margin: { l: 50, r: 20, t: 20, b: 50 },
                  height: 400,
                }}
                config={{
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}

          {!chartData && (
            <div className="empty-state">
              <p>Chart data unavailable. API rate limit may be exceeded.</p>
              <p className="hint">
                Alpha Vantage has rate limits. Use a valid API key for production use.
                The demo key allows limited requests.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>Stock data unavailable. Please try again or check your API key.</p>
        </div>
      )}
    </div>
  );
};

export default Stocks;

