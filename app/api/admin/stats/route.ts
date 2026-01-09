
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 1. Total Users & Growth
        const totalUsersSnapshot = await db.collection('users').count().get();
        const totalUsers = totalUsersSnapshot.data().count;

        const usersPreviousSnapshot = await db.collection('users')
            .where('createdAt', '<', sevenDaysAgo.toISOString())
            .count()
            .get();
        const totalUsersPrevious = usersPreviousSnapshot.data().count;
        const totalUsersChange = totalUsersPrevious > 0
            ? ((totalUsers - totalUsersPrevious) / totalUsersPrevious) * 100
            : 0;

        // 2. Booked Calls (Last 7 Days)
        const bookingsSnapshot = await db.collection('bookings')
            .where('date', '>=', sevenDaysAgo.toISOString().split('T')[0])
            .get();
        const bookedCallsWeek = bookingsSnapshot.size;

        const bookingsPreviousSnapshot = await db.collection('bookings')
            .where('date', '>=', fourteenDaysAgo.toISOString().split('T')[0])
            .where('date', '<', sevenDaysAgo.toISOString().split('T')[0])
            .get();
        const bookedCallsPrevious = bookingsPreviousSnapshot.size;
        const bookedCallsChange = bookedCallsPrevious > 0
            ? ((bookedCallsWeek - bookedCallsPrevious) / bookedCallsPrevious) * 100
            : 0;

        // 3. Active Affiliates
        const affiliatesSnapshot = await db.collection('users').where('role', '==', 'affiliate').count().get();
        const activeAffiliates = affiliatesSnapshot.data().count;

        const affiliatesPreviousSnapshot = await db.collection('users')
            .where('role', '==', 'affiliate')
            .where('createdAt', '<', sevenDaysAgo.toISOString())
            .count()
            .get();
        const activeAffiliatesPrevious = affiliatesPreviousSnapshot.data().count;
        const affiliatesChange = activeAffiliatesPrevious > 0
            ? ((activeAffiliates - activeAffiliatesPrevious) / activeAffiliatesPrevious) * 100
            : 0;

        // 4. MRR
        const PLAN_PRICES: Record<string, number> = {
            'basic': 400,
            'pro': 600,
            'growth': 900,
            'scale': 1500,
            'enterprise': 2500, // Guess for enterprise if not specified
            'custom': 2500
        };

        const calculateMRR = (users: any[]) => {
            return users.reduce((sum, user) => {
                const plan = (user.plan || '').toLowerCase();
                return sum + (PLAN_PRICES[plan] || 0);
            }, 0);
        };

        const currentUsersDocs = await db.collection('users').where('plan', '!=', 'free').get();
        const currentPaidUsers = currentUsersDocs.docs.map(d => d.data());
        const mrr = calculateMRR(currentPaidUsers);

        // For MRR change, we'd ideally need a snapshot of plans 7 days ago.
        // Since we don't have historical plan data, we can estimate based on users who joined before 7 days ago.
        // This won't account for plan changes, but it's better than nothing for a demo.
        const previousPaidUsers = currentPaidUsers.filter(u => u.createdAt < sevenDaysAgo.toISOString());
        const mrrPrevious = calculateMRR(previousPaidUsers);
        const mrrChange = mrrPrevious > 0 ? ((mrr - mrrPrevious) / mrrPrevious) * 100 : 0;

        // 5. Daily Data for Charts (Last 7 Days)
        const dailyData: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];

            const dayBookings = (await db.collection('bookings').where('date', '==', dateStr).count().get()).data().count;
            // Note: This is an estimation for signups
            const daySignups = (await db.collection('users')
                .where('createdAt', '>=', dateStr + 'T00:00:00.000Z')
                .where('createdAt', '<=', dateStr + 'T23:59:59.999Z')
                .count().get()).data().count;

            dailyData.push({
                date: dateStr,
                bookings: dayBookings,
                signups: daySignups
            });
        }

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                totalUsersChange: totalUsersChange.toFixed(1),
                bookedCallsWeek,
                bookedCallsChange: bookedCallsChange.toFixed(1),
                activeAffiliates,
                activeAffiliatesChange: affiliatesChange.toFixed(1),
                mrr,
                mrrChange: mrrChange.toFixed(1),
                dailyData
            }
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
