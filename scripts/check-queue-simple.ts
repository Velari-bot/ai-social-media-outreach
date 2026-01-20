
require('dotenv').config({ path: '.env.local' });
const { db } = require('../lib/firebase-admin');

async function check() {
    console.log("Checking queue...");
    const snap = await db.collection('outreach_queue').limit(5).get();
    console.log(`Total queue size (approx): ${snap.size}`);
    snap.forEach(doc => {
        console.log("Item:", doc.data().creator_email);
    });
}
check();
