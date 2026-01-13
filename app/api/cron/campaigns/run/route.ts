import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { CreatorRequest, getUserAccount } from '@/lib/database';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';
import { incrementEmailQuota } from '@/lib/database';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel functions (Pro)

export async function GET(req: NextRequest) {
    // 1. Auth Check (Cron Authorization)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow running without auth in dev if needed, or better, secure it.
        // For development, we can skip if CRON_SECRET is not set, 
        // but in production it's critical.
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('[CampaignCron] Starting daily campaign run...');

        // 2. Fetch Active Recurring Campaigns
        // Note: For now, we fetch ALL active recurring requests.
        // Logic: A "Campaign" is essentially a CreatorRequest that is flagged as recurring.

        let query = db.collection('creator_requests')
            .where('is_recurring', '==', true)
            .where('is_active', '==', true);

        // Optimization: Only run those that haven't run today?
        // Let's assume the cron runs once a day. 
        // Or we can check last_run_at.

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

                // Determine batch size (use remaining, but cap at say 50 or the original batch size)
                const originalBatchSize = campaign.criteria?.batchSize || 50;
                const batchSize = account.plan === 'enterprise'
                    ? originalBatchSize
                    : Math.min(originalBatchSize, remaining);

                if (batchSize <= 0) {
                    skipped++;
                    continue;
                }

                console.log(`[CampaignCron] Running campaign ${campaignId} for user ${userId}. Batch: ${batchSize}`);

                // B. Run Discovery
                // We re-use logic from user/requests/route.ts
                const platform = (campaign.platforms && campaign.platforms.length > 0)
                    ? campaign.platforms[0].toLowerCase()
                    : 'instagram';

                // IMPORTANT: We must ensure we don't find the same creators we already found for this campaign.
                // DiscoveryPipeline handles DB-level dedup (creators already in DB).
                // But if we want *new* creators, the pipeline handles that by checking if they are in 'creators' collection.
                // If a creator was found before (for another user), they are in 'creators'.
                // Discovery Pipeline logic: 
                // "Deduplicate against internal DB" -> it checks if creator is in DB.
                // If in DB, it returns them. 
                // Wait, if a creator is in DB, users CAN contact them again if THEY haven't contacted them.
                // But the user request is "fetching NEW creators every day". 
                // If "fetch new" means "new to the platform", that's what the pipeline does (checks 'creators' collection).
                // If it means "new to this user", we assume the pipeline or UI handles visibility.

                // ISSUE: discoveryPipeline filters out creators already in DB.
                // So if we run this daily, we might re-find old creators if we aren't careful?
                // No, discoveryPipeline: "if (!internalHandles.has(handle))... uniqueNewCreators.push(item)".
                // It fetches from External, then filters out those ALREADY in Internal DB.
                // Then it saves new ones.
                // So it essentially ALWAYS finds *net new* creators to the system.
                // This matches "fetching new creators every day".

                const results = await discoveryPipeline.discover({
                    userId,
                    platform: platform as any,
                    filters: campaign.criteria as any,
                    requestedCount: batchSize,
                    campaignId: campaignId,
                    // skipEnrichment: false is default/implied now
                });

                const foundCount = results.creators?.length || 0;

                if (foundCount > 0) {
                    // C. Charge Quota
                    await incrementEmailQuota(userId, foundCount);

                    // D. Update Campaign Stats/Log
                    // We append to creator_ids or just update last_run_at
                    const newIds = results.creators.map(c => c.id).filter(Boolean);

                    await db.collection('creator_requests').doc(campaignId).update({
                        last_run_at: Timestamp.now(),
                        creator_ids: admin.firestore.FieldValue.arrayUnion(...newIds),
                        results_count: admin.firestore.FieldValue.increment(foundCount)
                    });

                    totalCreatorsFound += foundCount;
                    console.log(`[CampaignCron] Success: Found ${foundCount} creators for ${campaignId}`);
                } else {
                    console.log(`[CampaignCron] No new creators found for ${campaignId}`);
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
