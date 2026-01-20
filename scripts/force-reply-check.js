
const { monitorAllReplies } = require('../lib/services/reply-monitor');
const { db } = require('../lib/firebase-admin');

async function run() {
    console.log("Forcing Reply Monitor Run...");
    try {
        const result = await monitorAllReplies();
        console.log("Monitor Result:", result);
    } catch (e) {
        console.error("Monitor Failed:", e);
    }
    process.exit(0);
}

run();
