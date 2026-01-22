const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const email = 'benderaiden826@gmail.com';

async function run() {
    const s = await db.collection('user_accounts').where('email', '==', email).get();
    if (s.empty) {
        console.log('No user');
    } else {
        s.docs.forEach(d => {
            console.log('Doc ID:', d.id);
            console.log('Email:', d.data().email);
            console.log('Credits:', (d.data().email_quota_daily || 0) - (d.data().email_used_today || 0));
        });
    }
}
run();
