/**
 * API Route: Get Outcome-Level Metrics
 * Returns key business metrics for predictability
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { calculateOutcomeMetrics } from '@/lib/services/metrics-calculator';

export async function GET(req: NextRequest) {
    try {
        const userId = await verifyAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const metrics = await calculateOutcomeMetrics(userId);

        return NextResponse.json({
            success: true,
            metrics
        });
    } catch (error: any) {
        console.error('[Outcome Metrics API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to calculate metrics'
        }, { status: 500 });
    }
}
