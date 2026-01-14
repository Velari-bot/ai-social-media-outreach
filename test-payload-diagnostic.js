const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

async function testSchema(name, body) {
    console.log(`\n--- Testing Schema: ${name} ---`);
    console.log("Payload:", JSON.stringify(body, null, 2));

    try {
        const response = await fetch(`${INFLUENCER_CLUB_BASE_URL}/public/v1/discovery/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        console.log("Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];
            console.log("Total Matches reported:", data.total);
            console.log("Accounts returned:", accounts.length);
            if (accounts.length > 0) {
                console.log("Sample account handle:", accounts[0].profile?.username || accounts[0].username || accounts[0].handle);
                console.log("Sample account followers:", accounts[0].profile?.followers || accounts[0].followers);
            }
        } else {
            const text = await response.text();
            console.log("Error Response:", text);
        }
    } catch (error) {
        console.error("Exception:", error.message);
    }
}

async function runTests() {
    // 1. The "Official" Nested Schema
    await testSchema("Official Nested", {
        platform: "youtube",
        limit: 50,
        min_followers: 1000,
        max_followers: 250000,
        filters: {
            category: "Gaming",
            keywords: "Action game"
        }
    });

    // 2. The "User-Suggested" Flat Schema
    await testSchema("Flat User Schema", {
        platform: "youtube",
        niche: "Action game",
        minFollowers: 1000,
        maxFollowers: 250000,
        limit: 50
    });

    // 3. Another variant: Nested Filters with snake_case
    await testSchema("Strict Snake Nested", {
        platform: "youtube",
        limit: 50,
        filters: {
            min_followers: 1000,
            max_followers: 250000,
            category: "Gaming"
        }
    });
}

runTests();
