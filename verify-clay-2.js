
const apiKey = '6934e6b552638612d1d8';
const tableId = 't_0t8qbovmBSXrVkrSdVr';

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

        try {
            const json = JSON.parse(text);
            console.log('Response (JSON):', JSON.stringify(json, null, 2));
        } catch {
            console.log('Response (Text):', text.substring(0, 500));
        }
    } catch (e) {
        console.error(`Request Failed: ${e.message}`);
    }
}

async function run() {
    // Try to list columns to get the IDs
    // The endpoint often used is /v1/tables/{id}/columns
    await clayRequest(`https://api.clay.run/v1/tables/${tableId}/columns`);
}

run();
