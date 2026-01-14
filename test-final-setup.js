
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Use the token from env specific to admin
const REFRESH_TOKEN = process.env.GMAIL_ADMIN_REFRESH_TOKEN;
const CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

async function testFinalConnection() {
    console.log("Testing Final Integration...");

    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                refresh_token: REFRESH_TOKEN,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("❌ Refresh Failed:", error);
        } else {
            const data = await response.json();
            console.log("✅ Refresh Success! Token exchanged.");

            // Now verify we can get the profile (confirms scope access)
            const profileResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${data.access_token}` }
            });

            if (profileResp.ok) {
                const profile = await profileResp.json();
                console.log(`✅ Connected as: ${profile.email}`);
            } else {
                console.log("⚠️ Could not fetch profile (Scopes might be limited), but Auth is valid.");
            }
        }

    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

testFinalConnection();
