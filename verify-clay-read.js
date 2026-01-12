
const apiKey = '6934e6b552638612d1d8';
const tableId = 't_0t8qbovmBSXrVkrSdVr';
const workspaceId = '937433';

async function check(url) {
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        if (res.status === 200) {
            console.log(`Response: ${text.substring(0, 300)}...`);
        }
    } catch (e) { console.log(e.message); }
}

async function run() {
    // Attempting to read back the table data using v3 endpoints
    await check(`https://api.clay.com/v3/workspaces/${workspaceId}/tables/${tableId}/rows`);
    await check(`https://api.clay.com/v3/tables/${tableId}/rows`);
}

run();
