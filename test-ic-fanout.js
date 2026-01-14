
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testSemanticFanOut() {
    console.log("--- Query 1: 'Travel' ---");
    const res1 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: { keywords_in_bio: "travel" }
        })
    });
    const list1 = (await res1.json()).accounts || [];
    const users1 = list1.map(u => u.profile ? u.profile.username : u.username);
    console.log("Users 1:", users1.join(", "));

    console.log("\n--- Query 2: 'Digital Nomad' ---");
    const res2 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: { keywords_in_bio: "digital nomad" }
        })
    });
    const list2 = (await res2.json()).accounts || [];
    const users2 = list2.map(u => u.profile ? u.profile.username : u.username);
    console.log("Users 2:", users2.join(", "));

    const overlap = users1.filter(u => users2.includes(u));
    if (overlap.length < 5) {
        console.log(`SUCCESS: Different datasets! Overlap: ${overlap.length}`);
    } else {
        console.log("FAIL: Identical datasets.");
    }
}

testSemanticFanOut();
