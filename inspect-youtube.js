
const fs = require('fs');
const path = require('path');

// --- 1. Load Environment Variables ---
function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}
loadEnv();

async function inspectYoutubeData() {
    const apiKey = process.env.INFLUENCER_CLUB_API_KEY;
    const url = 'https://api-dashboard.influencers.club/public/v1/discovery/';
    const body = {
        platform: "youtube",
        paging: { limit: 2, page: 0 },
        sort: { sort_by: "relevancy", sort_order: "desc" },
        filters: { category: "Gaming" }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("RAW DATA SAMPLE:");
        console.log(JSON.stringify(data.accounts[0], null, 2));
    } catch (e) {
        console.error(e);
    }
}

inspectYoutubeData();
