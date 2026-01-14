import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

/**
 * GET /api/user/requests/[id]
 * Fetch a specific request and its associated full creator records
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const requestId = params.id;

        // 1. Get Request from DB
        const requestDoc = await db.collection('creator_requests').doc(requestId).get();
        if (!requestDoc.exists) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const requestData = requestDoc.data();
        if (requestData?.user_id !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Resolve Creator IDs to full objects
        const creatorIds = requestData?.creator_ids || [];
        if (creatorIds.length === 0) {
            return NextResponse.json({ success: true, request: { id: requestId, ...requestData }, creators: [] });
        }

        // Fetch creators in batches of 30 (Firestore limit for 'in' query)
        const creators: any[] = [];
        for (let i = 0; i < creatorIds.length; i += 30) {
            const batch = creatorIds.slice(i, i + 30);
            const snapshot = await db.collection('creators')
                .where('__name__', 'in', batch)
                .get();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                creators.push({
                    id: doc.id,
                    ...data,
                    // Normalize dates for frontend
                    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
                });
            });
        }

        // Sort by original order of IDs if possible or just return
        const sortedCreators = creatorIds.map((id: string) => creators.find(c => c.id === id)).filter(Boolean);

        return NextResponse.json({
            success: true,
            request: { id: requestId, ...requestData },
            creators: sortedCreators
        });

    } catch (error: any) {
        console.error('Fetch request details failed:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
