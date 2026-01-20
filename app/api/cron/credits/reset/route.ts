/**
 * Cron Job: Reset Daily Credits
 * Runs every day at midnight
 * URL: /api/cron/credits/reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

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

        if (!usersSnapshot.empty) {
            await batch.commit();
        }

        console.log(`[Credit Reset] Reset user credits for ${resetCount} users`);

        // SECONDARY: Reset Gmail Connection Daily Limits
        const connectionsSnapshot = await db.collection('gmail_connections').get();
        const connBatch = db.batch();
        let connResetCount = 0;

        for (const connDoc of connectionsSnapshot.docs) {
            const data = connDoc.data();
            let hasChanges = false;
            let updates: any = {};

            // Reset legacy single account
            if (data.sent_today > 0) {
                updates.sent_today = 0;
                hasChanges = true;
            }

            // Reset multi-accounts
            if (data.accounts && Array.isArray(data.accounts)) {
                const updatedAccounts = data.accounts.map((acc: any) => ({
                    ...acc,
                    sent_today: 0
                }));
                // Only update if actually different to save writes? 
                // Hard to equality check easily, just update ensures consistency.
                updates.accounts = updatedAccounts;
                hasChanges = true;
            }

            if (hasChanges) {
                updates.last_daily_reset_at = Timestamp.now();
                connBatch.update(connDoc.ref, updates);
                connResetCount++;
            }
        }

        if (connResetCount > 0) {
            await connBatch.commit();
            console.log(`[Credit Reset] Reset Gmail limits for ${connResetCount} connections`);
        }

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
