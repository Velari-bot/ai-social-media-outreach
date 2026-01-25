
/**
 * Verality Outreach Worker
 * ========================
 * 
 * This script is designed to be run periodically (e.g., via Cron every 5 minutes) on a VPS.
 * It performs two main tasks:
 * 1. Sends scheduled emails from the 'Outreach Queue'.
 * 2. Checks connected Gmail inboxes for replies and sends AI auto-responses.
 * 
 * Usage:
 *   npx ts-node scripts/run-worker.ts
 *   OR
 *   node dist/scripts/run-worker.js (if compiled)
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Import services
// Note: We use relative paths assuming this is run from project root or robust ts-node resolution
import { sendScheduledEmails } from '../lib/services/outreach-sender';
import { monitorAllReplies } from '../lib/services/reply-monitor';

import { runAutopilotDiscovery, runRecurringCampaigns } from '../lib/services/campaign-engine';

async function main() {
    console.log(`\n[\x1b[36m${new Date().toISOString()}\x1b[0m] Starting Verality Outreach Worker...`);

    const start = Date.now();

    try {
        // Run tasks in parallel to save time
        const [senderResult, monitorResult, autopilotResult, recurringResult] = await Promise.all([
            sendScheduledEmails().catch(err => {
                console.error("[\x1b[31mSender Failed\x1b[0m]", err);
                return { sent: 0, failed: 0 };
            }),
            monitorAllReplies().catch(err => {
                console.error("[\x1b[31mMonitor Failed\x1b[0m]", err);
                return { totalReplies: 0, totalResponses: 0 };
            }),
            runAutopilotDiscovery().catch(err => {
                console.error("[\x1b[31mAutopilot Failed\x1b[0m]", err);
                return { processed: 0 };
            }),
            runRecurringCampaigns().catch(err => {
                console.error("[\x1b[31mRecurring Failed\x1b[0m]", err);
                return { totalRun: 0, totalFailed: 0 };
            })
        ]);

        const duration = ((Date.now() - start) / 1000).toFixed(2);

        console.log(`\n[\x1b[32mWorker Complete\x1b[0m] Duration: ${duration}s`);
        console.log(`> Emails Sent: ${senderResult?.sent || 0} (Failed: ${senderResult?.failed || 0})`);
        console.log(`> Replies Processed: ${monitorResult?.totalReplies || 0} (Responses: ${monitorResult?.totalResponses || 0})`);
        console.log(`> Autopilot Users Processed: ${autopilotResult?.processed || 0}`);
        console.log(`> Recurring Campaigns Run: ${recurringResult?.totalRun || 0}`);

        process.exit(0);
    } catch (globalError) {
        console.error("[\x1b[31mCRITICAL ERROR\x1b[0m] Worker crashed:", globalError);
        process.exit(1);
    }
}

// Execute
main();
