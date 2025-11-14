import { useState, useEffect } from 'react';
import { cryptoAPI } from '../services/api';
import Plot from 'react-plotly.js';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import './Crypto.css';

const Crypto = () => {
  const [cryptoList, setCryptoList] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchTopCrypto();
  }, []);

  useEffect(() => {
    if (selectedCrypto) {
      fetchChartData(selectedCrypto.id, days);
    }
  }, [selectedCrypto, days]);

  const fetchTopCrypto = async () => {
    try {
      const response = await cryptoAPI.getTop(50);
      setCryptoList(response.data);
      if (response.data.length > 0 && !selectedCrypto) {
        setSelectedCrypto(response.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching crypto:', error);
      setLoading(false);
    }
  };

  const fetchChartData = async (id, days) => {
    try {
      const response = await cryptoAPI.getHistory(id, days);
      const data = response.data;
      
      const prices = data.prices || [];
      const volumes = data.total_volumes || [];
      
      // Calculate moving averages
      const ma7 = calculateMA(prices, 7);
      const ma30 = calculateMA(prices, 30);
      
      const chartData = {
        prices: prices.map(([time, price]) => ({
          x: new Date(time),
          y: price,
        })),
        ma7: ma7.map(([time, price]) => ({
          x: new Date(time),
          y: price,
        })),
        ma30: ma30.map(([time, price]) => ({
          x: new Date(time),
          y: price,
        })),
        volumes: volumes.map(([time, volume]) => ({
          x: new Date(time),
          y: volume,
        })),
      };
      
      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const calculateMA = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, [, price]) => acc + price, 0);
      result.push([data[i][0], sum / period]);
    }
    return result;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await cryptoAPI.search(searchQuery);
      if (response.data.coins && response.data.coins.length > 0) {
        const coinId = response.data.coins[0].id;
        const detailResponse = await cryptoAPI.getById(coinId);
        // Format the coin data to match our list format
        const coin = detailResponse.data;
        const formattedCoin = {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          current_price: coin.market_data?.current_price?.usd || 0,
          price_change_percentage_24h: coin.market_data?.price_change_percentage_24h || 0,
          market_cap: coin.market_data?.market_cap?.usd || 0,
          image: coin.image?.small || '',
        };
        setSelectedCrypto(formattedCoin);
        setCryptoList([formattedCoin, ...cryptoList]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      alert('Cryptocurrency not found');
    }
  };

  if (loading) {
    return <div className="loading">Loading cryptocurrencies...</div>;
  }

  return (
    <div className="crypto-page">
      <h1 className="page-title">Cryptocurrency Tracker</h1>
      
      <div className="crypto-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search cryptocurrency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>
            <Search size={20} />
          </button>
        </div>
        
        <div className="time-selector">
          <button
            className={days === 7 ? 'active' : ''}
            onClick={() => setDays(7)}
          >
            7D
          </button>
          <button
            className={days === 30 ? 'active' : ''}
            onClick={() => setDays(30)}
          >
            30D
          </button>
          <button
            className={days === 90 ? 'active' : ''}
            onClick={() => setDays(90)}
          >
            90D
          </button>
          <button
            className={days === 365 ? 'active' : ''}
            onClick={() => setDays(365)}
          >
            1Y
          </button>
        </div>
      </div>

      <div className="crypto-content">
        <div className="crypto-list">
          <h2>Top Cryptocurrencies</h2>
          <div className="list-items">
            {cryptoList.map((coin) => (
              <div
                key={coin.id}
                className={`crypto-item ${selectedCrypto?.id === coin.id ? 'active' : ''}`}
                onClick={() => setSelectedCrypto(coin)}
              >
                <img src={coin.image} alt={coin.name} className="crypto-icon" />
                <div className="crypto-info">
                  <div className="crypto-name">{coin.name}</div>
                  <div className="crypto-symbol">{coin.symbol.toUpperCase()}</div>
                </div>
                <div className="crypto-price-info">
                  <div className="crypto-price">${coin.current_price?.toLocaleString()}</div>
                  <div className={`crypto-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                    {coin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="crypto-chart-section">
          {selectedCrypto && (
            <>
              <div className="crypto-header">
                <div className="crypto-header-left">
                  <img src={selectedCrypto.image} alt={selectedCrypto.name} className="crypto-header-icon" />
                  <div>
                    <h2>{selectedCrypto.name}</h2>
                    <div className="crypto-header-price">
                      ${selectedCrypto.current_price?.toLocaleString()}
                      <span className={`change ${selectedCrypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                        {selectedCrypto.price_change_percentage_24h >= 0 ? '+' : ''}
                        {selectedCrypto.price_change_percentage_24h?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="crypto-stats">
                  <div className="stat">
                    <div className="stat-label">Market Cap</div>
                    <div className="stat-value">
                      ${(selectedCrypto.market_cap / 1e9).toFixed(2)}B
                    </div>
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
                      ...(chartData.ma7.length > 0 ? [{
                        x: chartData.ma7.map(d => d.x),
                        y: chartData.ma7.map(d => d.y),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'MA 7',
                        line: { color: '#f59e0b', width: 1.5, dash: 'dash' },
                      }] : []),
                      ...(chartData.ma30.length > 0 ? [{
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Crypto;

