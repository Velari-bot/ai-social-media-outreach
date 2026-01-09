import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getServiceAccount() {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    try {
      return JSON.parse(serviceAccountVar);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e);
      return null;
    }
  }

  // Fallback for local development
  // We use a try-catch with a dynamic import-like check to avoid Webpack build errors on Vercel
  return null;
}

function initAdmin(): { app: App | null; db: Firestore | null; auth: Auth | null } {
  // During build time on Vercel, we might not have env vars. 
  // We shouldn't crash the build if we are just collecting page data.
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

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
    if (isBuildTime) {
      console.warn('Firebase Service Account missing during build time. Skipping initialization.');
      return { app: null, db: null, auth: null };
    }

    // In production runtime, this is still a critical error
    console.error('CRITICAL: Firebase Service Account not found. Set FIREBASE_SERVICE_ACCOUNT environment variable.');
    return { app: null, db: null, auth: null };
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'ai-social-media-outreach-4e66c',
    });

    return {
      app,
      db: getFirestore(app),
      auth: getAuth(app),
    };
  } catch (error) {
    console.error('Firebase Admin init error:', error);
    return { app: null, db: null, auth: null };
  }
}

const admin = initAdmin();
export const db = admin.db as Firestore;
export const auth = admin.auth as Auth;
export default admin.app;
