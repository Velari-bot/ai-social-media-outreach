
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

async function run() {
    console.log('--- All Campaigns ---');
    const snap = await db.collection('creator_requests').orderBy('created_at', 'desc').get();
    snap.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}, Name: ${d.name}, Active: ${d.is_active}, Status: ${d.status}, CreatedAt: ${d.created_at?.toDate?.()?.toISOString()}`);
    });

    console.log('\n--- Recent Queue Items ---');
    const qSnap = await db.collection('outreach_queue').orderBy('created_at', 'desc').limit(20).get();
    qSnap.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}, Email: ${d.creator_email}, Status: ${d.status}, Campaign: ${d.campaign_id}, CreatedAt: ${d.created_at?.toDate?.()?.toISOString()}`);
    });

    console.log('\n--- Queue Summary ---');
    const statuses = ['pending', 'scheduled', 'sent', 'failed', 'replied'];
    for (const status of statuses) {
        const countSnap = await db.collection('outreach_queue').where('status', '==', status).count().get();
        console.log(`  ${status}: ${countSnap.data().count}`);
    }
}
run();
