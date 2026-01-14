require('dotenv').config({ path: '.env.local' });

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY;

async function testInstagramFilters() {
    const tests = [
        {
            name: "Instagram - keywords_in_bio",
            body: {
                platform: "instagram",
                limit: 5,
                filters: {
                    keywords_in_bio: "baseball",
                    min_followers: 1000,
                    max_followers: 250000
                }
            }
        },
        {
            name: "Instagram - hashtags",
            body: {
                platform: "instagram",
                limit: 5,
                filters: {
                    hashtags: ["baseball"],
                    min_followers: 1000,
                    max_followers: 250000
                }
            }
        },
        {
            name: "Instagram - keywords_in_caption",
            body: {
                platform: "instagram",
                limit: 5,
                filters: {
                    keywords_in_caption: "baseball",
                    min_followers: 1000,
                    max_followers: 250000
                }
            }
        }
    ];

    for (const test of tests) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(test.name);
        console.log("Payload:", JSON.stringify(test.body, null, 2));

        try {
            const res = await fetch("https://api-dashboard.influencers.club/public/v1/discovery/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${INFLUENCER_CLUB_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(test.body)
            });

            console.log("Status:", res.status);

            if (res.ok) {
                const data = await res.json();
                const accounts = data.accounts || data.results || data.data || [];
                console.log(`Found: ${accounts.length} creators`);

                if (accounts.length > 0) {
                    console.log("\nFirst 3 results:");
                    accounts.slice(0, 3).forEach((acc, i) => {
                        const profile = acc.profile || acc;
                        const username = profile.username || profile.handle;
                        const followers = profile.followers || profile.followers_count;
                        console.log(`  ${i + 1}. @${username} - ${followers} followers`);
                    });
                }
            } else {
                const error = await res.json();
                console.log("Error:", error.detail || JSON.stringify(error));
            }
        } catch (e) {
            console.error("Exception:", e.message);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

testInstagramFilters();
