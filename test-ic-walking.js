
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testRangeWalking() {
    console.log("--- Step 1: Base Query (Max 500k) ---");
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

    if (list1.length === 0) { console.log("No results step 1"); return; }

    // Log users and their followers to verify sorting
    const followers = list1.map(u => u.profile ? u.profile.followers : u.followers);
    const users1 = list1.map(u => u.profile ? u.profile.username : u.username);

    console.log("Users 1:", users1.join(", "));
    console.log("Followers 1:", followers.join(", "));

    const minFollowers = Math.min(...followers);
    console.log(`Min followers in batch: ${minFollowers}`);

    const newMax = minFollowers - 1;
    console.log(`\n--- Step 2: Walk Query (Max ${newMax}) ---`);

    const res2 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: newMax }
        })
    });

    const data2 = await res2.json();
    const list2 = data2.accounts || [];
    const users2 = list2.map(u => u.profile ? u.profile.username : u.username);

    console.log("Users 2:", users2.join(", "));

    // Check overlap
    const overlap = users1.filter(u => users2.includes(u));
    if (overlap.length === 0) {
        console.log("SUCCESS: 100% Unique new users found via Range Walking!");
    } else {
        console.log(`FAIL: ${overlap.length} duplicates found.`);
    }
}

testRangeWalking();
