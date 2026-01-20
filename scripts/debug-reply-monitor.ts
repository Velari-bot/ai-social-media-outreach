
require('dotenv').config({ path: '.env.local' });
const { monitorAllReplies } = require('../lib/services/reply-monitor');

async function run() {
    console.log("Starting Debug Monitor...");
    try {
        const result = await monitorAllReplies();
        console.log("Monitor Result:", result);
    } catch (e) {
        console.error("Monitor Fatal Error:", e);
    }
}

run();
