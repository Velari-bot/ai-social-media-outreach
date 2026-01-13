const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

// Initialize Firebase
if (!admin.apps.length) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount;

    if (serviceAccountVar) {
        try {
            serviceAccount = JSON.parse(serviceAccountVar);
        } catch (e) {
            console.error('Error parsing service account', e);
            process.exit(1);
        }
    }

    if (!serviceAccount) {
        console.error('No service account found');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function countCreators() {
    try {
        const snapshot = await db.collection('creators').count().get();
        console.log(`Total creators in DB: ${snapshot.data().count}`);

        // Count unenriched
        // Note: 'enrichment_status' might not exist on old records
        const enrichedSnapshot = await db.collection('creators')
            .where('enrichment_status', '==', 'enriched')
            .count().get();

        console.log(`Enriched creators: ${enrichedSnapshot.data().count}`);

    } catch (error) {
        console.error('Error counting:', error);
    } finally {
        process.exit(0);
    }
}

countCreators();
