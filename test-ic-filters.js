
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testFilters() {
    console.log("--- Test 1: Min Followers 500k ---");
    // Should filter out anyone < 500k

    const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: {
                keywords_in_bio: "travel",
                min_followers: 500000,
                max_followers: 1000000
            }
        })
    });

    const data = await res.json();
    const list = data.accounts || [];

    const users = list.map(u => ({
        handle: u.profile.username,
        followers: u.profile.followers
    }));

    console.log("Results (Requesting > 500k):");
    console.table(users);

    // Check if filter worked
    const failed = users.some(u => u.followers < 500000);
    if (failed) {
        console.log("FAIL: API returned users with < 500k followers. Filter ignored.");
    } else {
        console.log("SUCCESS: Filter respected.");
    }
}

testFilters();
