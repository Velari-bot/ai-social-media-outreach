
const apiKey = '6934e6b552638612d1d8';
const workspaceId = '937433';
const tableId = 't_0t8qbovmBSXrVkrSdVr';

async function check(url) {
    console.log(`Checking ${url}...`);
    try {
        const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}` } });
        console.log(`Status: ${res.status}`);
    } catch (e) { console.log(e.message); }
}

async function run() {
    // Try workspace scoped
    await check(`https://api.clay.com/v3/workspaces/${workspaceId}/tables/${tableId}/rows`);
    // Try v1
    await check(`https://api.clay.com/v1/workspaces/${workspaceId}/tables/${tableId}/rows`);
}

run();
