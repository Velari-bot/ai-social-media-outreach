const admin = require('firebase-admin');
const dotenv = require('dotenv');
const { cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Init Firebase
function init() {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        serviceAccount = {
            project_id: process.env.FIREBASE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };
    } else if (serviceAccountVar) {
        serviceAccount = JSON.parse(serviceAccountVar);
    }

    if (!serviceAccount) {
        console.error('No service account found in env');
        process.exit(1);
    }

    admin.initializeApp({
        credential: cert(serviceAccount)
    });

    return getFirestore();
}

const db = init();

async function debugStats() {
    console.log('--- DEBUG START ---');

    // 1. Find User
    const usersSnap = await db.collection('user_accounts').get();
    let targetUser = null;
    let targetEmail = 'benderaiden'; // heuristic

    usersSnap.forEach(doc => {
        const d = doc.data();
        // console.log(d.email);
        if (d.email && d.email.includes(targetEmail)) {
            targetUser = doc.id;
            console.log(`Found User: ${d.email} (ID: ${doc.id})`);
        }
    });

    if (!targetUser) {
        console.log('User not found. Listing first 3 users:');
        let count = 0;
        usersSnap.forEach(doc => {
            if (count < 3) console.log(doc.id, doc.data().email);
            count++;
        });
        return;
    }

    // 2. Query Creator Requests
    const reqSnap = await db.collection('creator_requests')
        .where('user_id', '==', targetUser)
        .get();

    console.log(`\nCreator Requests Found: ${reqSnap.size}`);
    let totalFound = 0;
    reqSnap.forEach(doc => {
        const d = doc.data();
        console.log(`- Req ${doc.id.substring(0, 5)}...: results_count=${d.results_count}, status=${d.status}, created=${d.created_at?.toDate ? d.created_at.toDate() : d.created_at}`);
        totalFound += (d.results_count || 0);
    });
    console.log(`Total 'results_count' sum: ${totalFound}`);

    // 3. Query Campaigns (Alternative Source?)
    const campSnap = await db.collection('campaigns')
        .where('user_id', '==', targetUser)
        .get();

    console.log(`\nCampaigns Found: ${campSnap.size}`);
    let campFound = 0;
    campSnap.forEach(doc => {
        const d = doc.data();
        console.log(`- Camp ${doc.id.substring(0, 5)}...: found_creators=${d.found_creators}, name=${d.name}`);
        campFound += (d.found_creators || 0);
    });
    console.log(`Total 'found_creators' sum: ${campFound}`);

}

debugStats();
