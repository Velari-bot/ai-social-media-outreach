const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";

async function testEndpoint(url, name, body) {
    console.log(`\nTesting ${name} on ${url}`);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.log(`[${name}] Failed: ${response.status}`);
            return;
        }

        const data = await response.json();
        const accounts = data.accounts || data.results || data.data || [];
        console.log(`[${name}] Got ${accounts.length} results.`);
        if (accounts.length > 0) {
            console.log("Names:", accounts.slice(0, 5).map(a => (a.profile?.username || a.handle || a.username)).join(", "));
        }
    } catch (e) {
        console.log(`[${name}] Error: ${e.message}`);
    }
}

async function run() {
    const payloads = [
        {
            name: "Flat Niche/Category",
            body: {
                platform: "instagram",
                niche: "Baseball",
                category: "Sports",
                minFollowers: 1000,
                maxFollowers: 250000,
                limit: 10
            }
        },
        {
            name: "Nested Keywords",
            body: {
                platform: "instagram",
                limit: 10,
                filters: {
                    keywords: ["Baseball"],
                    min_followers: 1000,
                    max_followers: 250000
                }
            }
        },
        {
            name: "Nested Full",
            body: {
                platform: "instagram",
                limit: 10,
                filters: {
                    category: "Sports",
                    niche: "Baseball",
                    min_followers: 1000,
                    max_followers: 250000
                }
            }
        }
    ];

    const endpoints = [
        "https://api.influencerclub.com/discover",
        "https://api-dashboard.influencers.club/public/v1/discovery/"
    ];

    for (const url of endpoints) {
        for (const p of payloads) {
            await testEndpoint(url, p.name, p.body);
        }
    }
}

run();
