
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function scanParamStructures() {
    const trials = [
        { name: "Root Level", body: { min_followers: 500000, platform: "instagram", filters: { keywords_in_bio: "travel" } } },
        { name: "String Values", body: { platform: "instagram", filters: { keywords_in_bio: "travel", min_followers: "500000" } } },
        { name: "Camel Case", body: { platform: "instagram", filters: { keywords_in_bio: "travel", minFollowers: 500000 } } },
        { name: "Nested Object", body: { platform: "instagram", filters: { keywords_in_bio: "travel", followers: { min: 500000 } } } },
        { name: "Nested Range", body: { platform: "instagram", filters: { keywords_in_bio: "travel", followers: { start: 500000 } } } },
        { name: "Followers Count Key", body: { platform: "instagram", filters: { keywords_in_bio: "travel", followers_count: { min: 500000 } } } },
    ];

    console.log("Checking for effective filtering (Goal: Exclude users < 500k followers)...");

    for (const t of trials) {
        try {
            const res = await fetch(URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}` },
                body: JSON.stringify(t.body)
            });
            const data = await res.json();
            const list = data.accounts || [];

            if (list.length === 0) {
                console.log(`[${t.name}] Returned 0 results (Possible success if filter was too strict?)`);
                continue;
            }

            const firstUser = list[0];
            const firstFollowers = firstUser.profile ? firstUser.profile.followers : firstUser.followers;

            if (firstFollowers > 450000) {
                console.log(`[${t.name}] SUCCESS! First user has ${firstFollowers} followers.`);
            } else {
                console.log(`[${t.name}] Failed. First user has ${firstFollowers} followers.`);
            }
        } catch (e) {
            console.log(`[${t.name}] Error: ${e.message}`);
        }
    }
}

scanParamStructures();
