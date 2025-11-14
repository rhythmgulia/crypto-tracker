import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Portfolio operations
export const portfolioService = {
  // Create or update portfolio
  async createPortfolio(portfolioData) {
    const portfolioRef = doc(db, 'portfolios', portfolioData.id);
    await setDoc(portfolioRef, {
      ...portfolioData,
      updatedAt: new Date().toISOString(),
    });
    return portfolioData;
  },

  // Get portfolio by ID
  async getPortfolio(portfolioId) {
    const portfolioRef = doc(db, 'portfolios', portfolioId);
    const portfolioSnap = await getDoc(portfolioRef);
    if (portfolioSnap.exists()) {
      return { id: portfolioSnap.id, ...portfolioSnap.data() };
    }
    return null;
  },

  // Get all portfolios for a user
  async getUserPortfolios(userId) {
    const portfoliosRef = collection(db, 'portfolios');
    const q = query(portfoliosRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Update portfolio
  async updatePortfolio(portfolioId, updates) {
    const portfolioRef = doc(db, 'portfolios', portfolioId);
    await updateDoc(portfolioRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await this.getPortfolio(portfolioId);
  },

  // Delete portfolio
  async deletePortfolio(portfolioId) {
    const portfolioRef = doc(db, 'portfolios', portfolioId);
    await deleteDoc(portfolioRef);
  },
};

// Leaderboard operations
export const leaderboardService = {
  // Update leaderboard entry
  async updateEntry(entryData) {
    const entryId = `${entryData.userId}_${entryData.portfolioId}`;
    const entryRef = doc(db, 'leaderboard', entryId);
    await setDoc(entryRef, {
      ...entryData,
      updatedAt: new Date().toISOString(),
    });
    return entryData;
  },

  // Get leaderboard (top entries)
  async getLeaderboard(limitCount = 100) {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(
      leaderboardRef, 
      orderBy('totalValue', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
};

