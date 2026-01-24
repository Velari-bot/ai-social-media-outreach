
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkQueueItem() {
    const { db } = await import('../lib/firebase-admin');
    console.log('--- Checking Queue Items (No OrderBy) ---');
    const userId = 'O4wAzcNBDDZ7sGi4OLyDwhetnZv2';

    try {
        const snapshot = await db.collection('outreach_queue')
            .where('user_id', '==', userId)
            .limit(50)
            .get();

        if (!snapshot.empty) {
            console.log(`Found ${snapshot.size} items.`);
            // Sort in memory
            const docs = snapshot.docs.sort((a, b) => {
                // Sort by created_at desc
                const tA = a.data().created_at?.toMillis?.() || 0;
                const tB = b.data().created_at?.toMillis?.() || 0;
                return tB - tA;
            });

            const last = docs[0].data();
            console.log(`Latest Item Status: ${last.status}`);
            console.log(`Latest Item Error: ${last.last_error}`);
            console.log(`Latest Item Scheduled: ${last.scheduled_send_time?.toDate?.()}`);
        } else {
            console.log(`No queue items found for ${userId}`);
        }
    } catch (e) {
        console.error("Error reading queue:", e);
    }
    process.exit(0);
}

checkQueueItem();
