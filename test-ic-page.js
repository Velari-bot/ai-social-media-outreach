
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function testPage() {
    console.log("Testing Page 1...");
    const res1 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 5,
            page: 1,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data1 = await res1.json();
    const first1 = data1.accounts[0].profile.username;
    console.log("Page 1 First:", first1);

    console.log("Testing Page 2...");
    const res2 = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
        body: JSON.stringify({
            platform: "instagram",
            limit: 5,
            page: 2,
            filters: { keywords_in_bio: "travel", min_followers: 10000, max_followers: 500000 }
        })
    });
    const data2 = await res2.json();
    const first2 = data2.accounts[0].profile.username;
    console.log("Page 2 First:", first2);
}

testPage();
