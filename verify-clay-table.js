
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                process.env[key.trim()] = value;
            }
        });
    }
}
loadEnv();

const apiKey = process.env.CLAY_API_KEY;
const tableId = process.env.CLAY_TABLE_ID;

if (!apiKey || !tableId) {
    console.error("Missing API Key or Table ID");
    process.exit(1);
}

// Helper to make requests
async function clayRequest(endpoint, method = 'GET', body = null) {
    console.log(`\nEndpoint: ${endpoint}`);
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(endpoint, options);
        console.log(`Status: ${res.status}`);
        const text = await res.text();

        // Try parsing JSON for cleaner output
        try {
            const json = JSON.parse(text);
            // Log structure of first few items/keys
            if (Array.isArray(json)) {
                console.log(`Response (Array[${json.length}]):`, JSON.stringify(json.slice(0, 2), null, 2));
            } else {
                console.log('Response (Object):', JSON.stringify(json, null, 2).substring(0, 500) + '...');
            }
            return json;
        } catch {
            console.log('Response (Text):', text.substring(0, 500));
        }
    } catch (e) {
        console.error(`Request Failed: ${e.message}`);
    }
}

async function run() {
    // 1. Try to get the table details (columns map)
    // Common endpoints seen in reverse engineering
    // api.clay.com or api.clay.run

    // Attempt 1: Get Columns (v3 or v1)
    await clayRequest(`https://api.clay.run/v3/tables/${tableId}/columns`);

    // Attempt 2: Add a test row to see if it works with column names
    // We won't actually do this on PROD data without checking, but let's see if we can read rows first
    // await clayRequest(`https://api.clay.run/v3/tables/${tableId}/rows?limit=1`);
}

run();
