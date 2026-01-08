import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App = null!;
let db: Firestore = null!;
let auth: Auth = null!;

if (!getApps().length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e);
      // Fallback or throw
      throw new Error('Failed to initialize Firebase Admin: Invalid service account JSON');
    }
  } else {
    // Attempt local file for development only
    try {
      const serviceAccount = require('../ai-social-media-outreach-4e66c-firebase-adminsdk-fbsvc-00b1d928b3.json');
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (e) {
      console.warn('FIREBASE_SERVICE_ACCOUNT env var not found and local service account file missing.');
      // Allow app to be undefined if we want, but usually we need it
    }
  }

  if (app) {
    db = getFirestore(app);
    auth = getAuth(app);
  }
} else {
  const existingApp = getApps()[0];
  app = existingApp;
  db = getFirestore(existingApp);
  auth = getAuth(existingApp);
}

export { db, auth };
export default app;

