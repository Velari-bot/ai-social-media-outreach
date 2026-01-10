const https = require('https');

// Read from .env.local if not in process.env (for standalone run)
// But we will run this where envs might be expected, or we can parse .env.local manually if needed.
// Simplest is to try to read the file if we can.

const fs = require('fs');
const path = require('path');

let apiKey = process.env.INFLUENCER_CLUB_API_KEY;

if (!apiKey) {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/INFLUENCER_CLUB_API_KEY=(.+)/);
        if (match) {
            apiKey = match[1].trim();
            // Remove quotes if present
            if (apiKey.startsWith('"') && apiKey.endsWith('"')) apiKey = apiKey.slice(1, -1);
        }
    } catch (e) {
        console.log('Could not read .env.local');
    }
}

if (!apiKey) {
    console.error('No API Key found.');
    process.exit(1);
}

console.log('API Key found, length:', apiKey.length);

const postData = JSON.stringify({
    "platform": "youtube",
    "limit": 50,
    "offset": 0,
    "filters": {}
});

const options = {
    hostname: 'api-dashboard.influencers.club',
    path: '/public/v1/discovery/',
    method: 'POST',
    headers: {
        'Authorization': apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('Sending request to:', `https://${options.hostname}${options.path}`);
console.log('Payload:', postData);

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('BODY:', data.substring(0, 1000));
        try {
            const json = JSON.parse(data);
            console.log('Full JSON Keys:', Object.keys(json));
            if (json.error) console.log('Error in JSON:', json.error);
            const list = json.data || json.profiles || [];
            console.log('List length:', list.length);
        } catch (e) {
            console.log('Could not parse response JSON');
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
