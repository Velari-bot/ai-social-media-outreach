import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config - you'll need to add your Firebase web config here
// Get this from Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ai-social-media-outreach-4e66c.firebaseapp.com',
  projectId: 'ai-social-media-outreach-4e66c',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ai-social-media-outreach-4e66c.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Check if we have valid Firebase config (API key is required)
const hasValidConfig = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;

if (typeof window !== 'undefined' && hasValidConfig) {
  try {
    // Client-side initialization
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch(console.error);
      db = getFirestore(app);
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch(console.error);
      db = getFirestore(app);
    }
  } catch (error: any) {
    console.error('Firebase initialization error:', error);
    // Don't throw - allow app to continue without Firebase
    // But log a helpful message
    if (error?.message?.includes('API key') || error?.code === 'auth/invalid-api-key') {
      console.warn('⚠️ Firebase API key appears to be invalid. Please check your .env.local file. See FIREBASE_SETUP.md for instructions.');
    }
    app = null;
    auth = null;
    db = null;
  }
} else if (typeof window !== 'undefined') {
  console.warn('⚠️ Firebase is not configured. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file. See FIREBASE_SETUP.md for instructions.');
}

export { app, auth, db };

