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
        const { query, limit = 50, platform = 'instagram' } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // 1. Calculate Cost
        // User requested: 25 credits per 50 creators
        const COST_PER_50 = 25;
        const blocks = Math.max(1, Math.ceil(limit / 50));
        const cost = blocks * COST_PER_50;

        // 2. Enforce Credits (Atomic)
        const userRef = db.collection('user_accounts').doc(userId);

        // We do a transaction to ensure atomic deduct
        const result = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error('User not found');
            }

            const userData = userDoc.data();
            const totalQuota = userData?.email_quota_daily || 0;
            const usedToday = userData?.email_used_today || 0;
            const remaining = totalQuota - usedToday;

            if (remaining < cost && userData?.plan !== 'enterprise') {
                return { error: 'INSUFFICIENT_CREDITS', remaining, cost };
            }

            // Deduct credits
            transaction.update(userRef, {
                email_used_today: FieldValue.increment(cost),
                updated_at: Timestamp.now()
            });

            return { success: true, newRemaining: remaining - cost };
        });

        if ('error' in result) {
            return NextResponse.json(result, { status: 402 }); // Payment Required
        }

        // 3. Run Search
        const searchResponse = await discoveryPipeline.discover({
            userId,
            platform: platform as any,
            filters: { niche: query, platform: platform as any },
            requestedCount: limit,
            skipEnrichment: true // Extension usually wants fast results first
        });

        return NextResponse.json({
            results: searchResponse.creators,
            creditsConsumed: cost,
            creditsRemaining: result.newRemaining
        });

    } catch (error: any) {
        console.error('Extension search error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
