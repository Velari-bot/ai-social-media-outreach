const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key] = value;
        }
    });
}

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT not found in .env.local');
    process.exit(1);
}

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function setupTestCreator() {
    const creatorId = 'test_001';
    console.log(`Checking if creator ${creatorId} exists...`);

    const docRef = db.collection('creators').doc(creatorId);
    const doc = await docRef.get();

    if (!doc.exists) {
        console.log(`Creating test creator ${creatorId}...`);
        await docRef.set({
            verality_id: creatorId,
            full_name: 'Alex Johnson',
            company: 'Creators Inc',
            title: 'Content Creator',
            username: 'alexcreates',
            platform: 'instagram',
            created_at: new Date().toISOString()
        });
        console.log('✅ Test creator created.');
    } else {
        console.log('ℹ️ Test creator already exists.');
    }

    console.log('Current Data:', (await docRef.get()).data());
}

setupTestCreator().catch(console.error);
