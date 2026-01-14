
const { InfluencerClubClient } = require('./lib/services/influencer-club-client');

// Mock environment
process.env.INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || 'sk_live_57863d04-032a-4537-8e6d-74d326'; // Using key from prev context or env

async function testLimit() {
    console.log('Testing Influencer Club API Limit...');

    const client = new InfluencerClubClient({
        apiKey: process.env.INFLUENCER_CLUB_API_KEY
    });

    try {
        const results = await client.discoverCreators({
            platform: 'instagram',
            filters: {
                niche: 'Travel',
                min_followers: 10000,
                max_followers: 500000
            },
            limit: 50,
            offset: 0
        });

        console.log(`Requested 50. Got: ${results.length}`);
        if (results.length > 0) {
            console.log('Sample creator:', results[0].handle);
        }

        if (results.length === 5) {
            console.log("ALERT: API returned exactly 5 results. This suggests a trial limit or default pagination.");
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testLimit();
