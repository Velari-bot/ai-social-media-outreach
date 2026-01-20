
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

async function run() {
    console.log('--- Outreach Queue ---');
    const qSnap = await db.collection('outreach_queue').get();
    const qStats = {};
    qSnap.forEach(doc => {
        const s = doc.data().status || 'unknown';
        qStats[s] = (qStats[s] || 0) + 1;
    });
    console.log('Queue Statuses:', qStats);

    console.log('\n--- Email Threads ---');
    const tSnap = await db.collection('email_threads').get();
    const tStats = {};
    tSnap.forEach(doc => {
        const s = doc.data().status || 'unknown';
        tStats[s] = (tStats[s] || 0) + 1;
    });
    console.log('Thread Statuses:', tStats);
}
run();
