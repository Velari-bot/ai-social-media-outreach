/**
 * Cron Job: Monitor Replies
 * Runs every 5 minutes
 * URL: /api/cron/outreach/monitor
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitorAllReplies } from '@/lib/services/reply-monitor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await monitorAllReplies();

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Cron: Reply Monitor] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
