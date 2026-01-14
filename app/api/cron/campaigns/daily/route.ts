/**
 * Cron Job: Run Recurring Campaigns Daily
 * Runs every day at 9 AM
 * URL: /api/cron/campaigns/daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { runRecurringCampaigns } from '@/lib/services/campaign-engine';

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runRecurringCampaigns();

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Cron: Daily Campaigns] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
