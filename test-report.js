
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}
loadEnv();

async function testReport() {
    const apiKey = process.env.INFLUENCER_CLUB_API_KEY;
    const url = 'https://api-dashboard.influencers.club/public/v1/reports/instagram/alexconsani';

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        }
    });

    console.log("Report Status:", response.status);
    const data = await response.json();
    console.log("Report Data Keys:", Object.keys(data));
    if (data.profile) console.log("Profile Emails:", data.profile.emails);
}

testReport();
