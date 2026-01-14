/**
 * Recurring Campaign Engine
 * Runs active campaigns daily, finds new creators, enriches with Clay, and queues for outreach
 */

import { db } from '../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { influencerClubClient } from './influencer-club-client';
import { clayClient } from './clay-client';
import { queueCreatorsForOutreach } from './outreach-queue';

export async function runRecurringCampaigns() {
    console.log('[Campaign Engine] Starting daily campaign run...');

    // Get all active recurring campaigns
    const campaignsSnapshot = await db.collection('creator_requests')
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
        } catch (error: any) {
            console.error(`[Campaign Engine] Failed to run campaign ${campaignDoc.id}:`, error.message);
            totalFailed++;
        }
    }

    console.log(`[Campaign Engine] Complete. Ran: ${totalRun}, Failed: ${totalFailed}`);
    return { totalRun, totalFailed };
}

async function runCampaign(campaignId: string, campaignData: any) {
    const runCount = campaignData.run_count || 0;
    const maxRuns = campaignData.max_runs || 30;

    console.log(`[Campaign ${campaignId}] Running (${runCount + 1}/${maxRuns})...`);

    // Check if campaign has reached max runs
    if (runCount >= maxRuns) {
        console.log(`[Campaign ${campaignId}] Reached max runs, deactivating`);
        await db.collection('creator_requests').doc(campaignId).update({
            is_active: false,
            updated_at: Timestamp.now()
        });

        // TODO: Send email to user
        return;
    }

    const userId = campaignData.user_id;
    const criteria = campaignData.criteria || {};
    const platform = campaignData.platforms?.[0] || 'instagram';

    // Get user's daily credit limit
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    if (!userDoc.exists) {
        throw new Error('User not found');
    }

    const userData = userDoc.data()!;
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
    const creators = await influencerClubClient.discoverCreators({
        platform: platform as any,
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
    const enrichedCreators = await Promise.all(
        newCreators.map(async (creator) => {
            try {
                await clayClient.enrichCreator({
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
                const creatorDoc = await db.collection('creators')
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
            } catch (error) {
                console.error(`[Campaign ${campaignId}] Clay enrichment failed for ${creator.handle}`);
                return creator;
            }
        })
    );

    // Filter creators with emails
    const creatorsWithEmails = enrichedCreators.filter(c => c.emails && c.emails.length > 0);

    console.log(`[Campaign ${campaignId}] ${creatorsWithEmails.length} creators have emails`);

    if (creatorsWithEmails.length === 0) {
        console.log(`[Campaign ${campaignId}] No creators with emails found after enrichment`);
        return;
    }

    // Queue for outreach (same day)
    const queueResult = await queueCreatorsForOutreach({
        userId,
        creators: creatorsWithEmails.map(c => ({
            creator_id: c.creator_id,
            email: c.emails![0],
            handle: c.handle,
            platform: c.platform,
            name: c.fullname
        })),
        campaignId,
        requestId: campaignId
    });

    // Update campaign tracking
    const newContactedIds = [...contactedIds, ...newCreators.map(c => c.creator_id)];

    await db.collection('creator_requests').doc(campaignId).update({
        run_count: runCount + 1,
        last_run_at: Timestamp.now(),
        contacted_creator_ids: newContactedIds,
        updated_at: Timestamp.now()
    });

    // Log campaign run
    await db.collection('campaign_runs').add({
        campaign_id: campaignId,
        run_number: runCount + 1,
        run_date: new Date().toISOString().split('T')[0],
        creators_found: newCreators.length,
        emails_found: creatorsWithEmails.length,
        emails_queued: queueResult.queued,
        credits_used: queueResult.creditsUsed,
        status: 'success',
        created_at: Timestamp.now()
    });

    console.log(`[Campaign ${campaignId}] Run complete. Queued ${queueResult.queued} emails.`);
}

/**
 * Autopilot Discovery Engine
 * Automatically finds creators for users with enabled autopilot and remaining credits.
 */
export async function runAutopilotDiscovery() {
    console.log('[Autopilot] Starting daily run...');

    // Get users with autopilot enabled
    const usersSnapshot = await db.collection('user_accounts')
        .where('ai_autopilot_enabled', '==', true)
        .get();

    console.log(`[Autopilot] Found ${usersSnapshot.size} users with autopilot enabled.`);
    let totalProcessed = 0;

    const { discoveryPipeline } = await import('./discovery-pipeline');

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
            const lastRequests = await db.collection('creator_requests')
                .where('user_id', '==', userId)
                .orderBy('created_at', 'desc')
                .limit(1)
                .get();

            let criteria: any = { niche: "lifestyle", min_followers: 1000, max_followers: 500000 };
            let platform: any = 'instagram';

            if (!lastRequests.empty) {
                const lastReq = lastRequests.docs[0].data();
                if (lastReq.criteria) criteria = lastReq.criteria;
                if (lastReq.platforms && lastReq.platforms.length > 0) platform = lastReq.platforms[0];
            }

            // Create a record for this autopilot run
            const now = Timestamp.now();
            const requestRef = await db.collection('creator_requests').add({
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
            await discoveryPipeline.discover({
                userId,
                filters: criteria,
                requestedCount: remaining,
                platform: platform,
                campaignId: requestRef.id
            });

            // Update status
            await requestRef.update({
                status: 'delivered', // Mark as done finding
                results_count: remaining, // This is an estimate, updated by pipeline ideally
                updated_at: Timestamp.now()
            });

            totalProcessed++;

        } catch (error) {
            console.error(`[Autopilot] Failed for user ${userDoc.id}:`, error);
        }
    }

    return { processed: totalProcessed };
}
