const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

async function testDiscovery() {
    // Mimic the payload from InfluencerClubClient
    const body = {
        platform: "tiktok",
        limit: 10,
        offset: 0,
        filters: {
            min_followers: 1000,
            max_followers: 250000,
            keywords_in_bio: "lip sync"
        }
    };

    console.log("Testing Influencer Club API (Nested filters)...");
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

        console.log("Status:", response.status, response.statusText);
        const text = await response.text();
        console.log("Response Body Length:", text.length);
        console.log("Response Preview:", text.substring(0, 500));

    } catch (error) {
        console.error("Fetch Exception:", error);
    }
}

testDiscovery();
