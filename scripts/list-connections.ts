
require('dotenv').config({ path: '.env.local' });
const { db } = require('../lib/firebase-admin');

async function list() {
    console.log("Listing gmail_connections...");
    const snap = await db.collection('gmail_connections').limit(10).get();
    snap.forEach(doc => {
        console.log(`ID: ${doc.id}, Data:`, JSON.stringify(doc.data()));
    });
}
list();
