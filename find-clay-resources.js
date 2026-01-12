
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

if (!apiKey) {
    console.error("No API key found in .env.local");
    process.exit(1);
}

// Common endpoints to test connectivity and listing resources
const endpoints = [
    { url: 'https://api.clay.run/v3/workspaces', method: 'GET' },
    { url: 'https://api.clay.run/v3/bases', method: 'GET' }, // "bases" might be tables?
    { url: 'https://api.clay.run/v1/tables', method: 'GET' },
];

async function probe() {
    console.log(`Using Key: ${apiKey.substring(0, 4)}...`);

    for (const ep of endpoints) {
        console.log(`\nChecking ${ep.url}...`);
        try {
            const res = await fetch(ep.url, {
                method: ep.method,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(`Response: ${text.substring(0, 300)}`);
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

probe();
