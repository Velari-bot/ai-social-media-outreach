/**
 * API Endpoint: Get All Creators for User
 * GET /api/creators/all
 * Returns all creators from all campaigns for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from 'firebase-admin';

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

        // Get all creators for this user
        const creatorsSnapshot = await db.collection('creators')
            .where('user_id', '==', userId)
            .orderBy('created_at', 'desc')
            .get();

        const creators = creatorsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
            };
        });

        // Get unique count stats (deduplicate by handle)
        const uniqueCreators = new Map<string, any>();
        creators.forEach((creator: any) => {
            if (!uniqueCreators.has(creator.handle)) {
                uniqueCreators.set(creator.handle, creator);
            }
        });

        return NextResponse.json({
            success: true,
            creators: Array.from(uniqueCreators.values()),
            total: uniqueCreators.size,
            totalRecords: creators.length
        });

    } catch (error: any) {
        console.error('[Get All Creators] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
