/**
 * API Route: Mark Thread as Interested
 * Allows users to manually mark a conversation as interested
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-admin';
import { markThreadAsInterested } from '@/lib/services/metrics-calculator';

export async function POST(req: NextRequest) {
    try {
        const userId = await verifyAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { threadId } = body;

        if (!threadId) {
            return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
        }

        const success = await markThreadAsInterested(threadId, userId);

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Thread marked as interested'
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'Failed to mark thread as interested'
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[Mark Interested API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to mark interested'
        }, { status: 500 });
    }
}
