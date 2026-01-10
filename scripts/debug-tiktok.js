const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve(__dirname, '..', '.env.local');
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

async function testTikTok() {
    const apiKey = (process.env.INFLUENCER_CLUB_API_KEY || "").trim();
    const url = 'https://api-dashboard.influencers.club/public/v1/discovery/';
    const body = {
        platform: "tiktok",
        paging: { limit: 50, page: 0 },
        filters: {
            category: "Lifestyle",
            followers_min: "10000"
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));
        console.log("TOTAL MATCHES:", data.total);
        console.log("ACCOUNTS RETURNED:", data.accounts?.length || 0);
        if (data.accounts?.length > 0) {
            const sample = data.accounts[0].profile;
            console.log("SAMPLE PROFILE:", JSON.stringify(sample, null, 2));

            const lowFollowers = data.accounts.filter(a => a.profile.followers < 10000).length;
            console.log("ACCOUNTS < 10k FOLLOWERS:", lowFollowers);
        }
    } catch (e) {
        console.error(e);
    }
}

testTikTok();
