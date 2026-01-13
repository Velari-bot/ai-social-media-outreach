const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Load Environment Variables
const envPath = path.resolve(__dirname, '.env.local');
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

// 2. Initialize Firebase
if (!admin.apps.length) {
    // Try to get service account from env
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount;

    if (serviceAccountVar) {
        try {
            if (serviceAccountVar.trim().startsWith('{')) {
                serviceAccount = JSON.parse(serviceAccountVar);
            }
        } catch (e) {
            console.error('Error parsing FIREBASE_SERVICE_ACCOUNT', e);
            process.exit(1);
        }
    }

    if (!serviceAccount) {
        console.error('FIREBASE_SERVICE_ACCOUNT missing or invalid.');
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const CLAY_WEBHOOK_URL = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-2f50d72c-37c4-4ef0-86e9-f36fd3897aac';

// 3. Main Backfill Function
async function backfillCreators() {
    console.log('🔄 Starting backfill of creators to Clay...');

    try {
        const snapshot = await db.collection('creators').get();
        if (snapshot.empty) {
            console.log('No creators found in database.');
            return;
        }

        console.log(`Found ${snapshot.size} creators. Processing...`);

        let successCount = 0;
        let failCount = 0;

        // Process in chunks or sequentially to be polite to the API
        const docs = snapshot.docs;

        for (const doc of docs) {
            const data = doc.data();
            const basicData = data.basic_profile_data || {};

            // Map to Clay Schema
            const payload = {
                "verality_id": doc.id,
                "creator_name": data.full_name || basicData.fullname || basicData.full_name || data.handle || "Unknown",
                "platform": data.platform || "instagram",
                "username": data.handle || basicData.username,
                "profile_url": data.profile_url || basicData.profile_url || basicData.url || constructProfileUrl(data.platform || 'instagram', data.handle),
                "niche": data.niche || "",
                "followers": Number(data.followers || basicData.followers || 0),
                "bio": data.bio || basicData.biography || basicData.bio || "",
                "website": data.website || basicData.external_url || basicData.website || "",
                "user_id": data.user_id || "",
                "backfill": true // Flag to identify these rows
            };

            try {
                const response = await fetch(CLAY_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    process.stdout.write('.'); // Success dot
                    successCount++;
                } else {
                    process.stdout.write('x'); // Fail x
                    failCount++;
                    // console.error(`\nFailed for ${doc.id}: ${response.status}`);
                }
            } catch (err) {
                process.stdout.write('E');
                failCount++;
                console.error(`\nError sending ${doc.id}:`, err.message);
            }

            // Small delay to prevent rate limiting
            await new Promise(r => setTimeout(r, 100));
        }

        console.log(`\n\n✅ Backfill Complete!`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (error) {
        console.error('Fatal error during backfill:', error);
    }
}

function constructProfileUrl(platform, handle) {
    if (!handle) return "";
    const h = handle.replace(/^@/, '');
    switch ((platform || '').toLowerCase()) {
        case 'youtube': return `https://www.youtube.com/@${h}`;
        case 'instagram': return `https://www.instagram.com/${h}`;
        case 'tiktok': return `https://www.tiktok.com/@${h}`;
        default: return `https://${platform}.com/${h}`;
    }
}

backfillCreators().then(() => process.exit(0));
