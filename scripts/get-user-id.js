const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            // Remove surrounding quotes if present
            value = value.replace(/^["'](.*)["']$/, '$1');
            process.env[key.trim()] = value;
        }
    });
}

function getServiceAccount() {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
        try {
            return JSON.parse(serviceAccountVar);
        } catch (e) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT');
            return null;
        }
    }
    return null;
}

const serviceAccount = getServiceAccount();

if (!serviceAccount) {
    console.error('Could not load service account from .env.local');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function getUser() {
    const email = 'benderaiden826@gmail.com';
    console.log(`Looking for user with email: ${email}`);

    // Try user_accounts first (Source of Truth)
    let snapshot = await db.collection('user_accounts').where('email', '==', email).get();

    if (snapshot.empty) {
        // Try users collection
        snapshot = await db.collection('users').where('email', '==', email).get();
    }

    if (snapshot.empty) {
        console.log('No user found.');
        return;
    }

    snapshot.forEach(doc => {
        console.log(`User ID: ${doc.id}`);
    });
}

getUser().catch(console.error);
