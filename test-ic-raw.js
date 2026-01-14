
const fetch = require('node-fetch');

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;
const URL = 'https://api-dashboard.influencers.club/public/v1/discovery/';

async function test() {
    if (!INFLUENCER_CLUB_API_KEY) {
        console.error("No API key found in env");
        return;
    }

    console.log("Testing API with Limit 50...");

    const body = {
        platform: "instagram",
        limit: 50,
        offset: 0,
        filters: {
            keywords_in_bio: "travel",
            min_followers: 10000,
            max_followers: 500000
        }
    };

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${INFLUENCER_CLUB_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error("API Error:", res.status, await res.text());
            return;
        }

        const data = await res.json();
        const accounts = data.accounts || data.results || data.data || [];
        console.log(`Results count: ${accounts.length}`);
    } catch (e) {
        console.error(e);
    }
}

test();
