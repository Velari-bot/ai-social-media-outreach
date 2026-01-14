require('dotenv').config({ path: '.env.local' });

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;

async function testPayloadVariations() {
    const variations = [
        {
            name: "1. Nested filters with category",
            body: {
                platform: "instagram",
                filters: {
                    category: "Sports",
                    min_followers: 1000,
                    max_followers: 250000
                },
                limit: 5
            }
        },
        {
            name: "2. Root-level category",
            body: {
                platform: "instagram",
                category: "Sports",
                min_followers: 1000,
                max_followers: 250000,
                limit: 5
            }
        },
        {
            name: "3. Search keyword approach",
            body: {
                platform: "instagram",
                search: "baseball",
                min_followers: 1000,
                max_followers: 250000,
                limit: 5
            }
        },
        {
            name: "4. Filters with keyword",
            body: {
                platform: "instagram",
                filters: {
                    keyword: "baseball",
                    min_followers: 1000,
                    max_followers: 250000
                },
                limit: 5
            }
        },
        {
            name: "5. Topic-based",
            body: {
                platform: "instagram",
                topic: "baseball",
                min_followers: 1000,
                max_followers: 250000,
                limit: 5
            }
        }
    ];

    for (const variation of variations) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(variation.name);
        console.log("Payload:", JSON.stringify(variation.body, null, 2));

        try {
            const res = await fetch("https://api-dashboard.influencers.club/public/v1/discovery/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(variation.body)
            });

            console.log("Status:", res.status);

            if (res.ok) {
                const data = await res.json();
                const accounts = data.accounts || data.results || data.data || [];
                console.log(`Found: ${accounts.length} creators`);

                if (accounts.length > 0) {
                    const first = accounts[0].profile || accounts[0];
                    console.log(`First: @${first.username || first.handle}`);
                }
            } else {
                const error = await res.json();
                console.log("Error:", error.detail || error.message || JSON.stringify(error));
            }
        } catch (e) {
            console.error("Exception:", e.message);
        }

        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testPayloadVariations();
