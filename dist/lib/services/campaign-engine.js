"use strict";
/**
 * Recurring Campaign Engine
 * Runs active campaigns daily, finds new creators, enriches with Clay, and queues for outreach
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRecurringCampaigns = runRecurringCampaigns;
exports.runAutopilotDiscovery = runAutopilotDiscovery;
const firebase_admin_1 = require("../firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const influencer_club_client_1 = require("./influencer-club-client");
const clay_client_1 = require("./clay-client");
const outreach_queue_1 = require("./outreach-queue");
async function runRecurringCampaigns() {
    console.log('[Campaign Engine] Starting daily campaign run...');
    // Get all active recurring campaigns
    const campaignsSnapshot = await firebase_admin_1.db.collection('creator_requests')
        .where('is_recurring', '==', true)
        .where('is_active', '==', true)
        .get();
    console.log(`[Campaign Engine] Found ${campaignsSnapshot.size} active campaigns`);
    let totalRun = 0;
    let totalFailed = 0;
    for (const campaignDoc of campaignsSnapshot.docs) {
        try {
            await runCampaign(campaignDoc.id, campaignDoc.data());
            totalRun++;
        }
        catch (error) {
            console.error(`[Campaign Engine] Failed to run campaign ${campaignDoc.id}:`, error.message);
            totalFailed++;
        }
    }
    console.log(`[Campaign Engine] Complete. Ran: ${totalRun}, Failed: ${totalFailed}`);
    return { totalRun, totalFailed };
}
async function runCampaign(campaignId, campaignData) {
    const runCount = campaignData.run_count || 0;
    const maxRuns = campaignData.max_runs || 30;
    console.log(`[Campaign ${campaignId}] Running (${runCount + 1}/${maxRuns})...`);
    // Check if campaign has reached max runs
    if (runCount >= maxRuns) {
        console.log(`[Campaign ${campaignId}] Reached max runs, deactivating`);
        await firebase_admin_1.db.collection('creator_requests').doc(campaignId).update({
            is_active: false,
            updated_at: firestore_1.Timestamp.now()
        });
        // TODO: Send email to user
        return;
    }
    const userId = campaignData.user_id;
    const criteria = campaignData.criteria || {};
    const platform = campaignData.platforms?.[0] || 'instagram';
    // Get user's daily credit limit
    const userDoc = await firebase_admin_1.db.collection('user_accounts').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }
    const userData = userDoc.data();
    const dailyCredits = userData.email_quota_daily || 0;
    const creditsUsedToday = userData.email_used_today || 0;
    const creditsAvailable = dailyCredits - creditsUsedToday;
    if (creditsAvailable <= 0) {
        console.log(`[Campaign ${campaignId}] User has no credits available today`);
        return;
    }
    console.log(`[Campaign ${campaignId}] User has ${creditsAvailable} credits available`);
    // Get contacted creator IDs to avoid duplicates
    const contactedIds = campaignData.contacted_creator_ids || [];
    // Find new creators from Influencer Club
    console.log(`[Campaign ${campaignId}] Searching for creators...`);
    const creators = await influencer_club_client_1.influencerClubClient.discoverCreators({
        platform: platform,
        filters: {
            niche: criteria.niche,
            min_followers: criteria.min_followers || criteria.minFollowers || 1000,
            max_followers: criteria.max_followers || criteria.maxFollowers || 1000000
        },
        limit: creditsAvailable, // Request up to available credits
        offset: 0
    });
    if (creators.length === 0) {
        console.log(`[Campaign ${campaignId}] No new creators found`);
        // TODO: Send email to user to update search terms
        return;
    }
    // Filter out already contacted creators
    const newCreators = creators.filter(c => !contactedIds.includes(c.creator_id));
    if (newCreators.length === 0) {
        console.log(`[Campaign ${campaignId}] All creators already contacted`);
        return;
    }
    console.log(`[Campaign ${campaignId}] Found ${newCreators.length} new creators`);
    // Enrich with Clay to get emails
    console.log(`[Campaign ${campaignId}] Enriching with Clay...`);
    const enrichedCreators = await Promise.all(newCreators.map(async (creator) => {
        try {
            await clay_client_1.clayClient.enrichCreator({
                handle: creator.handle,
                platform: creator.platform,
                creatorId: creator.creator_id,
                userId: userId,
                name: creator.fullname,
                followers: creator.followers,
                campaignId: campaignId
            });
            // Clay enrichment is async, so we'll get emails later
            // For now, check if creator already has emails in database
            const creatorDoc = await firebase_admin_1.db.collection('creators')
                .where('handle', '==', creator.handle)
                .where('platform', '==', creator.platform)
                .where('emails', '!=', null)
                .limit(1)
                .get();
            if (!creatorDoc.empty) {
                const emails = creatorDoc.docs[0].data().emails || [];
                return { ...creator, emails };
            }
            return creator;
        }
        catch (error) {
            console.error(`[Campaign ${campaignId}] Clay enrichment failed for ${creator.handle}`);
            return creator;
        }
    }));
    // Filter creators with emails
    const creatorsWithEmails = enrichedCreators.filter(c => c.emails && c.emails.length > 0);
    console.log(`[Campaign ${campaignId}] ${creatorsWithEmails.length} creators have emails`);
    if (creatorsWithEmails.length === 0) {
        console.log(`[Campaign ${campaignId}] No creators with emails found after enrichment`);
        return;
    }
    // Queue for outreach (same day)
    const queueResult = await (0, outreach_queue_1.queueCreatorsForOutreach)({
        userId,
        creators: creatorsWithEmails.map(c => ({
            creator_id: c.creator_id,
            email: c.emails[0],
            handle: c.handle,
            platform: c.platform,
            name: c.fullname
        })),
        campaignId,
        requestId: campaignId
    });
    // Update campaign tracking
    const newContactedIds = [...contactedIds, ...newCreators.map(c => c.creator_id)];
    await firebase_admin_1.db.collection('creator_requests').doc(campaignId).update({
        run_count: runCount + 1,
        last_run_at: firestore_1.Timestamp.now(),
        contacted_creator_ids: newContactedIds,
        updated_at: firestore_1.Timestamp.now()
    });
    // Log campaign run
    await firebase_admin_1.db.collection('campaign_runs').add({
        campaign_id: campaignId,
        run_number: runCount + 1,
        run_date: new Date().toISOString().split('T')[0],
        creators_found: newCreators.length,
        emails_found: creatorsWithEmails.length,
        emails_queued: queueResult.queued,
        credits_used: queueResult.creditsUsed,
        status: 'success',
        created_at: firestore_1.Timestamp.now()
    });
    console.log(`[Campaign ${campaignId}] Run complete. Queued ${queueResult.queued} emails.`);
}
/**
 * Autopilot Discovery Engine
 * Automatically finds creators for users with enabled autopilot and remaining credits.
 */
async function runAutopilotDiscovery() {
    console.log('[Autopilot] Starting daily run...');
    // Get users with autopilot enabled
    const usersSnapshot = await firebase_admin_1.db.collection('user_accounts')
        .where('ai_autopilot_enabled', '==', true)
        .get();
    console.log(`[Autopilot] Found ${usersSnapshot.size} users with autopilot enabled.`);
    let totalProcessed = 0;
    const { discoveryPipeline } = await Promise.resolve().then(() => __importStar(require('./discovery-pipeline')));
    for (const userDoc of usersSnapshot.docs) {
        try {
            const userData = userDoc.data();
            const userId = userDoc.id;
            // Check credits
            const dailyQuota = userData.email_quota_daily || 0;
            const usedToday = userData.email_used_today || 0;
            const remaining = dailyQuota - usedToday;
            if (remaining <= 0) {
                console.log(`[Autopilot] User ${userId} has no credits left (${usedToday}/${dailyQuota}). Skipping.`);
                continue;
            }
            console.log(`[Autopilot] User ${userId} has ${remaining} credits. Initiating discovery...`);
            // Determine search criteria from last request
            const lastRequests = await firebase_admin_1.db.collection('creator_requests')
                .where('user_id', '==', userId)
                .orderBy('created_at', 'desc')
                .limit(1)
                .get();
            let criteria = { niche: "lifestyle", min_followers: 1000, max_followers: 500000 };
            let platform = 'instagram';
            if (!lastRequests.empty) {
                const lastReq = lastRequests.docs[0].data();
                if (lastReq.criteria)
                    criteria = lastReq.criteria;
                if (lastReq.platforms && lastReq.platforms.length > 0)
                    platform = lastReq.platforms[0];
            }
            // Create a record for this autopilot run
            const now = firestore_1.Timestamp.now();
            const requestRef = await firebase_admin_1.db.collection('creator_requests').add({
                user_id: userId,
                name: `Autopilot Run - ${new Date().toLocaleDateString()}`,
                platforms: [platform],
                criteria: criteria,
                status: 'in_progress',
                created_at: now,
                updated_at: now,
                is_autopilot: true
            });
            // Run Discovery
            const discoveryResult = await discoveryPipeline.discover({
                userId,
                filters: criteria,
                requestedCount: remaining,
                platform: platform,
                campaignId: requestRef.id
            });
            const foundCreators = discoveryResult.creators || [];
            console.log(`[Autopilot] Discovery yielded ${foundCreators.length} creators.`);
            // Filter for those with emails (already done in enrichment ideally, but double check)
            const creatorsWithEmails = foundCreators.filter(c => c.email && c.email.length > 0);
            if (creatorsWithEmails.length > 0) {
                console.log(`[Autopilot] Queuing ${creatorsWithEmails.length} creators for outreach for user ${userId}...`);
                const { queueCreatorsForOutreach } = await Promise.resolve().then(() => __importStar(require('./outreach-queue')));
                const queueResult = await queueCreatorsForOutreach({
                    userId,
                    creators: creatorsWithEmails.map(c => ({
                        creator_id: String(c.id),
                        email: c.email,
                        handle: c.handle,
                        platform: c.platform,
                        name: c.name || c.full_name || undefined
                    })),
                    campaignId: requestRef.id,
                    requestId: requestRef.id
                });
                console.log(`[Autopilot] Queued ${queueResult.queued} emails.`);
            }
            else {
                console.log(`[Autopilot] No creators with emails found to queue.`);
            }
            // Update status
            await requestRef.update({
                status: 'delivered', // Mark as done finding
                results_count: foundCreators.length,
                updated_at: firestore_1.Timestamp.now()
            });
            totalProcessed++;
        }
        catch (error) {
            console.error(`[Autopilot] Failed for user ${userDoc.id}:`, error);
        }
    }
    return { processed: totalProcessed };
}
