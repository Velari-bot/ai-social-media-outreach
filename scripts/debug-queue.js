const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase (Assuming env vars are set in the environment where I run this)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}
const dbInstance = getFirestore();

async function checkQueue() {
    console.log('--- Checking Outreach Queue ---');
    const now = new Date();
    console.log('Current System Time:', now.toISOString());

    const snapshot = await dbInstance.collection('outreach_queue')
        .where('status', '==', 'scheduled')
        .limit(20)
        .get();

    if (snapshot.empty) {
        console.log('No scheduled emails found.');
        return;
    }

    console.log(`Found ${snapshot.size} scheduled items.`);
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        const sendTime = data.scheduled_send_time.toDate();
        const diffMinutes = (sendTime - now) / 60000;

        console.log(`ID: ${doc.id}`);
        console.log(`User: ${data.user_id}`);
        console.log(`Scheduled: ${sendTime.toLocaleString()} (${diffMinutes.toFixed(1)} mins from now)`);
        console.log(`Creator: ${data.creator_email}`);
        console.log('---');
    });
}

checkQueue().catch(console.error);
