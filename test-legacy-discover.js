const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";

async function testLegacyDiscover() {
    console.log("Testing /discover endpoint...");
    const body = {
        platform: "youtube",
        niche: "Baseball",
        minFollowers: 1000,
        limit: 10
    };

    try {
        const res = await fetch("https://api-dashboard.influencers.club/discover", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Results count:", (data.accounts || data.results || []).length);
        if (data.accounts) {
            console.log("Success!");
        } else {
            console.log("Response:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testLegacyDiscover();
