
const webhookUrl = 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-e80c6f33-00e8-4d51-909e-d42fe3445741';

async function run() {
    console.log(`Pushing test row to ${webhookUrl}...`);
    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "Creator Name": "Test WebhookUser",
                "Profile URL": "https://www.youtube.com/@GitHub",
                "Platform": "youtube",
                "verality_id": "test_123"
            })
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

run();
