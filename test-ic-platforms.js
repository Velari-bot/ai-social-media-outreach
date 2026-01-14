
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testPlatforms() {
    console.log("--- TEST 1: TikTok (Gaming) ---");
    // Emulating the "Gaming" request from your screenshot
    const res1 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "tiktok",
            limit: 50,
            filters: { keywords_in_bio: "gaming", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data1 = await res1.json();
    console.log(`TikTok 'gaming' count: ${data1.accounts ? data1.accounts.length : 0}`);

    console.log("\n--- TEST 2: YouTube (Lifestyle) ---");
    // Emulating the "Lifestyle" request from your screenshot
    const res2 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "youtube",
            limit: 50,
            filters: { topics: ["lifestyle"], min_followers: 10000, max_followers: 500000 }
        })
    });
    const data2 = await res2.json();
    console.log(`YouTube 'lifestyle' count: ${data2.accounts ? data2.accounts.length : 0}`);

    console.log("\n--- TEST 3: Instagram (Travel) ---");
    const res3 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data3 = await res3.json();
    console.log(`Instagram 'travel' count: ${data3.accounts ? data3.accounts.length : 0}`);
}

testPlatforms();
