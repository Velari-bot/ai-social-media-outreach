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

async function recoverQueue() {
    const userId = 'T9SdK4kxEuZSaqZsVoWtkz27kTy2';

    // 1. Check Account Limits
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    const userData = userDoc.data();
    console.log(`Plan: ${userData.plan}, Quota: ${userData.email_quota_daily}, Used: ${userData.email_used_today}`);
    let creditsAvailable = Math.max(0, userData.email_quota_daily - userData.email_used_today);

    if (creditsAvailable <= 0) {
        console.log('User has 0 credits remaining today. Cannot recover queue.');
        return;
    }

    // 2. Fetch all campaign creator IDs
    console.log('Fetching campaigns...');
    const campaigns = await db.collection('creator_requests')
        .where('user_id', '==', userId)
        .where('status', 'in', ['in_progress', 'searching', 'delivered', 'completed'])
        .get();

    const allCreatorIds = []; // Array of { id, campaignId, campaignName }
    campaigns.forEach(doc => {
        const cIds = doc.data().creator_ids || [];
        cIds.forEach(id => allCreatorIds.push({ id, campaignId: doc.id, campaignName: doc.data().name }));
    });
    console.log(`Found ${allCreatorIds.length} total creators across ${campaigns.size} campaigns.`);

    // 3. Fetch current queue to find missing
    console.log('Fetching existing queue...');
    const queueSnap = await db.collection('outreach_queue')
        .where('user_id', '==', userId)
        .select('creator_id')
        .get();

    const queuedCreatorIds = new Set(queueSnap.docs.map(d => d.data().creator_id));
    const missingCreators = allCreatorIds.filter(item => !queuedCreatorIds.has(item.id));

    console.log(`Missing from Queue: ${missingCreators.length}`);

    if (missingCreators.length === 0) {
        console.log('All creators are already queued or processed.');
        return;
    }

    // 4. Recover logic
    console.log('Attempting to recover missing items...');

    // De-duplicate missing IDs (in case same creator found in multiple campaigns? likely not but good safe guard)
    const uniqueMissing = [];
    const seenMissing = new Set();
    missingCreators.forEach(m => {
        if (!seenMissing.has(m.id)) {
            seenMissing.add(m.id);
            uniqueMissing.push(m);
        }
    });

    // Limit by available credits
    console.log(`Credits available: ${creditsAvailable}. Missing items: ${uniqueMissing.length}`);
    const toProcess = uniqueMissing.slice(0, creditsAvailable);

    if (toProcess.length < uniqueMissing.length) {
        console.log(`Note: Only processing first ${toProcess.length} items due to daily quota.`);
    }

    // Fetch creator details
    const creatorsToQueue = [];
    const chunks = [];
    for (let i = 0; i < toProcess.length; i += 10) chunks.push(toProcess.slice(i, i + 10)); // chunk 10 for getAll

    for (const chunk of chunks) {
        const refs = chunk.map(item => db.collection('creators').doc(item.id));
        const snapshots = await db.getAll(...refs);

        snapshots.forEach((doc, index) => {
            if (doc.exists) {
                const data = doc.data();
                const item = chunk[index];
                // Only if they have an email
                const email = data.email || data.contact_email;
                if (email && email.includes('@')) {
                    creatorsToQueue.push({
                        user_id: userId,
                        creator_id: doc.id,
                        creator_email: email,
                        creator_handle: data.handle || data.username || '',
                        creator_platform: data.platform || 'instagram',
                        creator_name: data.name || data.fullname || '',
                        status: 'scheduled',
                        // Distribute sending time starting from now
                        campaign_id: item.campaignId,
                        request_id: item.campaignId,
                        retry_count: 0,
                        created_at: admin.firestore.Timestamp.now(),
                        updated_at: admin.firestore.Timestamp.now()
                    });
                }
            }
        });
    }

    console.log(`Found ${creatorsToQueue.length} valid creators (with emails) to queue.`);

    if (creatorsToQueue.length > 0) {
        const batch = db.batch();
        const now = new Date();

        creatorsToQueue.forEach((item, i) => {
            const ref = db.collection('outreach_queue').doc();
            // Schedule 2 minute apart
            const sendTime = new Date(now.getTime() + (i * 2 + 1) * 60000);
            item.scheduled_send_time = admin.firestore.Timestamp.fromDate(sendTime);
            batch.set(ref, item);
        });

        // Update User Quota
        const accountRef = db.collection('user_accounts').doc(userId);
        batch.update(accountRef, {
            email_used_today: admin.firestore.FieldValue.increment(creatorsToQueue.length),
            updated_at: admin.firestore.Timestamp.now()
        });

        await batch.commit();
        console.log(`Successfully queued ${creatorsToQueue.length} emails!`);
    } else {
        console.log('No valid creators found to queue (maybe missing emails in creator docs).');
    }
}

recoverQueue().catch(console.error);
