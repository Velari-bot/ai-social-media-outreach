const INFLUENCER_CLUB_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMzcyNjM0OTA5LCJpYXQiOjE3Njc4MzQ5MDksImp0aSI6IjAzOGYwMjRiNjYwOTQ3YzI4NzM3YzRhMjU5MWNlMmNkIiwidXNlcl9pZCI6MTg5NDV9.00KsjxU4gIbfp2AXCXq5gYv0dIQdYSSOtLIUWBRTvcQ";
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

async function diagnoseYoutubeStats() {
    const body = {
        platform: "youtube",
        paging: { limit: 1, page: 0 },
        filters: {
            min_followers: 10000,
            keywords: ["gaming"]
        }
    };

    try {
        const response = await fetch(`${INFLUENCER_CLUB_BASE_URL}/public/v1/discovery/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const data = await response.json();
            const accounts = data.accounts || data.results || data.data || [];
            if (accounts.length > 0) {
                console.log("Full Object Sample:", JSON.stringify(accounts[0], null, 2));
            } else {
                console.log("No accounts found.");
            }
        } else {
            console.log("Error:", await response.text());
        }
    } catch (error) {
        console.error("Exception:", error);
    }
}

diagnoseYoutubeStats();
