
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/requests/results
 * Returns creators matching a set of filters (pulls from cache/DB)
 * This allows "Opening" an old search without making new external API calls
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const body = await request.json();
        const { platform, filters, requestedCount, requestId } = body;

        let targetCreatorIds: string[] = [];

        // If we have a requestId, try to get specific creators found for that request
        if (requestId) {
            const { db: adminDb } = await import('@/lib/firebase-admin');
            const reqDoc = await adminDb.collection('creator_requests').doc(requestId).get();
            if (reqDoc.exists) {
                const reqData = reqDoc.data();
                if (reqData?.user_id === userId && reqData?.creator_ids?.length > 0) {
                    targetCreatorIds = reqData.creator_ids;
                }
            }
        }

        // --- FETCH LOGIC ---
        let creators: any[] = [];

        if (targetCreatorIds.length > 0) {
            // Fetch specific creators by ID (Pinned results)
            const { db: adminDb } = await import('@/lib/firebase-admin');
            const creatorsRef = adminDb.collection('creators');
            const chunks = [];

            // Firestore 'in' queries are limited to 30 items
            for (let i = 0; i < targetCreatorIds.length; i += 30) {
                chunks.push(targetCreatorIds.slice(i, i + 30));
            }

            const results = await Promise.all(
                chunks.map(chunk => creatorsRef.where('__name__', 'in', chunk).get())
            );

            results.forEach(snap => {
                snap.forEach(doc => {
                    const data = doc.data();
                    const basic = data.basic_profile_data || {};
                    const profile = basic.profile || {};

                    creators.push({
                        id: doc.id,
                        ...data,
                        // Robust normalization for UI
                        name: data.name || basic.fullname || basic.full_name || profile.full_name || data.handle,
                        followers: data.followers || basic.followers || profile.followers || 0,
                        engagement_rate: data.engagement_rate || basic.engagement_rate || (profile.engagement_percent ? profile.engagement_percent / 100 : 0),
                        picture: data.picture || basic.picture || basic.profile_pic_url || profile.picture,
                        location: data.location || basic.location || basic.country || basic.geo_country,
                        email: data.email || basic.email || (basic.emails && basic.emails[0]) || null
                    });
                });
            });

            // Sort to match original order if possible, or just return
            console.log(`[Results] Fetching ${creators.length} specific creators for request ${requestId} for user ${userId}`);
        } else {
            // Fallback to Discovery Pipeline based on filters
            const url = new URL(request.url);
            const finalPlatform = platform || url.searchParams.get('platform');
            const finalCount = requestedCount || parseInt(url.searchParams.get('requestedCount') || '50');

            if (!finalPlatform) {
                return NextResponse.json({ error: 'Platform required' }, { status: 400 });
            }

            console.log(`[Results] Fetching old results for ${userId} on ${finalPlatform} with count ${finalCount}`);

            // We use the discoveryPipeline but we ensure it doesn't trigger NEW external searches
            // if we just want "cached" results. Actually, discoveryPipeline.discover already
            // checks DB first. If the campaign is old, it will definitely hit the DB.
            const results = await discoveryPipeline.discover({
                userId,
                platform: finalPlatform.toLowerCase() as any,
                filters: filters || {},
                requestedCount: finalCount,
            });
            creators = results.creators;

            // Self-healing: Update the original request document if it was missing results
            if (requestId && creators.length > 0) {
                try {
                    const { db: adminDb } = await import('@/lib/firebase-admin');
                    const { Timestamp } = await import('firebase-admin/firestore');
                    await adminDb.collection('creator_requests').doc(requestId).update({
                        results_count: creators.length,
                        creator_ids: creators.map(c => c.id).filter(Boolean),
                        status: 'delivered',
                        updated_at: Timestamp.now()
                    });
                    console.log(`[ResultsAPI] Self-healed request ${requestId} with ${creators.length} creators`);
                } catch (updateError) {
                    console.error(`[ResultsAPI] Failed to self-heal request ${requestId}:`, updateError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            creators,
        });

    } catch (error: any) {
        console.error('Error fetching request results:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
