require('dotenv').config({ path: '.env.local' });

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;

async function testWithEnvKey() {
    console.log("API Key loaded:", INFLUENCER_CLUB_API_KEY ? `${INFLUENCER_CLUB_API_KEY.substring(0, 20)}...` : "MISSING");

    const body = {
        platform: "instagram",
        niche: "Baseball",
        category: "Sports",
        minFollowers: 1000,
        maxFollowers: 250000,
        limit: 10
    };

    console.log("\nTesting with payload:");
    console.log(JSON.stringify(body, null, 2));

    try {
        const res = await fetch("https://api-dashboard.influencers.club/public/v1/discovery/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        console.log("\nStatus:", res.status, res.statusText);
        const data = await res.json();

        if (res.ok) {
            const accounts = data.accounts || data.results || data.data || [];
            console.log("✅ SUCCESS! Found", accounts.length, "creators");
            console.log("Total available:", data.total || "unknown");

            if (accounts.length > 0) {
                console.log("\n📋 First 3 results:");
                accounts.slice(0, 3).forEach((acc, i) => {
                    const profile = acc.profile || acc;
                    console.log(`${i + 1}. @${profile.username || profile.handle} - ${profile.followers || profile.followers_count} followers`);
                });
            }
        } else {
            console.log("❌ Error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("❌ Exception:", e.message);
    }
}

testWithEnvKey();
