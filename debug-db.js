
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkRequests() {
    const snapshot = await db.collection('creator_requests').orderBy('created_at', 'desc').limit(5).get();
    console.log(`Found ${snapshot.size} recent requests:`);
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- Request ID: ${doc.id}`);
        console.log(`  Name: ${data.name}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Results Count: ${data.results_count}`);
        console.log(`  Creator IDs count: ${data.creator_ids ? data.creator_ids.length : 'N/A'}`);
        // Handle both Timestamp and string dates
        const date = data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at);
        console.log(`  Created At: ${date}`);
        console.log('-------------------');
    });
}

checkRequests();
