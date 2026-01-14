/**
 * Cron Job: Reset Daily Credits
 * Runs every day at midnight
 * URL: /api/cron/credits/reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Credit Reset] Starting daily credit reset...');

        // Get all user accounts
        const usersSnapshot = await db.collection('user_accounts').get();

        const batch = db.batch();
        let resetCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            // Reset email_used_today to 0
            batch.update(userDoc.ref, {
                email_used_today: 0,
                last_daily_reset_at: Timestamp.now(),
                updated_at: Timestamp.now()
            });
            resetCount++;
        }

        await batch.commit();

        console.log(`[Credit Reset] Reset credits for ${resetCount} users`);

        return NextResponse.json({
            success: true,
            usersReset: resetCount,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Cron: Credit Reset] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
