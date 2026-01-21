/**
 * Cron Job: Send Scheduled Outreach Emails
 * Runs every 5 minutes
 * URL: /api/cron/outreach/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledEmails } from '@/lib/services/outreach-sender';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await sendScheduledEmails();

        return NextResponse.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Cron: Outreach Send] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
// Force deploy
