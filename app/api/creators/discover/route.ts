import { NextRequest, NextResponse } from 'next/server';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';
import { auth } from '@/lib/firebase-admin';
import { Platform } from '@/lib/types';

/**
 * POST /api/creators/discover
 * Hybrid discovery and enrichment endpoint
 */
export async function POST(req: NextRequest) {
    try {
        let userId = 'system';

        // 1. Auth check
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (auth) {
                try {
                    const decodedToken = await auth.verifyIdToken(token);
                    userId = decodedToken.uid;

                    // --- NEW: Lite Plan restriction ---
                    const { db } = await import('@/lib/firebase-admin');
                    const userDoc = await db.collection('user_accounts').doc(userId).get();
                    const userData = userDoc.data();

                    if (userData?.plan === 'lite') {
                        return NextResponse.json({
                            error: 'Lite plan restriction',
                            message: 'Your plan only allows discovery via the Verality Chrome Extension. Please use the extension on YouTube or upgrade to a Pro plan for website-based search.'
                        }, { status: 403 });
                    }
                } catch (authError) {
                    console.error('Token verification failed:', authError);
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
        }

        const body = await req.json();
        const {
            platform = 'instagram',
            filters = {},
            requestedCount = 10
        } = body;

        // Validate inputs
        if (!['instagram', 'tiktok', 'youtube'].includes(platform)) {
            return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
        }

        if (requestedCount > 100) {
            return NextResponse.json({ error: 'Batch limit exceeded (max 100)' }, { status: 400 });
        }

        console.log(`[Discovery] User ${userId} requested ${requestedCount} creators on ${platform}`);

        // 2. Execute Pipeline
        const result = await discoveryPipeline.discover({
            userId,
            platform: platform as Platform,
            filters,
            requestedCount
        });

        // 3. Return results
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[Discovery API Error]:', error);
        return NextResponse.json({
            error: 'Failed to process discovery request',
            message: error.message
        }, { status: 500 });
    }
}
