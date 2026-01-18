import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';
import { incrementEmailQuota, getUserAccount } from '@/lib/database';

// Re-implementing the cron logic but triggered manually for a user
export async function POST(req: NextRequest) {
    try {
        const { userId, campaignId } = await req.json();

        if (!userId || !campaignId) {
            return NextResponse.json({ error: 'Missing userId or campaignId' }, { status: 400 });
        }

        console.log(`[Debug] Force running search for campaign ${campaignId}`);

        const campaignDoc = await db.collection('creator_requests').doc(campaignId).get();
        if (!campaignDoc.exists) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const campaign = campaignDoc.data()!;

        // Quota Check
        const account = await getUserAccount(userId);
        if (!account) return NextResponse.json({ error: 'Account not found' });

        const remaining = account.email_quota_daily - account.email_used_today;
        if (remaining <= 0 && account.plan !== 'enterprise') {
            return NextResponse.json({ error: 'No quota execution skipped', remaining });
        }

        const batchSize = Math.min(campaign.criteria?.batchSize || 50, remaining);

        // Discovery
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
        const newIds = results.creators?.map(c => c.id).filter(Boolean) || [];

        if (foundCount > 0) {
            await incrementEmailQuota(userId, foundCount);

            await db.collection('creator_requests').doc(campaignId).update({
                last_run_at: Timestamp.now(),
                creator_ids: admin.firestore.FieldValue.arrayUnion(...newIds),
                results_count: admin.firestore.FieldValue.increment(foundCount)
            });

            // Schedule Emails for NEW findings
            // const { addCreatorsToQueue } = await import('@/lib/services/outreach-queue');
            // await addCreatorsToQueue(newIds.map(String), userId, campaignId, campaign.name);
        }

        // --- BACKLOG RECOVERY / ROBUST QUEUING ---
        // Ensure ALL creators in this campaign are queued, not just the new ones.
        // This fixes cases where previous runs found creators but failed to queue them.

        // 1. Get latest campaign state (including the just-added IDs)
        const updatedCampaignDoc = await db.collection('creator_requests').doc(campaignId).get();
        const allCreatorIds = (updatedCampaignDoc.data()?.creator_ids || []) as string[];

        // 2. Get currently queued items for this campaign to avoid re-queuing
        // Note: This might be large, so we select only creator_id
        const queueSnap = await db.collection('outreach_queue')
            .where('campaign_id', '==', campaignId)
            .select('creator_id')
            .get();

        const queuedCreatorIds = new Set(queueSnap.docs.map(d => d.data().creator_id));

        // 3. Find missing (Backlog)
        const missingIds = allCreatorIds.filter(id => !queuedCreatorIds.has(id));

        let backlogScheduled = 0;
        if (missingIds.length > 0) {
            console.log(`[Debug] Found ${missingIds.length} creators in backlog (found but not queued). Queuing now...`);
            const { addCreatorsToQueue } = await import('@/lib/services/outreach-queue');

            // Queue in batches if necessary, but addCreatorsToQueue handles batching internally for fetching.
            // Queue function also checks credits.
            const queueResult = await addCreatorsToQueue(missingIds, userId, campaignId, campaign.name);
            backlogScheduled = queueResult?.queued || 0;
        }

        return NextResponse.json({
            success: true,
            found: foundCount,
            newlyScheduled: foundCount,
            backlogScheduled: backlogScheduled,
            totalScheduled: (foundCount > 0 ? foundCount : 0) + backlogScheduled // Approximate (overlap handled above)
        });

    } catch (error: any) {
        console.error("Force Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
