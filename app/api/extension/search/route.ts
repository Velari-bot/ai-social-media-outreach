import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyExtensionToken } from '@/lib/extension-auth';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyExtensionToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const { userId } = payload;
        const body = await req.json();
        const { query, limit = 50, platform = 'youtube', niche, creators: foundCreators = [] } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Resolve User & Check Subscription/Quota
        const userRef = db.collection('user_accounts').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (!userData) {
            return NextResponse.json({ error: 'User account not found' }, { status: 404 });
        }

        const activePlans = ['lite', 'basic', 'pro', 'growth', 'scale', 'custom', 'enterprise'];
        if (!activePlans.includes(userData.plan || '')) {
            return NextResponse.json({
                error: 'Active subscription required',
                details: 'Please upgrade your plan to use the Verality Extension.'
            }, { status: 403 });
        }

        const remainingQuota = (userData.email_quota_daily || 0) - (userData.email_used_today || 0);

        if (remainingQuota < 1 && userData.plan !== 'enterprise') {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 403 });
        }

        // --- NEW: Handle Client-Side Sync ---
        if (query === 'SYNC_FROM_CLIENT') {
            const now = Timestamp.now();

            // 1.5 Deduct credits per creator (0.5 credits each, round up)
            if (foundCreators.length > 0) {
                const searchCost = Math.ceil(foundCreators.length * 0.5);
                await userRef.update({
                    email_used_today: FieldValue.increment(searchCost),
                    email_used_this_month: FieldValue.increment(searchCost),
                    updated_at: now
                });
            }

            // 1. Create a Campaign (creator_requests)
            const campaignId = await db.runTransaction(async (transaction) => {
                const campaignRef = db.collection('creator_requests').doc();
                const campaignData = {
                    user_id: userId,
                    name: `Extension: ${niche || 'Niche Search'}`,
                    status: 'delivered',
                    platforms: ['youtube'],
                    results_count: foundCreators.length,
                    creator_ids: foundCreators.map((c: any) => c.id),
                    criteria: { niche: niche },
                    is_recurring: false,
                    date_submitted: now,
                    created_at: now,
                    updated_at: now
                };
                transaction.set(campaignRef, campaignData);
                return campaignRef.id;
            });

            // 2. Upsert Creators & Queue Outreach
            if (foundCreators.length > 0) {
                const batch = db.batch();
                foundCreators.forEach((c: any) => {
                    const creatorRef = db.collection('creators').doc(c.id);
                    batch.set(creatorRef, {
                        id: c.id,
                        handle: c.handle,
                        name: c.name,
                        platform: 'youtube',
                        email: c.email || null,
                        email_found: !!c.email,
                        updated_at: now
                    }, { merge: true });
                });
                await batch.commit();

                // Trigger Outreach (handles its own 1-credit-per-email deduction)
                const { addCreatorsToQueue } = await import('@/lib/services/outreach-queue');
                await addCreatorsToQueue(
                    foundCreators.map((c: any) => c.id),
                    userId,
                    campaignId,
                    `Extension: ${niche || 'Niche Search'}`
                );

                // --- NEW: Trigger Clay for those WITHOUT emails (NON-BLOCKING) ---
                const missingEmails = foundCreators.filter((c: any) => !c.email);
                if (missingEmails.length > 0) {
                    const { clayClient } = await import('@/lib/services/clay-client');
                    // We don't await this so the extension gets a fast response
                    // The serverless function will continue until these finish or it timeouts
                    Promise.all(missingEmails.slice(0, 50).map(async (c: any) => {
                        try {
                            await clayClient.enrichCreator({
                                creatorId: c.id,
                                handle: c.handle,
                                platform: 'youtube',
                                name: c.name,
                                niche: niche || "",
                                userId: userId,
                                campaignId: campaignId,
                                campaignName: `Extension: ${niche || 'Niche Search'}`
                            });
                        } catch (e: any) {
                            console.error(`[Extension Sync] Clay push failed for ${c.id}:`, e);
                        }
                    })).catch(e => console.error("[Extension Sync] Clay batch failed:", e));
                }
            }

            // 3. Get UPDATED Credits
            const updatedUserDoc = await db.collection('user_accounts').doc(userId).get();
            const updatedUserData = updatedUserDoc.data();
            const creditsRemaining = (updatedUserData?.email_quota_daily || 0) - (updatedUserData?.email_used_today || 0);

            return NextResponse.json({
                success: true,
                campaignId: campaignId,
                creditsRemaining: Math.max(0, creditsRemaining)
            });
        }

        // --- Standard Server-Side Discovery Pipeline ---
        // 4. Run Search
        const results = await discoveryPipeline.discover({
            userId,
            platform: platform.toLowerCase() as any,
            filters: { ...body.criteria, niche: niche || query },
            requestedCount: limit
        });

        // 5. Deduct Credits only if results found (0.5 per creator)
        if (results.creators && results.creators.length > 0) {
            const searchCost = Math.ceil(results.creators.length * 0.5);
            await userRef.update({
                email_used_today: FieldValue.increment(searchCost),
                email_used_this_month: FieldValue.increment(searchCost),
                updated_at: Timestamp.now()
            });
        }

        return NextResponse.json({
            success: true,
            creators: results.creators,
            meta: results.meta
        });

    } catch (error: any) {
        console.error('[Extension Search API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
