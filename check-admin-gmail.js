const admin = require('firebase-admin');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkAdminConnection() {
    const email = 'benderaiden826@gmail.com';
    console.log(`Checking connection for ${email}...`);

    // 1. Find user ID
    let userSnap = await db.collection('user_accounts').where('email', '==', email).get();
    if (userSnap.empty) {
        userSnap = await db.collection('users').where('email', '==', email).get();
    }

    if (userSnap.empty) {
        console.log('User not found in user_accounts or users');
        return;
    }

    const userId = userSnap.docs[0].id;
    console.log(`Found User ID: ${userId}`);

    // 2. Check gmail_connections
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    if (connDoc.exists) {
        console.log('Gmail Connection found!');
        console.log('Data:', JSON.stringify(connDoc.data(), null, 2));
    } else {
        console.log('No Gmail Connection found for this User ID');
    }
}

checkAdminConnection().catch(console.error);
