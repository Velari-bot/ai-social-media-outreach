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
        .get();

    const stats = {
        scheduled: 0,
        sent: 0,
        failed: 0,
        other: 0
    };

    snapshot.docs.forEach(doc => {
        const s = doc.data().status;
        if (stats[s] !== undefined) stats[s]++;
        else stats.other++;
    });

    console.log(`Queue Summary (${snapshot.size} total items):`);
    console.log(`- Scheduled: ${stats.scheduled}`);
    console.log(`- Sent:      ${stats.sent}`);
    console.log(`- Failed:    ${stats.failed}`);
    console.log(`- Other:     ${stats.other}`);
}

checkQueue().catch(console.error);
