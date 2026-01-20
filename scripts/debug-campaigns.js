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

async function debugCampaigns() {
    const userId = 'T9SdK4kxEuZSaqZsVoWtkz27kTy2';
    console.log(`Debugging campaigns for user: ${userId}`);

    // 1. Check Campaigns
    const campaignsSnapshot = await db.collection('creator_requests')
        .where('user_id', '==', userId)
        .get();

    console.log(`Found ${campaignsSnapshot.size} campaigns.`);

    for (const doc of campaignsSnapshot.docs) {
        const data = doc.data();
        console.log(`\nCampaign: ${data.name} (ID: ${doc.id})`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Ref Results Count: ${data.results_count}`);
        console.log(`  In-Memory Creator IDs: ${data.creator_ids ? data.creator_ids.length : 'MISSING (or undefined)'}`);

        if (data.creator_ids && data.creator_ids.length > 0) {
            // Check if these creators are in the queue
            const sampleId = data.creator_ids[0];
            console.log(`  Sample Creator ID: ${sampleId}`);

            // Check outreach_queue for this creator
            const qSnap = await db.collection('outreach_queue')
                .where('user_id', '==', userId)
                .where('creator_id', '==', sampleId)
                .get();

            if (qSnap.empty) {
                console.log(`  ❌ Sample creator NOT found in outreach_queue! (Recovery needed)`);
            } else {
                const qData = qSnap.docs[0].data();
                console.log(`  ✅ Found in queue. Status: ${qData.status}. Sent At: ${qData.sent_at?.toDate()}`);
                console.log(`     Error: ${qData.last_error || 'None'}`);
            }
        }
    }
}

debugCampaigns().catch(console.error);
