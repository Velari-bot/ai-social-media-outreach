
import { monitorAllReplies } from '../lib/services/reply-monitor';
import { db } from '../lib/firebase-admin';

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
