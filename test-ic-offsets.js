
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testOffsets() {
    if (!INFLUENCER_CLUB_API_KEY) {
        console.error("No API key found in env");
        return;
    }

    console.log("Testing Offset 0...");
    const res1 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            offset: 0,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data1 = await res1.json();
    const len1 = (data1.accounts || []).length;
    const firstUser1 = len1 > 0 ? (data1.accounts[0].username || data1.accounts[0].handle || data1.accounts[0].profile.username) : "none";
    console.log(`Offset 0 returned ${len1} items. First: ${firstUser1}`);

    console.log("Testing Offset 5...");
    const res2 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            offset: 5,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data2 = await res2.json();
    const len2 = (data2.accounts || []).length;
    const firstUser2 = len2 > 0 ? (data2.accounts[0].username || data2.accounts[0].handle || data2.accounts[0].profile.username) : "none";
    console.log(`Offset 5 returned ${len2} items. First: ${firstUser2}`);

    if (firstUser1 === firstUser2) {
        console.log("FAIL: Pagination incorrect (same user).");
    } else {
        console.log("SUCCESS: Different users.");
    }

    console.log("Testing Offset 50...");
    const res3 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 50,
            offset: 50,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data3 = await res3.json();
    const len3 = (data3.accounts || []).length;
    const firstUser3 = len3 > 0 ? (data3.accounts[0].username || data3.accounts[0].handle || data3.accounts[0].profile.username) : "none";
    console.log(`Offset 50 returned ${len3} items. First: ${firstUser3}`);
}

testOffsets();
