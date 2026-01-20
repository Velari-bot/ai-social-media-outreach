
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

async function run() {
    console.log('--- Recent Campaigns (Last 5) ---');
    const snap = await db.collection('creator_requests').orderBy('created_at', 'desc').limit(10).get();
    snap.forEach(doc => {
        const d = doc.data();
        console.log(`ID: ${doc.id}`);
        console.log(`  Name: ${d.name}`);
        console.log(`  Active: ${d.is_active}`);
        console.log(`  Status: ${d.status}`);
        console.log(`  Created: ${d.created_at?.toDate?.()?.toISOString()}`);
        console.log(`  Run Count: ${d.run_count || 0}`);
        console.log(`  Last Run: ${d.last_run_at?.toDate?.()?.toISOString()}`);
        console.log(`  Creators Found: ${d.results_count || 0}`);
        console.log(`  Is Recurring: ${d.is_recurring}`);
    });
}
run();
