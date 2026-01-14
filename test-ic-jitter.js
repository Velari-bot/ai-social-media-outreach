
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testJitter() {
    console.log("Testing Base (10k-500k)...");
    const res1 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data1 = await res1.json();
    const list1 = data1.accounts || [];
    const users1 = list1.map(u => u.profile.username);
    console.log("Base Users:", users1.join(", "));

    console.log("\nTesting Jitter (15k-500k)...");
    const res2 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: { keywords_in_bio: "travel", min_followers: 15000, max_followers: 500000 }
        })
    });
    const data2 = await res2.json();
    const list2 = data2.accounts || [];
    const users2 = list2.map(u => u.profile.username);
    console.log("Jitter Users:", users2.join(", "));

    // Overlap?
    const overlap = users1.filter(u => users2.includes(u));
    console.log(`\nOverlap: ${overlap.length} users.`);
}

testJitter();
