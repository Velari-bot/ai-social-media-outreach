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
            return null;
        }
    }
    return null;
}

const serviceAccount = getServiceAccount();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkQueue() {
    const userId = 'T9SdK4kxEuZSaqZsVoWtkz27kTy2';
    console.log(`Checking queue for user: ${userId}`);

    const snapshot = await db.collection('outreach_queue')
        .where('user_id', '==', userId)
        .limit(20)
        .get();

    if (snapshot.empty) {
        console.log('No queue items found.');
        return;
    }

    console.log(`Found ${snapshot.size} recent queue items:`);
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  To: ${data.creator_email}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Sent At: ${data.sent_at ? data.sent_at.toDate() : 'N/A'}`);
        console.log(`  Error: ${data.last_error || 'None'}`);
        console.log(`  ThreadID: ${data.gmail_thread_id || 'N/A'}`);
        console.log('---');
    });
}

checkQueue().catch(console.error);
