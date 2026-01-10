
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- 1. Load Environment Variables Manually ---
function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}
loadEnv();

// --- 2. Initialize Firebase Admin ---
if (!admin.apps.length) {
    let serviceAccount;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else {
            console.error('FIREBASE_SERVICE_ACCOUNT missing');
            process.exit(1);
        }
    } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// --- 3. Check Gmail Connection ---
async function checkGmail() {
    const targetEmail = 'benderaiden826@gmail.com';
    console.log(`Looking for user: ${targetEmail}`);

    const usersRef = db.collection('user_accounts'); // Assuming user_accounts is the main user table now per previous turn
    const snapshot = await usersRef.where('email', '==', targetEmail).limit(1).get();

    if (snapshot.empty) {
        console.log('User not found in user_accounts.');
        // Fallback to 'users' just in case
        const usersSnap = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
        if (usersSnap.empty) {
            console.log('User not found in users either.');
            process.exit(1);
        }
        console.log('User found in users collection (legacy?).');
        await checkConnection(usersSnap.docs[0].id);
    } else {
        console.log('User found in user_accounts.');
        await checkConnection(snapshot.docs[0].id);
    }
}

async function checkConnection(userId) {
    console.log(`Checking gmail_connections for userId: ${userId}`);
    const doc = await db.collection('gmail_connections').doc(userId).get();

    if (!doc.exists) {
        console.log('No Gmail connection found for this user.');
        console.log('Please connect your Gmail account via the dashboard settings first.');
    } else {
        const data = doc.data();
        console.log('Gmail connection found!');
        console.log(`Connected Email: ${data.email}`);
        console.log(`Last Sync: ${data.last_sync}`);
        console.log(`Has Refresh Token: ${!!data.refresh_token}`);

        // We can proceed to test sending
        if (data.refresh_token) {
            console.log('\n--- READY TO TEST SENDING ---');
            console.log('Run the sending test script now.');
        } else {
            console.log('Missing refresh token, cannot send offline.');
        }
    }
}

checkGmail().catch(console.error);
