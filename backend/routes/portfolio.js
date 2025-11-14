import express from 'express';
import { db } from '../config/firebaseAdmin.js';

const router = express.Router();

// Check if Firebase is available
const useFirebase = db !== null && db !== undefined;

// In-memory storage as fallback
let portfolios = {};
let leaderboard = [];

// Firebase helper functions
const getPortfolioFromFirebase = async (portfolioId) => {
  if (!useFirebase) return null;
  try {
    const doc = await db.collection('portfolios').doc(portfolioId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Firebase error:', error);
    return null;
  }
};

const getUserPortfoliosFromFirebase = async (userId) => {
  if (!useFirebase) return [];
  try {
    const snapshot = await db.collection('portfolios')
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Firebase error:', error);
    return [];
  }
};

const savePortfolioToFirebase = async (portfolio) => {
  if (!useFirebase) return;
  try {
    await db.collection('portfolios').doc(portfolio.id).set({
      ...portfolio,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase error:', error);
  }
};

const deletePortfolioFromFirebase = async (portfolioId) => {
  if (!useFirebase) return;
  try {
    await db.collection('portfolios').doc(portfolioId).delete();
  } catch (error) {
    console.error('Firebase error:', error);
  }
};

const getLeaderboardFromFirebase = async () => {
  if (!useFirebase) return [];
  try {
    const snapshot = await db.collection('leaderboard')
      .orderBy('totalValue', 'desc')
      .limit(100)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Firebase error:', error);
    return [];
  }
};

const saveLeaderboardEntryToFirebase = async (entry) => {
  if (!useFirebase) return;
  try {
    const entryId = `${entry.userId}_${entry.portfolioId}`;
    await db.collection('leaderboard').doc(entryId).set({
      ...entry,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Firebase error:', error);
  }
};

// Create or update portfolio
router.post('/', async (req, res) => {
  try {
    const { userId, name, holdings } = req.body;
    const portfolioId = `${userId}_${Date.now()}`;
    
    const portfolio = {
      id: portfolioId,
      userId,
      name: name || 'My Portfolio',
      holdings: holdings || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (useFirebase) {
      await savePortfolioToFirebase(portfolio);
    } else {
      portfolios[portfolioId] = portfolio;
    }
    
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user portfolios
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let userPortfolios;
    
    if (useFirebase) {
      userPortfolios = await getUserPortfoliosFromFirebase(userId);
    } else {
      userPortfolios = Object.values(portfolios).filter(
        p => p.userId === userId
      );
    }
    
    res.json(userPortfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard (must be before /:portfolioId route)
router.get('/leaderboard/all', async (req, res) => {
  try {
    let leaderboardData;
    
    if (useFirebase) {
      leaderboardData = await getLeaderboardFromFirebase();
    } else {
      leaderboardData = leaderboard.sort((a, b) => b.totalValue - a.totalValue);
    }
    
    res.json(leaderboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update leaderboard entry
router.post('/leaderboard', async (req, res) => {
  try {
    const { userId, userName, totalValue, portfolioId } = req.body;
    
    const entry = {
      userId,
      userName: userName || `User ${userId}`,
      portfolioId,
      totalValue,
      updatedAt: new Date().toISOString()
    };
    
    if (useFirebase) {
      await saveLeaderboardEntryToFirebase(entry);
    } else {
      const existingIndex = leaderboard.findIndex(e => e.userId === userId && e.portfolioId === portfolioId);
      if (existingIndex >= 0) {
        leaderboard[existingIndex] = entry;
      } else {
        leaderboard.push(entry);
      }
    }
    
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get portfolio by ID
router.get('/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    let portfolio;
    
    if (useFirebase) {
      portfolio = await getPortfolioFromFirebase(portfolioId);
    } else {
      portfolio = portfolios[portfolioId];
    }
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update portfolio
router.put('/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const { name, holdings } = req.body;
    
    let portfolio;
    if (useFirebase) {
      portfolio = await getPortfolioFromFirebase(portfolioId);
    } else {
      portfolio = portfolios[portfolioId];
    }
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    const updatedPortfolio = {
      ...portfolio,
      name: name || portfolio.name,
      holdings: holdings !== undefined ? holdings : portfolio.holdings,
      updatedAt: new Date().toISOString()
    };
    
    if (useFirebase) {
      await savePortfolioToFirebase(updatedPortfolio);
    } else {
      portfolios[portfolioId] = updatedPortfolio;
    }
    
    res.json(updatedPortfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete portfolio
router.delete('/:portfolioId', async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    let portfolio;
    if (useFirebase) {
      portfolio = await getPortfolioFromFirebase(portfolioId);
    } else {
      portfolio = portfolios[portfolioId];
    }
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    if (useFirebase) {
      await deletePortfolioFromFirebase(portfolioId);
    } else {
      delete portfolios[portfolioId];
    }
    
    res.json({ message: 'Portfolio deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as portfolioRoutes };

