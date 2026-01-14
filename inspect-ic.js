
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function inspectResponse() {
    console.log("Inspecting Full Response...");
    const res = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            offset: 0,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });

    const data = await res.json();
    console.log("Keys in response:", Object.keys(data));
    if (data.meta) console.log("Meta:", data.meta);
    if (data.pagination) console.log("Pagination:", data.pagination);
    if (data.scroll_id) console.log("Scroll ID:", data.scroll_id);

    // Dump first user to ensure it's real data
    if (data.accounts && data.accounts.length > 0) {
        console.log("First User:", data.accounts[0].profile.username);
    }
}

inspectResponse();
