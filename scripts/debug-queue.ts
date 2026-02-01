
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkDebug() {
    const { db } = await import('../lib/firebase-admin');
    console.log('--- Debugging Email Sending ---');
    const userId = 'O4wAzcNBDDZ7sGi4OLyDwhetnZv2';

    // 1. Check Connection
    try {
        const connDoc = await db.collection('gmail_connections').doc(userId).get();
        if (!connDoc.exists) {
            console.log(`[Status] Gmail Connection: MISSING DOC`);
        } else {
            const data = connDoc.data() || {};
            console.log(`[Status] Gmail Connection: FOUND`);
            console.log(` - Email: ${data.email}`);
            console.log(` - Updated At: ${data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at}`);
            console.log(` - Refresh Token: ${data.refresh_token ? 'Present' : 'MISSING'}`);
        }
    } catch (e) {
        console.error("Error reading connection:", e);
    }

    // 1.5 Check User Credits
    try {
        const userDoc = await db.collection('user_accounts').doc(userId).get();
        if (userDoc.exists) {
            const data = userDoc.data() || {};
            console.log(`[Status] User Credits:`);
            console.log(` - Daily Quota: ${data.email_quota_daily}`);
            console.log(` - Used Today: ${data.email_used_today}`);
            console.log(` - Remaining: ${(data.email_quota_daily || 0) - (data.email_used_today || 0)}`);
        } else {
            console.log(`[Status] User Account: MISSING DOC`);
        }
    } catch (e) {
        console.error("Error reading user credits:", e);
    }

    // 2. Check Queue Stats
    try {
        const snapshot = await db.collection('outreach_queue')
            .where('user_id', '==', userId)
            .get();

        if (snapshot.empty) {
            console.log(`[Queue] No items found.`);
        } else {
            const docs = snapshot.docs;
            console.log(`[Queue] Total items: ${docs.length}`);

            // Group by status
            const statusCounts = {} as Record<string, number>;
            docs.forEach(doc => {
                const s = doc.data().status;
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });
            console.log('[Queue] Status Counts:', statusCounts);

            console.log(`[Queue] Latest 10 items (Creation Time):`);
            const sortedDocs = docs.sort((a, b) => {
                const tA = a.data().created_at?.toMillis?.() || 0;
                const tB = b.data().created_at?.toMillis?.() || 0;
                return tB - tA;
            }).slice(0, 10);

            sortedDocs.forEach(doc => {
                const d = doc.data();
                console.log(` - ID: ${doc.id}`);
                console.log(`   Status: ${d.status}`);
                console.log(`   Error: ${d.last_error || 'None'}`);
                console.log(`   Scheduled: ${d.scheduled_send_time?.toDate?.() || d.scheduled_send_time}`);
                console.log(`   Created: ${d.created_at?.toDate?.() || d.created_at}`);
                console.log(`   Campaign: ${d.campaign_id}`);
            });
        }
    } catch (e) {
        console.error("Error reading queue:", e);
    }
    process.exit(0);
}

checkDebug();
