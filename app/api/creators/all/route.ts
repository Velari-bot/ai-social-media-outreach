/**
 * API Endpoint: Get All Creators for User
 * GET /api/creators/all
 * Returns all creators from all accumulated requests for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

// Force dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Get auth token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // 1. Get all requests by this user to find the creator IDs they have "collected"
        const requestsSnapshot = await db.collection('creator_requests')
            .where('user_id', '==', userId)
            // .orderBy('created_at', 'desc') // Optional: if we want to process recent ones first
            .get();

        if (requestsSnapshot.empty) {
            return NextResponse.json({
                success: true,
                creators: [],
                total: 0
            });
        }

        // 2. Collect unique creator IDs
        const creatorIds = new Set<string>();
        requestsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.creator_ids)) {
                data.creator_ids.forEach((id: string | number) => creatorIds.add(String(id)));
            }
        });

        if (creatorIds.size === 0) {
            return NextResponse.json({
                success: true,
                creators: [],
                total: 0
            });
        }

        // 3. Fetch all creator documents efficiently
        // Firestore 'getAll' supports up to varying limits, but usually it's robust for hundreds.
        // If we have thousands, we might need to chunk this. For now, assuming < 500 active creators per user session often.
        const refs = Array.from(creatorIds).map(id => db.collection('creators').doc(id));

        // Chunking refs to be safe (e.g. 100 at a time) if needed, but getAll usually handles list.
        // Let's rely on getAll for now.
        const creatorDocs = await db.getAll(...refs);

        // 4. Map to Creator objects
        const creators = creatorDocs
            .filter(doc => doc.exists)
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Ensure dates are serialized
                    created_at: data?.created_at?.toDate?.()?.toISOString() || data?.created_at,
                    updated_at: data?.updated_at?.toDate?.()?.toISOString() || data?.updated_at,
                    clay_enriched_at: data?.clay_enriched_at?.toDate?.()?.toISOString() || data?.clay_enriched_at,
                };
            });

        return NextResponse.json({
            success: true,
            creators: creators,
            total: creators.length
        });

    } catch (error: any) {
        console.error('[Get All Creators] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
