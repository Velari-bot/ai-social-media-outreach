import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getServiceAccount() {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    try {
      // Debug info (safe for logs)
      console.log(`FIREBASE_SERVICE_ACCOUNT found. Length: ${serviceAccountVar.length} characters.`);
      if (serviceAccountVar.trim().startsWith('{')) {
        return JSON.parse(serviceAccountVar);
      } else {
        console.error('FIREBASE_SERVICE_ACCOUNT does not start with "{". It might be incorrectly copied.');
        return null;
      }
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON.');
      return null;
    }
  }

  return null;
}

function initAdmin(): { app: App | null; db: Firestore | null; auth: Auth | null } {
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT;

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
      console.warn('Firebase Service Account missing during build/init. Using mock mode.');
      return { app: null, db: null, auth: null };
    }

    console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT is missing in environment variables.');
    return { app: null, db: null, auth: null };
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('Firebase Admin initialized successfully using Service Account.');
    return {
      app,
      db: getFirestore(app),
      auth: getAuth(app),
    };
  } catch (error: any) {
    console.error('Firebase Admin init error:', error?.message || error);
    return { app: null, db: null, auth: null };
  }
}

const admin = initAdmin();
export const db = admin.db as Firestore;
export const auth = admin.auth as Auth;
export default admin.app;
