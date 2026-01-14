const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4"; // From previous context/logs
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

async function testDiscovery() {
    const body = {
        platform: "youtube",
        limit: 10,
        min_followers: 1000,
        niche: "Action game",
        category: "Gaming",
        keyword: "Action game",
        sort_by: "relevancy",
        sort_order: "desc"
    };

    console.log("Testing Influencer Club API...");
    console.log("URL:", `${INFLUENCER_CLUB_BASE_URL}/public/v1/discovery/`);
    console.log("Body:", JSON.stringify(body, null, 2));

    try {
        const response = await fetch(`${INFLUENCER_CLUB_BASE_URL}/public/v1/discovery/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        console.log("Status:", response.status, response.statusText);
        const text = await response.text();
        console.log("Response Body:", text);

    } catch (error) {
        console.error("Fetch Exception:", error);
    }
}

testDiscovery();
