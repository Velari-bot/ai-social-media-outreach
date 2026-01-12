
const apiKey = '6934e6b552638612d1d8';
const tableId = 't_0t8qbovmBSXrVkrSdVr';

async function run() {
    const url = `https://api.clay.run/v1/tables/${tableId}/rows`;
    console.log(`POSTing to ${url}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rows: [
                    { "Creator Name": "Test Probe" }
                ]
            })
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text}`);
    } catch (e) {
        console.log(e.message);
    }
}

run();
