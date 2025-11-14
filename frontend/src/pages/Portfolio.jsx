import { useState, useEffect } from 'react';
import { portfolioAPI, cryptoAPI, stockAPI } from '../services/api';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import './Portfolio.css';

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newHolding, setNewHolding] = useState({ type: 'crypto', symbol: '', quantity: '' });

  // Get or create userId
  const getUserId = () => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = 'user_' + Date.now();
      localStorage.setItem('userId', storedUserId);
    }
    return storedUserId;
  };
  
  const userId = getUserId();

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      calculatePortfolioValue();
      const interval = setInterval(calculatePortfolioValue, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      const response = await portfolioAPI.getUserPortfolios(userId);
      setPortfolios(response.data);
      if (response.data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    }
  };

  const calculatePortfolioValue = async () => {
    if (!selectedPortfolio || !selectedPortfolio.holdings.length) {
      setPortfolioValue({ 
        total: 0, 
        totalPurchase: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        holdings: [] 
      });
      return;
    }

    try {
      const holdingsData = await Promise.all(
        selectedPortfolio.holdings.map(async (holding) => {
          try {
            let currentPrice = 0;
            if (holding.type === 'crypto') {
              const response = await cryptoAPI.getById(holding.symbol.toLowerCase());
              currentPrice = response.data.market_data?.current_price?.usd || 0;
            } else {
              const response = await stockAPI.getQuote(holding.symbol);
              if (response.data?.['Global Quote']) {
                currentPrice = parseFloat(response.data['Global Quote']['05. price'] || 0);
              }
            }

            const currentValue = currentPrice * holding.quantity;
            const purchaseValue = holding.purchasePrice * holding.quantity;
            const gainLoss = currentValue - purchaseValue;
            const gainLossPercent = ((gainLoss / purchaseValue) * 100);

            return {
              ...holding,
              currentPrice,
              currentValue,
              purchaseValue,
              gainLoss,
              gainLossPercent,
            };
          } catch (error) {
            console.error(`Error fetching price for ${holding.symbol}:`, error);
            return {
              ...holding,
              currentPrice: holding.purchasePrice,
              currentValue: holding.purchasePrice * holding.quantity,
              purchaseValue: holding.purchasePrice * holding.quantity,
              gainLoss: 0,
              gainLossPercent: 0,
            };
          }
        })
      );

      const total = holdingsData.reduce((sum, h) => sum + h.currentValue, 0);
      const totalPurchase = holdingsData.reduce((sum, h) => sum + h.purchaseValue, 0);
      const totalGainLoss = total - totalPurchase;
      const totalGainLossPercent = totalPurchase > 0 ? ((totalGainLoss / totalPurchase) * 100) : 0;

      setPortfolioValue({
        total,
        totalPurchase,
        totalGainLoss,
        totalGainLossPercent,
        holdings: holdingsData,
      });

      // Update leaderboard
      if (total > 0) {
        await portfolioAPI.updateLeaderboard({
          userId,
          userName: `User ${userId.slice(-4)}`,
          totalValue: total,
          portfolioId: selectedPortfolio.id,
        });
      }
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      // Set default values on error
      setPortfolioValue({ 
        total: 0, 
        totalPurchase: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        holdings: selectedPortfolio?.holdings || [] 
      });
    }
  };

  const createPortfolio = async () => {
    if (!newPortfolioName.trim()) {
      alert('Please enter a portfolio name');
      return;
    }

    setLoading(true);
    try {
      const response = await portfolioAPI.create({
        userId,
        name: newPortfolioName,
        holdings: [],
      });
      setPortfolios([...portfolios, response.data]);
      setSelectedPortfolio(response.data);
      setNewPortfolioName('');
      setShowModal(false);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      console.error('Error response:', error.response);
      
      // Use enhanced error message from interceptor if available
      let errorMessage = error.userMessage;
      
      if (!errorMessage) {
        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error') || !error.response) {
          errorMessage = 'Cannot connect to the server. Please make sure the backend server is running on port 5001.\n\nTo start the backend:\n1. Open a terminal\n2. cd backend\n3. npm start';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.status) {
          errorMessage = `Server error (${error.response.status}): ${error.response.statusText || 'Unknown error'}`;
        } else {
          errorMessage = error.message || 'Unknown error';
        }
      }
      
      alert(`Failed to create portfolio:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async () => {
    if (!newHolding.symbol || !newHolding.quantity || !selectedPortfolio) {
      alert('Please enter both symbol and quantity.');
      return;
    }

    if (parseFloat(newHolding.quantity) <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    try {
      let purchasePrice = 0;
      let symbol = newHolding.symbol.trim();
      
      if (newHolding.type === 'crypto') {
        symbol = symbol.toLowerCase();
        try {
          const response = await cryptoAPI.getById(symbol);
          purchasePrice = response.data.market_data?.current_price?.usd || 0;
          
          if (!purchasePrice) {
            alert(`Could not find cryptocurrency "${symbol}". Please check the symbol.\n\nCommon examples: bitcoin, ethereum, tether, binancecoin`);
            return;
          }
        } catch (error) {
          console.error('Crypto API error:', error);
          if (error.response?.status === 404 || error.response?.status === 400) {
            alert(`Cryptocurrency "${symbol}" not found. Please check the symbol.\n\nCommon examples: bitcoin, ethereum, tether, binancecoin`);
          } else if (error.response?.status === 429) {
            alert('API rate limit exceeded. Please wait a moment and try again.');
          } else {
            alert(`Error fetching price for ${symbol}: ${error.response?.data?.error || error.message}`);
          }
          return;
        }
      } else {
        symbol = symbol.toUpperCase();
        try {
          const response = await stockAPI.getQuote(symbol);
          if (response.data?.['Global Quote']) {
            purchasePrice = parseFloat(response.data['Global Quote']['05. price'] || 0);
          } else if (response.data?.['Error Message']) {
            alert(`Stock symbol "${symbol}" not found. ${response.data['Error Message']}`);
            return;
          } else if (response.data?.['Note']) {
            alert('Alpha Vantage API rate limit exceeded. Please wait a moment or use a valid API key.');
            return;
          }
          
          if (!purchasePrice || purchasePrice === 0) {
            alert(`Could not fetch price for stock "${symbol}". Please check the symbol.\n\nCommon examples: AAPL, MSFT, GOOGL, TSLA`);
            return;
          }
        } catch (error) {
          console.error('Stock API error:', error);
          if (error.response?.status === 404 || error.response?.status === 400) {
            alert(`Stock symbol "${symbol}" not found. Please check the symbol.\n\nCommon examples: AAPL, MSFT, GOOGL, TSLA`);
          } else if (error.response?.status === 429) {
            alert('Alpha Vantage API rate limit exceeded. Please wait a moment or use a valid API key.');
          } else {
            alert(`Error fetching price for ${symbol}: ${error.response?.data?.error || error.message}`);
          }
          return;
        }
      }

      const holding = {
        type: newHolding.type,
        symbol: symbol,
        quantity: parseFloat(newHolding.quantity),
        purchasePrice,
      };

      const updatedHoldings = [...selectedPortfolio.holdings, holding];
      const response = await portfolioAPI.update(selectedPortfolio.id, {
        holdings: updatedHoldings,
      });

      setSelectedPortfolio(response.data);
      setNewHolding({ type: 'crypto', symbol: '', quantity: '' });
    } catch (error) {
      console.error('Error adding holding:', error);
      if (error.response?.status === 404) {
        alert('Portfolio not found. Please refresh the page.');
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again.');
      } else {
        alert(`Failed to add holding: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const removeHolding = async (index) => {
    if (!selectedPortfolio) return;

    const updatedHoldings = selectedPortfolio.holdings.filter((_, i) => i !== index);
    try {
      const response = await portfolioAPI.update(selectedPortfolio.id, {
        holdings: updatedHoldings,
      });
      setSelectedPortfolio(response.data);
    } catch (error) {
      console.error('Error removing holding:', error);
    }
  };

  const deletePortfolio = async (portfolioId) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await portfolioAPI.delete(portfolioId);
      const updated = portfolios.filter(p => p.id !== portfolioId);
      setPortfolios(updated);
      if (selectedPortfolio?.id === portfolioId) {
        setSelectedPortfolio(updated.length > 0 ? updated[0] : null);
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
    }
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <h1 className="page-title">My Portfolios</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Portfolio
        </button>
      </div>

      <div className="portfolio-content">
        <div className="portfolio-sidebar">
          <h2>Portfolios</h2>
          <div className="portfolio-list">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className={`portfolio-item ${selectedPortfolio?.id === portfolio.id ? 'active' : ''}`}
                onClick={() => setSelectedPortfolio(portfolio)}
              >
                <div className="portfolio-item-info">
                  <div className="portfolio-item-name">{portfolio.name}</div>
                  <div className="portfolio-item-count">
                    {portfolio.holdings.length} holdings
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePortfolio(portfolio.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {portfolios.length === 0 && (
              <div className="empty-portfolio">
                <p>No portfolios yet. Create one to get started!</p>
              </div>
            )}
          </div>
        </div>

        <div className="portfolio-main">
          {selectedPortfolio ? (
            <>
              <div className="portfolio-summary">
                <h2>{selectedPortfolio.name}</h2>
                {portfolioValue && (
                  <div className="portfolio-value">
                    <div className="value-main">
                      <div className="value-label">Total Value</div>
                      <div className="value-amount">
                        ${(portfolioValue.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className={`value-change ${(portfolioValue.totalGainLoss || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(portfolioValue.totalGainLoss || 0) >= 0 ? (
                        <TrendingUp size={20} />
                      ) : (
                        <TrendingDown size={20} />
                      )}
                      <div>
                        <div className="change-amount">
                          ${Math.abs(portfolioValue.totalGainLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="change-percent">
                          {(portfolioValue.totalGainLossPercent || 0) >= 0 ? '+' : ''}
                          {(portfolioValue.totalGainLossPercent || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="add-holding">
                <h3>Add Holding</h3>
                <div className="holding-form">
                  <select
                    value={newHolding.type}
                    onChange={(e) => setNewHolding({ ...newHolding, type: e.target.value })}
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                  </select>
                  <input
                    type="text"
                    placeholder={newHolding.type === 'crypto' ? "Symbol (e.g., bitcoin, ethereum)" : "Symbol (e.g., AAPL, MSFT)"}
                    value={newHolding.symbol}
                    onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addHolding()}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newHolding.quantity}
                    onChange={(e) => setNewHolding({ ...newHolding, quantity: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && addHolding()}
                    min="0.00000001"
                    step="0.00000001"
                  />
                  <button className="btn-primary" onClick={addHolding}>
                    Add
                  </button>
                </div>
                <div className="holding-hint">
                  {newHolding.type === 'crypto' ? (
                    <p>💡 Examples: bitcoin, ethereum, tether, binancecoin, solana, cardano</p>
                  ) : (
                    <p>💡 Examples: AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA</p>
                  )}
                </div>
              </div>

              <div className="holdings-list">
                <h3>Holdings</h3>
                {portfolioValue?.holdings.length > 0 ? (
                  <div className="holdings-table">
                    <div className="table-header">
                      <div>Asset</div>
                      <div>Quantity</div>
                      <div>Purchase Price</div>
                      <div>Current Price</div>
                      <div>Value</div>
                      <div>Gain/Loss</div>
                      <div>Action</div>
                    </div>
                    {portfolioValue.holdings.map((holding, index) => (
                      <div key={index} className="table-row">
                        <div className="asset-cell">
                          <span className="asset-type">{holding.type}</span>
                          <span className="asset-symbol">{holding.symbol.toUpperCase()}</span>
                        </div>
                        <div>{holding.quantity}</div>
                        <div>${(holding.purchasePrice || 0).toFixed(2)}</div>
                        <div>${(holding.currentPrice || 0).toFixed(2)}</div>
                        <div>${(holding.currentValue || 0).toFixed(2)}</div>
                        <div className={`gain-loss ${(holding.gainLoss || 0) >= 0 ? 'positive' : 'negative'}`}>
                          {(holding.gainLoss || 0) >= 0 ? '+' : ''}${(holding.gainLoss || 0).toFixed(2)}
                          <span className="percent">
                            ({(holding.gainLossPercent || 0) >= 0 ? '+' : ''}{(holding.gainLossPercent || 0).toFixed(2)}%)
                          </span>
                        </div>
                        <div>
                          <button
                            className="remove-btn"
                            onClick={() => removeHolding(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-holdings">
                    <p>No holdings yet. Add some assets to track your portfolio!</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-portfolio-main">
              <p>Select a portfolio or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Portfolio</h2>
            <input
              type="text"
              placeholder="Portfolio name"
              value={newPortfolioName}
              onChange={(e) => setNewPortfolioName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && newPortfolioName.trim()) {
                  createPortfolio();
                }
              }}
              disabled={loading}
              autoFocus
            />
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={createPortfolio}
                disabled={loading || !newPortfolioName.trim()}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;

