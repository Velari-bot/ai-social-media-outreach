const fetch = require('node-fetch');

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMzcyNjM0OTA5LCJpYXQiOjE3Njc4MzQ5MDksImp0aSI6IjAzOGYwMjRiNjYwOTQ3YzI4NzM3YzRhMjU5MWNlMmNkIiwidXNlcl9pZCI6MTg5NDV9.00KsjxU4gIbfp2AXCXq5gYv0dIQdYSSOtLIUWBRTvcQ";
const BASE_URL = 'https://api-dashboard.influencers.club';

async function testPayload(name, payload) {
    console.log(`\n--- Testing ${name} ---`);
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

        console.log("Status:", response.status);
        if (!response.ok) {
            console.log("Error Body:", await response.text());
            return;
        }

        const data = await response.json();
        const results = data.accounts || data.results || data.data || [];
        console.log("Results Count:", results.length);
        if (results.length > 0) {
            console.log("First Result Handle:", results[0].profile?.username || results[0].handle || "N/A");
            console.log("First Result Bio:", results[0].profile?.biography?.substring(0, 50) || "N/A");
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

async function run() {
    // Stage 7 equivalent: Broad search for "Fashion" on YouTube
    await testPayload("Stage 7 (Fashion Keyword)", {
        platform: "youtube",
        paging: { limit: 10, page: 0 },
        filters: {
            min_followers: 0,
            max_followers: 10000000,
            keywords: ["Fashion"]
        }
    });

    // Test Sub-topic validity
    await testPayload("Test Topic: Gaming", {
        platform: "youtube",
        paging: { limit: 10, page: 0 },
        filters: {
            min_followers: 1000,
            topics: ["Gaming"]
        }
    });
}

run();
