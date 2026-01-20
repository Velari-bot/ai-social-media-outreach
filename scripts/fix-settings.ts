
require('dotenv').config({ path: '.env.local' }); // LOAD FIRST
const { db } = require('../lib/firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');

async function fix() {
    const userId = "T9SdK4kxEuZSaqZsVoWtkz27kTy2"; // Correct ID
    console.log(`Fixing settings for ${userId}...`);

    // Check if gmail connections exist to get email
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    let email = "unknown@verality.io";
    if (connDoc.exists) {
        email = connDoc.data().email || email;
        console.log("Found connection for:", email);
    } else {
        console.log("WARNING: No Gmail connection found!");
    }

    await db.collection('user_email_settings').doc(userId).set({
        gmail_connected: true,
        gmail_email: email,
        ai_auto_reply_enabled: true, // FORCE TRUE
        ai_persona: "Cory from Beyond Vision",
        total_replies_received: 0,
        updated_at: Timestamp.now()
    }, { merge: true });

    console.log("Settings fixed! NOW RUNNING MONITOR...");

    // Run monitor immediately to test
    const { monitorAllReplies } = require('../lib/services/reply-monitor');
    await monitorAllReplies();
}

fix();
