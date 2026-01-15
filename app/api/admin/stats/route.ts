
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// In-memory cache for admin stats
let cachedStats: { data: any, timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * GET /api/admin/stats
 * Main admin dashboard stats API with multi-layer caching (Memory -> Firestore Aggregates -> Live)
 */
export async function GET() {
    try {
        if (!db) {
            throw new Error('Database not initialized');
        }

        const nowTime = Date.now();

        // 1. Layer 1: In-Memory Cache (Blazing Fast)
        if (cachedStats && (nowTime - cachedStats.timestamp < CACHE_TTL)) {
            console.log('[AdminStats] Cache Hit: Memory');
            return NextResponse.json({
                success: true,
                stats: cachedStats.data,
                cached: 'memory'
            });
        }

        // 2. Layer 2: Pre-Calculated Stats from Firestore (High Scale)
        try {
            const systemStatsDoc = await db.collection('admin_settings').doc('system_stats').get();
            if (systemStatsDoc.exists) {
                const data = systemStatsDoc.data()!;
                const updatedAt = data.updated_at?.toDate?.() || new Date(0);
                const isRecent = (nowTime - updatedAt.getTime()) < (24 * 60 * 60 * 1000); // Valid for 24h

                if (isRecent) {
                    console.log('[AdminStats] Cache Hit: Firestore Aggregates');
                    const { updated_at, ...statsOnly } = data;

                    // Update memory cache
                    cachedStats = { data: statsOnly, timestamp: nowTime };

                    return NextResponse.json({
                        success: true,
                        stats: statsOnly,
                        cached: 'firestore'
                    });
                }
            }
        } catch (e) {
            console.warn('[AdminStats] Aggregated stats read failed:', e);
        }

        // 3. Layer 3: Live Calculation (Optimized Fallback)
        console.log('[AdminStats] Cache Miss: Performing live calculation...');
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const sevenDaysAgoDateStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const fourteenDaysAgoDateStr = fourteenDaysAgo.toISOString().split('T')[0];

        // Optimized Queries - Use count() to save reads
        const pTotalUsersCount = db.collection('user_accounts').count().get();
        const pAffiliatesCount = db.collection('user_accounts').where('role', '==', 'affiliate').count().get();
        const pRecentBookings = db.collection('bookings').where('date', '>=', fourteenDaysAgoDateStr).get();

        // Fetch only paid users for MRR calculation
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

        const dailyData: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const dayBookings = recentBookings.filter(b => b.date === dateStr).length;

            dailyData.push({
                date: dateStr,
                bookings: dayBookings,
                signups: 0
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
            dailyData
        };

        // Update memory cache
        cachedStats = { data: stats, timestamp: nowTime };

        return NextResponse.json({
            success: true,
            stats,
            cached: 'none'
        });

    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        const isQuotaError = error.message?.includes('Quota exceeded') || error.code === 8;
        return NextResponse.json({
            success: false,
            error: isQuotaError
                ? 'Firestore Quota Exceeded. Please upgrade your Firebase plan or wait 24h.'
                : (error.message || 'Failed to fetch stats')
        }, { status: isQuotaError ? 429 : 500 });
    }
}
