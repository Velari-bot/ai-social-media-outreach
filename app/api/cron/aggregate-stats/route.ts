import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/aggregate-stats
 * Daily cron job to pre-calculate system-wide admin stats to save Firestore reads.
 * Usually triggered by a VPS cron or Vercel Cron.
 */
export async function GET(req: NextRequest) {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('[AggregateStats] Starting aggregation...');

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const sevenDaysAgoDateStr = sevenDaysAgo.toISOString().split('T')[0];
        const fourteenDaysAgoDateStr = fourteenDaysAgo.toISOString().split('T')[0];

        // 1. Fetch data
        const pTotalUsersCount = db.collection('user_accounts').count().get();
        const pAffiliatesCount = db.collection('user_accounts').where('role', '==', 'affiliate').count().get();
        const pRecentBookings = db.collection('bookings').where('date', '>=', fourteenDaysAgoDateStr).get();

        // Fetch paid users for MRR (this is the most expensive read, but only once per day)
        const pPaidUsers = db.collection('user_accounts')
            .where('plan', 'in', ['basic', 'pro', 'growth', 'scale', 'enterprise', 'custom'])
            .get();

        const [rTotal, rAffiliates, rBookings, rPaid] = await Promise.all([
            pTotalUsersCount, pAffiliatesCount, pRecentBookings, pPaidUsers
        ]);

        const totalUsers = rTotal.data().count;
        const activeAffiliates = rAffiliates.data().count;
        const recentBookings = rBookings.docs.map(doc => doc.data());
        const paidUsers = rPaid.docs.map(doc => doc.data());

        // 2. Process Stats
        const PLAN_PRICES: Record<string, number> = {
            'basic': 400,
            'pro': 600,
            'growth': 900,
            'scale': 1500,
            'enterprise': 2500,
            'custom': 2500
        };

        const mrr = paidUsers.reduce((sum, user: any) => {
            if (user.role === 'admin') return sum;
            const plan = user.plan?.toLowerCase();
            return sum + (PLAN_PRICES[plan] || 0);
        }, 0);

        const paidUsersCount = paidUsers.filter((u: any) => u.role !== 'admin').length;
        const stripeFees = (mrr * 0.029) + (paidUsersCount * 0.30);
        const netMrr = mrr - stripeFees;

        const bookedCallsWeek = recentBookings.filter(b => b.date >= sevenDaysAgoDateStr).length;
        const bookedCallsPrevious = recentBookings.filter(b => b.date >= fourteenDaysAgoDateStr && b.date < sevenDaysAgoDateStr).length;
        const bookedCallsChange = bookedCallsPrevious > 0
            ? ((bookedCallsWeek - bookedCallsPrevious) / bookedCallsPrevious) * 100
            : 0;

        // 3. Daily Data (Chart)
        const dailyData: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayBookings = recentBookings.filter(b => b.date === dateStr).length;

            dailyData.push({
                date: dateStr,
                bookings: dayBookings,
                signups: 0 // If we want signups, we'd need another query or analyze timestamps
            });
        }

        const stats = {
            totalUsers,
            totalUsersChange: "0.0",
            bookedCallsWeek,
            bookedCallsChange: bookedCallsChange.toFixed(1),
            activeAffiliates,
            activeAffiliatesChange: "0.0",
            mrr,
            stripeFees,
            netMrr,
            mrrChange: "0.0",
            dailyData,
            updated_at: Timestamp.now()
        };

        // 4. Save to Firestore
        await db.collection('admin_settings').doc('system_stats').set(stats);

        return NextResponse.json({
            success: true,
            message: 'Stats aggregated and saved.',
            timestamp: now.toISOString()
        });

    } catch (error: any) {
        console.error('[AggregateStats] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
