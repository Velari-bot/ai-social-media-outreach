
const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("Failed to init firebase:", e);
        process.exit(1);
    }
}

const db = admin.firestore();
const USER_ID = 'T9SdK4kxEuZSaqZsVoWtkz27kTy2';

async function main() {
    console.log(`Checking missed emails for user ${USER_ID}...`);

    const campaignsSnap = await db.collection('creator_requests')
        .where('user_id', '==', USER_ID)
        // .orderBy('created_at', 'desc') // Removed to avoid index error
        .limit(50)
        .get();

    console.log(`Found ${campaignsSnap.size} campaigns.`);

    let totalQueued = 0;
    const batchSize = 400; // efficient chunking

    for (const doc of campaignsSnap.docs) {
        const campaign = doc.data();
        const creatorIds = campaign.creator_ids || [];

        if (creatorIds.length === 0) continue;

        // Chunk fetches
        const chunks = [];
        for (let i = 0; i < creatorIds.length; i += 10) {
            chunks.push(creatorIds.slice(i, i + 10));
        }

        const creatorsWithEmail = [];
        for (const chunk of chunks) {
            if (chunk.length === 0) continue;
            // Need a way to query by ID. 
            // 'creators' collection uses random IDs? Or user provided?
            // Usually doc.id matches creator_id.

            // Use FieldPath.documentId()
            const snap = await db.collection('creators')
                .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
                .get();

            snap.docs.forEach(c => {
                const data = c.data();
                if (data.email && data.email.includes('@') && (data.enrichment_status === 'enriched' || data.email_found)) {
                    creatorsWithEmail.push({ id: c.id, ...data });
                }
            });
        }

        if (creatorsWithEmail.length === 0) continue;

        // Check Queue
        const toQueue = [];
        for (const creator of creatorsWithEmail) {
            const qSnap = await db.collection('outreach_queue')
                .where('user_id', '==', USER_ID)
                .where('creator_email', '==', creator.email)
                .limit(1)
                .get();

            if (qSnap.empty) {
                toQueue.push(creator);
            }
        }

        if (toQueue.length > 0) {
            console.log(`Campaign ${doc.id}: Found ${toQueue.length} missed creators. Queueing...`);

            const batch = db.batch();
            let opCount = 0;
            const now = Date.now();
            // Start sending 5 mins from now
            let scheduleTime = now + 5 * 60 * 1000;

            for (const creator of toQueue) {
                const ref = db.collection('outreach_queue').doc();
                batch.set(ref, {
                    user_id: USER_ID,
                    creator_id: creator.id,
                    creator_email: creator.email,
                    creator_handle: creator.handle || creator.username,
                    creator_platform: creator.platform || 'instagram',
                    creator_name: creator.name || creator.fullname || '',
                    status: 'scheduled',
                    scheduled_send_time: admin.firestore.Timestamp.fromMillis(scheduleTime),
                    campaign_id: doc.id,
                    retry_count: 0,
                    created_at: admin.firestore.Timestamp.now(),
                    updated_at: admin.firestore.Timestamp.now()
                });

                // Increment schedule time by 2 minutes
                scheduleTime += 2 * 60 * 1000;
                opCount++;
                totalQueued++;
            }
            await batch.commit();
            console.log("  -> Queued successfully.");
        }
    }

    console.log(`\nDONE. Total queued: ${totalQueued}`);
}

main();
