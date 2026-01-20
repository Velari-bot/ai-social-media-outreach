
const { db } = require('../lib/firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const userId = "T9SdK4kxEuZSaqZsVoWtkz27kTy2"; // Correct ID from DB
    const doc = await db.collection('user_email_settings').doc(userId).get();
    if (!doc.exists) {
        console.log("No settings doc found");
    } else {
        console.log("Settings:", doc.data());
    }
}
check();
