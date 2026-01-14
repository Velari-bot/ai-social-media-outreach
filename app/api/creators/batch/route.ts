import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

/**
 * POST /api/creators/batch
 * Resolve multiple creator IDs to full objects
 * Used for "Refresh Status" without re-triggering enrichment
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: true, creators: [] });
        }

        const creators: any[] = [];
        // Firestore 'in' limit is 30
        for (let i = 0; i < ids.length; i += 30) {
            const batch = ids.slice(i, i + 30);
            const snapshot = await db.collection('creators')
                .where('__name__', 'in', batch)
                .get();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                creators.push({
                    id: doc.id,
                    ...data,
                    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
                });
            });
        }

        // Keep the original order
        const sortedCreators = ids.map(id => creators.find(c => c.id === id)).filter(Boolean);

        return NextResponse.json({
            success: true,
            creators: sortedCreators
        });

    } catch (error: any) {
        console.error('Batch fetch failed:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
