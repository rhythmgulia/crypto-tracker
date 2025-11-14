import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Coins, BarChart3, Briefcase, Trophy } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: TrendingUp },
    { path: '/crypto', label: 'Crypto', icon: Coins },
    { path: '/stocks', label: 'Stocks', icon: BarChart3 },
    { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <TrendingUp size={24} />
          <span>FinTracker</span>
        </Link>
        <div className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

