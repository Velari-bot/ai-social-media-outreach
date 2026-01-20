
const { monitorAllReplies } = require('../lib/services/reply-monitor');
const { db } = require('../lib/firebase-admin'); // Import db to ensure init?
require('dotenv').config({ path: '.env.local' });

async function run() {
    console.log("Forcing reply check...");
    await monitorAllReplies();
}
run();
