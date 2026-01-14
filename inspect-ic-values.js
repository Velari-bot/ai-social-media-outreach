
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function inspectValues() {
    console.log("Inspecting Response Values...");
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
    console.log("Response Limit:", data.limit);
    console.log("Total:", data.total);
    console.log("Credits Left:", data.credits_left);
    console.log("Credits Cost:", data.credits_cost);
    console.log("Accounts Length:", data.accounts ? data.accounts.length : 0);
}

inspectValues();
