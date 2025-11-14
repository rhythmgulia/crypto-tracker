import { useState, useEffect } from 'react';
import { portfolioAPI } from '../services/api';
import { Trophy, Medal, Award } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await portfolioAPI.getLeaderboard();
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="gold" />;
    if (index === 1) return <Medal className="silver" />;
    if (index === 2) return <Award className="bronze" />;
    return <span className="rank-number">{index + 1}</span>;
  };

  const getRankClass = (index) => {
    if (index === 0) return 'rank-first';
    if (index === 1) return 'rank-second';
    if (index === 2) return 'rank-third';
    return '';
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <Trophy size={32} className="trophy-icon" />
        <h1 className="page-title">Portfolio Leaderboard</h1>
      </div>
      <p className="leaderboard-subtitle">
        Compete with other traders and see who has the highest portfolio value!
      </p>

      {leaderboard.length > 0 ? (
        <div className="leaderboard-container">
          <div className="leaderboard-list">
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.userId}_${entry.portfolioId}`}
                className={`leaderboard-item ${getRankClass(index)}`}
              >
                <div className="rank-section">
                  {getRankIcon(index)}
                </div>
                <div className="user-section">
                  <div className="user-name">{entry.userName}</div>
                  <div className="user-id">Portfolio #{entry.portfolioId.slice(-6)}</div>
                </div>
                <div className="value-section">
                  <div className="value-label">Portfolio Value</div>
                  <div className="value-amount">
                    ${entry.totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="empty-leaderboard">
              <p>No portfolios on the leaderboard yet.</p>
              <p>Create a portfolio and add holdings to compete!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-leaderboard">
          <Trophy size={64} className="empty-icon" />
          <p>No portfolios on the leaderboard yet.</p>
          <p>Create a portfolio and add holdings to compete!</p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

