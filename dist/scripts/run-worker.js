"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables from .env.local
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv.config({ path: path_1.default.resolve(process.cwd(), '.env.local') });
// Import services
// Note: We use relative paths assuming this is run from project root or robust ts-node resolution
const outreach_sender_1 = require("../lib/services/outreach-sender");
const reply_monitor_1 = require("../lib/services/reply-monitor");
async function main() {
    console.log(`\n[\x1b[36m${new Date().toISOString()}\x1b[0m] Starting Verality Outreach Worker...`);
    const start = Date.now();
    try {
        // Run tasks in parallel to save time
        const [senderResult, monitorResult] = await Promise.all([
            (0, outreach_sender_1.sendScheduledEmails)().catch(err => {
                console.error("[\x1b[31mSender Failed\x1b[0m]", err);
                return { sent: 0, failed: 0 };
            }),
            (0, reply_monitor_1.monitorAllReplies)().catch(err => {
                console.error("[\x1b[31mMonitor Failed\x1b[0m]", err);
                return { totalReplies: 0, totalResponses: 0 };
            })
        ]);
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`\n[\x1b[32mWorker Complete\x1b[0m] Duration: ${duration}s`);
        console.log(`> Emails Sent: ${senderResult?.sent || 0} (Failed: ${senderResult?.failed || 0})`);
        console.log(`> Replies Processed: ${monitorResult?.totalReplies || 0} (Responses: ${monitorResult?.totalResponses || 0})`);
        process.exit(0);
    }
    catch (globalError) {
        console.error("[\x1b[31mCRITICAL ERROR\x1b[0m] Worker crashed:", globalError);
        process.exit(1);
    }
}
// Execute
main();
