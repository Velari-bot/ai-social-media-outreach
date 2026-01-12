
const apiKey = '6934e6b552638612d1d8';
const tableId = 't_0t8qbovmBSXrVkrSdVr';

async function run() {
    // Try to get rows
    console.log('Fetching rows...');
    const res = await fetch(`https://api.clay.run/v1/tables/${tableId}/rows?limit=1`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(text.substring(0, 500));
}

run();
