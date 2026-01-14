const INFLUENCER_CLUB_API_KEY = "388a101b-c74b-48ae-94d7-18451f2f01f4";

async function testCurrentPayload() {
    const platform = "instagram";
    const cleanNiche = "Baseball";
    const cleanCategory = "Sports";
    const minFollowers = 1000;
    const maxFollowers = 250000;

    const bodyV1 = {
        platform: platform,
        paging: {
            limit: 50,
            offset: 0
        },
        search: cleanNiche,
        filters: {
            platform: platform,
            category: cleanCategory,
            keyword: cleanNiche,
            number_of_followers: {
                min: minFollowers,
                max: maxFollowers
            },
            min_followers: minFollowers,
            max_followers: maxFollowers
        },
        sort_by: "relevancy",
        sort_order: "desc"
    };

    const bodyFlat = {
        platform: platform,
        niche: cleanNiche,
        category: cleanCategory,
        search: cleanNiche,
        minFollowers: minFollowers,
        maxFollowers: maxFollowers,
        limit: 50,
        offset: 0,
        filters: bodyV1.filters
    };

    console.log("Testing bodyFlat against /public/v1/discovery/");
    try {
        const res = await fetch("https://api-dashboard.influencers.club/public/v1/discovery/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyFlat)
        });
        console.log("Status:", res.status);
        const data = await res.json();
        const accounts = data.accounts || data.results || data.data || [];
        console.log("Results count:", accounts.length);
        if (accounts.length > 0) {
            console.log("First result:", accounts[0].profile?.username || accounts[0].username);
        } else {
            console.log("Full response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testCurrentPayload();
