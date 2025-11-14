# Firebase Setup Guide

This guide will help you set up Firebase for persistent data storage in the Crypto & Stock Market Tracker application.

## Prerequisites

1. A Google account
2. Node.js installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "crypto-stock-tracker")
4. Follow the setup wizard
5. Enable Google Analytics (optional)

## Step 2: Enable Firestore Database

1. In your Firebase project, go to **Build** > **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Enable"

### Set up Firestore Security Rules (Important!)

Go to **Firestore Database** > **Rules** and update the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Portfolios collection
    match /portfolios/{portfolioId} {
      allow read, write: if request.auth != null || true; // For development - restrict in production
    }
    
    // Leaderboard collection
    match /leaderboard/{entryId} {
      allow read: if true; // Public read
      allow write: if request.auth != null || true; // For development - restrict in production
    }
  }
}
```

**Note:** The rules above allow public access for development. For production, implement proper authentication and security rules.

## Step 3: Get Firebase Configuration

### For Frontend (Web App)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

It will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### For Backend (Service Account)

1. In Firebase Console, go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)
4. Copy the contents of this file

## Step 4: Configure Frontend

1. Create a `.env` file in the `frontend` directory:

```bash
cd frontend
touch .env
```

2. Add your Firebase config to `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

3. Update `frontend/src/config/firebase.js` if needed (it should read from env vars automatically)

## Step 5: Configure Backend

1. Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

2. Add your Firebase credentials to `.env`:

**Option A: Using individual credentials (recommended)**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**Option B: Using service account JSON (alternative)**
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**Important:** 
- The private key should include `\n` characters for newlines
- Wrap the private key in quotes
- For the service account JSON, escape it properly or use single quotes

## Step 6: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Step 7: Test the Setup

1. Start the backend:
```bash
cd backend
npm start
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Create a portfolio in the app
4. Check Firebase Console > Firestore Database to see if data appears

## Troubleshooting

### "Firebase Admin not configured" message
- Check that your `.env` file exists in the `backend` directory
- Verify all environment variables are set correctly
- Make sure the private key includes `\n` for newlines
- Restart the backend server after changing `.env`

### "Permission denied" errors
- Check your Firestore security rules
- Make sure you've enabled Firestore Database
- Verify your Firebase project ID is correct

### Frontend can't connect to Firebase
- Check that all environment variables start with `VITE_`
- Restart the Vite dev server after changing `.env`
- Verify your Firebase config values are correct

## Production Considerations

1. **Security Rules**: Update Firestore rules to require authentication
2. **Authentication**: Implement Firebase Authentication for user management
3. **Environment Variables**: Use secure environment variable management (not committed to git)
4. **Service Account**: Keep service account keys secure and never commit them
5. **Rate Limiting**: Consider implementing rate limiting for API calls

## Current Implementation

The application currently uses:
- **In-memory storage** as fallback if Firebase is not configured
- **Firebase Firestore** when properly configured
- Automatic fallback ensures the app works even without Firebase setup

This allows you to:
- Develop and test without Firebase initially
- Add Firebase when ready for persistent storage
- Switch between storage methods seamlessly

