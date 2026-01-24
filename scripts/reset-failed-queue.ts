
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function resetFailedQueue() {
    const { db } = await import('../lib/firebase-admin');
    const { rescheduleUserQueue } = await import('../lib/services/outreach-queue');

    const userId = 'O4wAzcNBDDZ7sGi4OLyDwhetnZv2';
    console.log(`--- Resetting Failed Queue for ${userId} ---`);

    // 1. Find FAILED items
    const snapshot = await db.collection('outreach_queue')
        .where('user_id', '==', userId)
        .where('status', '==', 'failed')
        .get();

    if (!snapshot.empty) {
        console.log(`Found ${snapshot.size} failed items.`);
        const batch = db.batch();
        let count = 0;

        snapshot.docs.slice(0, 450).forEach(doc => {
            batch.update(doc.ref, {
                status: 'scheduled',
                last_error: null,
                retry_count: 0,
                updated_at: new Date()
            });
            count++;
        });

        await batch.commit();
        console.log(`Reset ${count} items to 'scheduled'.`);
    } else {
        console.log('No FAILED items. Proceeding to reschedule...');
    }

    // 3. Trigger Reschedule Logic
    console.log('Triggering rescheduleUserQueue...');

    const userDoc = await db.collection('user_accounts').doc(userId).get();
    const is24_7 = userDoc.data()?.business_hours_only === false;

    await rescheduleUserQueue(userId, !is24_7);

    console.log('Done.');
    process.exit(0);
}

resetFailedQueue().catch(e => {
    console.error(e);
    process.exit(1);
});
