const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";

async function testSimplePayload() {
    const body = {
        platform: "instagram",
        niche: "Baseball",
        category: "Sports",
        minFollowers: 1000,
        maxFollowers: 250000,
        limit: 10
    };

    console.log("Testing simplified payload...");
    console.log("Body:", JSON.stringify(body, null, 2));

    try {
        const res = await fetch("https://api-dashboard.influencers.club/public/v1/discovery/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        console.log("Status:", res.status);
        const data = await res.json();

        if (res.ok) {
            const accounts = data.accounts || data.results || data.data || [];
            console.log("✅ Success! Found", accounts.length, "creators");
            if (accounts.length > 0) {
                const first = accounts[0].profile || accounts[0];
                console.log("First result:", first.username || first.handle, "-", first.followers || first.followers_count, "followers");
            }
        } else {
            console.log("❌ Error:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Exception:", e.message);
    }
}

testSimplePayload();
