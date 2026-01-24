const fetch = require('node-fetch');

// API Key from .env.local
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMzcyNjM0OTA5LCJpYXQiOjE3Njc4MzQ5MDksImp0aSI6IjAzOGYwMjRiNjYwOTQ3YzI4NzM3YzRhMjU5MWNlMmNkIiwidXNlcl9pZCI6MTg5NDV9.00KsjxU4gIbfp2AXCXq5gYv0dIQdYSSOtLIUWBRTvcQ";
const BASE_URL = 'https://api-dashboard.influencers.club';

async function testPayload(name, payload) {
    console.log(`\n\x1b[36m--- Testing Scenario: ${name} ---\x1b[0m`);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${BASE_URL}/public/v1/discovery/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${response.ok ? '\x1b[32m' : '\x1b[31m'}${response.status} ${response.statusText}\x1b[0m`);

        if (!response.ok) {
            console.log("Error Body:", await response.text());
            return;
        }

        const data = await response.json();
        const results = data.accounts || data.results || data.data || [];
        console.log(`Results Found: \x1b[1m${results.length}\x1b[0m`);

        if (results.length > 0) {
            let validIdCount = 0;
            results.forEach(r => {
                if (r.profile?.id && r.profile.id.startsWith('UC')) {
                    validIdCount++;
                } else {
                    console.log("No valid UC ID for:", r.handle, r.user_id, r.profile?.id);
                }
            });
            console.log(`Verification: ${validIdCount}/${results.length} results have valid 'UC' Channel IDs available in profile.id.`);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

async function run() {
    console.log("\x1b[1mREPRODUCING USER ISSUE\x1b[0m");

    // Exact Payload based on UI Screenshot and suspected logic in InfluencerClubClient
    const payload = {
        platform: "youtube",
        paging: { limit: 50, page: 0 },
        filters: {
            min_followers: 50000,
            max_followers: 999999999,
            // UI sends "United Kingdom"
            location: ["United Kingdom"],
            min_avg_views: 12000,

            // Logic for "Fashion":
            // "Fashion" IS NOT in the invalid set, so it gets sent as topic.
            topics: ["Fashion"],
            keywords: ["Fashion"]
        }
    };

    await testPayload("User Failed Search (Fashion + UK + 12k views)", payload);
}

run();
