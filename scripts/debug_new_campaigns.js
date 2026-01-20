
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

async function run() {
    const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000);
    const snap = await db.collection('creator_requests').where('created_at', '>=', halfHourAgo).get();
    console.log('New campaigns in last 30 mins:', snap.size);
    snap.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}, Name: ${d.name}, Active: ${d.is_active}, Created: ${d.created_at?.toDate?.() || d.created_at}`);
    });
}
run();
