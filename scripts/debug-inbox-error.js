
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function debugInbox() {
    const userId = 'T9SdK4kxEuZSaqZsVoWtkz27kTy2';
    console.log(`Debugging Inbox for user: ${userId}`);

    try {
        // Reproduce the query from route.ts
        const threadsSnap = await db.collection('email_threads')
            .where('user_id', '==', userId)
            .orderBy('updated_at', 'desc')
            .limit(20)
            .get();

        console.log(`Query Success! Found ${threadsSnap.size} threads.`);
        threadsSnap.docs.forEach(doc => {
            console.log(`- ${doc.id}: ${doc.data().connected_account_email}`);
        });

    } catch (e) {
        console.error('Query FAILED:', e);
    }
}

debugInbox();
