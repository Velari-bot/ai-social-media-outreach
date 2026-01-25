/**
 * API Route: Get A/B Test Results for Campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-helpers';
import { calculateABTestResults } from '@/lib/services/ab-test-service';

export async function GET(req: NextRequest) {
    try {
        const userId = await verifyAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaignId');

        if (!campaignId) {
            return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
        }

        const results = await calculateABTestResults(campaignId);

        if (!results) {
            return NextResponse.json({
                success: false,
                error: 'No A/B test found for this campaign'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            results
        });
    } catch (error: any) {
        console.error('[A/B Test Results API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to get A/B test results'
        }, { status: 500 });
    }
}
