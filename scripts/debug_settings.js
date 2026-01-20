
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
const db = admin.firestore();

async function run() {
    const userId = 'T9SdK4kxEuZSaqZsVoWtkz27kTy2';
    const doc = await db.collection('user_email_settings').doc(userId).get();
    if (doc.exists) {
        const d = doc.data();
        console.log(`User: ${doc.id}`);
        console.log(`  GmailConnected: ${d.gmail_connected}`);
        console.log(`  AIEnabled: ${d.ai_auto_reply_enabled}`);
        console.log(`  LastChecked: ${d.last_reply_check?.toDate?.()?.toISOString()}`);
    } else {
        console.log('User settings not found');
    }
}
run();
