import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { CreatorRequest, getUserAccount } from '@/lib/database';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel functions (Pro)

export async function GET(req: NextRequest) {
    // 1. Auth Check (Cron Authorization)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('[CampaignCron] Starting daily campaign run...');

        // 2. Fetch Active Recurring Campaigns
        let query = db.collection('creator_requests')
            .where('is_recurring', '==', true)
            .where('is_active', '==', true);

        const snapshot = await query.get();
        if (snapshot.empty) {
            return NextResponse.json({ message: 'No active campaigns found.' });
        }

        console.log(`[CampaignCron] Found ${snapshot.size} active campaigns.`);

        let processed = 0;
        let skipped = 0;
        let totalCreatorsFound = 0;

        // 3. Process each campaign
        for (const doc of snapshot.docs) {
            const campaign = doc.data() as CreatorRequest;
            const campaignId = doc.id;
            const userId = campaign.user_id;

            try {
                // A. Quota Check
                const account = await getUserAccount(userId);
                if (!account) {
                    console.log(`[CampaignCron] User ${userId} not found, skipping campaign ${campaignId}`);
                    skipped++;
                    continue;
                }

                const remaining = account.email_quota_daily - account.email_used_today;
                if (remaining <= 0 && account.plan !== 'enterprise') {
                    console.log(`[CampaignCron] User ${userId} out of quota (${account.email_used_today}/${account.email_quota_daily}). Skipping.`);
                    skipped++;
                    continue;
                }

                // 1. Check Duration / Expiry
                if (campaign.recurring_config?.duration_days && campaign.recurring_config.duration_days > 0) {
                    const createdAt = campaign.created_at;
                    const startDate = typeof createdAt === 'string' ? new Date(createdAt) : (createdAt as any).toDate();
                    const expiryDate = new Date(startDate);
                    expiryDate.setDate(expiryDate.getDate() + campaign.recurring_config.duration_days);

                    if (new Date() > expiryDate) {
                        console.log(`[CampaignCron] Campaign ${campaignId} expired. Stopping.`);
                        await db.collection('creator_requests').doc(campaignId).update({
                            is_active: false,
                            status: 'completed',
                            updated_at: Timestamp.now()
                        });
                        continue;
                    }
                }

                // 2. Determine Batch Size
                const campaignDailyLimit = campaign.recurring_config?.daily_limit || 200;
                const effectiveLimit = Math.min(remaining, campaignDailyLimit, 200);
                const batchSize = account.plan === 'enterprise'
                    ? Math.min(campaignDailyLimit, 500)
                    : effectiveLimit;

                if (batchSize <= 0) {
                    skipped++;
                    continue;
                }

                // 3. Rate Limit: Only run once every 20 hours
                if (campaign.last_run_at) {
                    const lastRun = typeof campaign.last_run_at === 'string' ? new Date(campaign.last_run_at) : (campaign.last_run_at as any).toDate();
                    const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
                    if (hoursSinceLastRun < 20) {
                        console.log(`[CampaignCron] Campaign ${campaignId} ran ${hoursSinceLastRun.toFixed(1)}h ago. Skipping.`);
                        skipped++;
                        continue;
                    }
                }

                console.log(`[CampaignCron] Running campaign ${campaignId} for user ${userId}. Batch: ${batchSize}`);

                // B. Run Discovery
                const platform = (campaign.platforms && campaign.platforms.length > 0)
                    ? campaign.platforms[0].toLowerCase()
                    : 'instagram';

                const results = await discoveryPipeline.discover({
                    userId,
                    platform: platform as any,
                    filters: campaign.criteria as any,
                    requestedCount: batchSize,
                    campaignId: campaignId,
                    startingOffset: campaign.results_count || 0
                });

                const foundCount = results.creators?.length || 0;

                // D. Update Campaign Stats/Log
                const newIds = results.creators.map(c => c.id).filter(Boolean);

                const campaignUpdates: any = {
                    last_run_at: Timestamp.now(),
                    updated_at: Timestamp.now()
                };

                if (foundCount > 0) {
                    campaignUpdates.creator_ids = admin.firestore.FieldValue.arrayUnion(...newIds);
                    campaignUpdates.results_count = admin.firestore.FieldValue.increment(foundCount);
                    totalCreatorsFound += foundCount;
                    console.log(`[CampaignCron] Success: Found ${foundCount} creators for ${campaignId}`);
                } else {
                    console.log(`[CampaignCron] No new creators found for ${campaignId}`);
                }

                await db.collection('creator_requests').doc(campaignId).update(campaignUpdates);

                // E. ROBUST QUEUING
                const updatedCampaignDoc = await db.collection('creator_requests').doc(campaignId).get();
                const allCreatorIds = (updatedCampaignDoc.data()?.creator_ids || []) as string[];

                const queueSnap = await db.collection('outreach_queue')
                    .where('campaign_id', '==', campaignId)
                    .select('creator_id')
                    .get();

                const queuedCreatorIds = new Set(queueSnap.docs.map(d => d.data().creator_id));
                const idsToQueue = allCreatorIds.filter(id => !queuedCreatorIds.has(id));

                if (idsToQueue.length > 0) {
                    console.log(`[CampaignCron] Processing backlog/new items. Attempting to queue ${idsToQueue.length} creators...`);
                    const { addCreatorsToQueue } = await import('@/lib/services/outreach-queue');
                    await addCreatorsToQueue(idsToQueue, userId, campaignId, campaign.name);
                }

                processed++;

            } catch (err: any) {
                console.error(`[CampaignCron] Error processing campaign ${campaignId}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            processed,
            skipped,
            totalCreatorsFound
        });

    } catch (error: any) {
        console.error('[CampaignCron] Fatal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
