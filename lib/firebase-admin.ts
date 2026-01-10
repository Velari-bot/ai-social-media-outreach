import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getServiceAccount() {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  // 1. Try individual environment variables (preferred for ease of use)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  // 2. Try the full JSON string
  if (serviceAccountVar) {
    try {
      // Debug info (safe for logs)
      console.log(`FIREBASE_SERVICE_ACCOUNT found. Length: ${serviceAccountVar.length} characters.`);
      if (serviceAccountVar.trim().startsWith('{')) {
        return JSON.parse(serviceAccountVar);
      } else if (serviceAccountVar.length === 1) {
        console.error('FIREBASE_SERVICE_ACCOUNT has length 1. It might be an empty string or a stray quote in .env.local.');
        return null;
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
