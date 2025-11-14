import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
// Option 1: Using service account (recommended for production)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with service account');
  } catch (error) {
    console.error('Error initializing Firebase Admin with service account:', error.message);
  }
} 
// Option 2: Using individual credentials
else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    });
    console.log('Firebase Admin initialized with credentials');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
  }
} 
// Option 3: Using default credentials (for Firebase emulator or GCP)
else {
  try {
    admin.initializeApp();
    console.log('Firebase Admin initialized with default credentials');
  } catch (error) {
    console.log('Firebase Admin not configured. Using in-memory storage.');
    console.log('To enable Firebase, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env');
  }
}

let db = null;
try {
  if (admin.apps.length > 0) {
    db = admin.firestore();
  }
} catch (error) {
  console.log('Firestore not available');
}

export { db };
export default admin;

