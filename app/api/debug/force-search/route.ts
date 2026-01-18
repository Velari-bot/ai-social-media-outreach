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

            // Schedule Emails
            const { addCreatorsToQueue } = await import('@/lib/services/outreach-queue');
            await addCreatorsToQueue(newIds.map(String), userId, campaignId, campaign.name);
        }

        return NextResponse.json({
            success: true,
            found: foundCount,
            scheduled: foundCount
        });

    } catch (error: any) {
        console.error("Force Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
