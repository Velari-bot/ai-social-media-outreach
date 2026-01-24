"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
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
            }
            else if (serviceAccountVar.length === 1) {
                console.error('FIREBASE_SERVICE_ACCOUNT has length 1. It might be an empty string or a stray quote in .env.local.');
                return null;
            }
            else {
                console.error('FIREBASE_SERVICE_ACCOUNT does not start with "{". It might be incorrectly copied.');
                return null;
            }
        }
        catch (e) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT. Ensure it is valid JSON.');
            return null;
        }
    }
    return null;
}
function initAdmin() {
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT;
    const apps = (0, app_1.getApps)();
    if (apps.length > 0) {
        const app = apps[0];
        return {
            app,
            db: (0, firestore_1.getFirestore)(app),
            auth: (0, auth_1.getAuth)(app),
        };
    }
    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
        if (isBuildTime || typeof window === 'undefined') {
            console.warn('Firebase Service Account missing during build/init. Using mock mode.');
            // Return a dummy DB that allows chaining but does nothing
            const mockDb = {
                collection: () => mockDb,
                doc: () => mockDb,
                get: async () => ({ exists: false, data: () => ({}) }),
                set: async () => { },
                add: async () => ({ id: 'mock-id' }),
                where: () => mockDb,
                orderBy: () => mockDb,
                limit: () => mockDb,
                startAfter: () => mockDb,
            };
            return { app: null, db: mockDb, auth: null };
        }
        console.error('CRITICAL: FIREBASE_SERVICE_ACCOUNT is missing in environment variables.');
        return { app: null, db: null, auth: null };
    }
    try {
        const app = (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
            projectId: serviceAccount.project_id,
        });
        console.log('Firebase Admin initialized successfully using Service Account.');
        return {
            app,
            db: (0, firestore_1.getFirestore)(app),
            auth: (0, auth_1.getAuth)(app),
        };
    }
    catch (error) {
        console.error('Firebase Admin init error:', error?.message || error);
        return { app: null, db: null, auth: null };
    }
}
const admin = initAdmin();
exports.db = admin.db;
exports.auth = admin.auth;
exports.default = admin.app;
