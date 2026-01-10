
const fs = require('fs');
const path = require('path');

// --- 1. Load Environment Variables ---
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

async function testClay() {
    const apiKey = process.env.CLAY_API_KEY;
    if (!apiKey) {
        console.error("Error: CLAY_API_KEY is not set.");
        return;
    }

    const url = 'https://api.clay.com/v1/people/enrich';
    const body = {
        handle: "hardwareunboxed",
        platform: "youtube"
    };

    console.log("Testing Clay Enrichment for @hardwareunboxed...");

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    }
}

testClay();
