/**
 * Cron Job: Run Recurring Campaigns Daily
 * Runs every day at 9 AM
 * URL: /api/cron/campaigns/daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { runRecurringCampaigns, runAutopilotDiscovery } from '@/lib/services/campaign-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting daily jobs...');

        // 1. Run Recurring Campaigns
        const campaignsResult = await runRecurringCampaigns();

        // 2. Run Autopilot Discovery
        const autopilotResult = await runAutopilotDiscovery();

        return NextResponse.json({
            success: true,
            campaigns: campaignsResult,
            autopilot: autopilotResult,
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
