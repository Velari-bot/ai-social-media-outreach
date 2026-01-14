const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

async function testDiscovery() {
    const body = {
        platform: "youtube",
        niche: "Gaming",
        minFollowers: 1000,
        limit: 10
    };

    console.log("Testing Influencer Club API (/discover)...");
    console.log("URL:", `${INFLUENCER_CLUB_BASE_URL}/discover`);

    try {
        const response = await fetch(`${INFLUENCER_CLUB_BASE_URL}/discover`, {
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
