
const apiKey = '6934e6b552638612d1d8';
const tableId = 't_0t8qbovmBSXrVkrSdVr';

async function check(url) {
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
        console.log(`Status: ${res.status}`);
    } catch (e) { console.log(e.message); }
}

async function run() {
    await check(`https://api.clay.com/v3/tables/${tableId}/rows`);
    await check(`https://api.clay.run/v3/tables/${tableId}/rows`);
    await check(`https://api.clay.com/v1/tables/${tableId}/rows`);
    // Some integrations use /api/v3...
}

run();
