import { initializeApp, getApps, cert, App, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getServiceAccount() {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    try {
      // Handle potential double-encoding or stringified JSON
      return JSON.parse(serviceAccountVar);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT environment variable:', e);
      return null;
    }
  }

  // Fallback to local file for development
  try {
    // Using a dynamic require with a variable to sometimes help with bundlers, 
    // but here we just want to try it.
    return require('../ai-social-media-outreach-4e66c-firebase-adminsdk-fbsvc-00b1d928b3.json');
  } catch (e) {
    // In production (Vercel), this is expected to fail if env var is missing
    return null;
  }
}

function initAdmin(): { app: App; db: Firestore; auth: Auth } {
  const apps = getApps();
  if (apps.length > 0) {
    const app = apps[0];
    return {
      app,
      db: getFirestore(app),
      auth: getAuth(app),
    };
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    console.error('CRITICAL: Firebase Service Account not found. Set FIREBASE_SERVICE_ACCOUNT environment variable.');
    // We return null-ish objects, but functions using them will fail.
    // In many cases, it's better to throw here so the error is caught at startup.
    throw new Error('Firebase Admin SDK could not be initialized: Service account missing.');
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id || 'ai-social-media-outreach-4e66c',
  });

  return {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };
}

// Export the initialized instances
const admin = initAdmin();
export const db = admin.db;
export const auth = admin.auth;
export default admin.app;


