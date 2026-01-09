
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!db) {
            throw new Error('Database not initialized');
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const sevenDaysAgoStr = sevenDaysAgo.toISOString();
        const fourteenDaysAgoStr = fourteenDaysAgo.toISOString();
        const sevenDaysAgoDateStr = sevenDaysAgo.toISOString().split('T')[0];
        const fourteenDaysAgoDateStr = fourteenDaysAgo.toISOString().split('T')[0];

        // 1. Fetch data in bulk to avoid index requirements and excessive round-trips
        const usersSnapshot = await db.collection('users').get();
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const bookingsSnapshot = await db.collection('bookings')
            .where('date', '>=', fourteenDaysAgoDateStr)
            .get();
        const recentBookings = bookingsSnapshot.docs.map(doc => doc.data());

        // 2. Process Users in Memory
        const totalUsers = allUsers.length;
        const totalUsersPrevious = allUsers.filter((u: any) => u.createdAt && u.createdAt < sevenDaysAgoStr).length;
        const totalUsersChange = totalUsersPrevious > 0
            ? ((totalUsers - totalUsersPrevious) / totalUsersPrevious) * 100
            : 0;

        const activeAffiliates = allUsers.filter((u: any) => u.role === 'affiliate').length;
        const activeAffiliatesPrevious = allUsers.filter((u: any) => u.role === 'affiliate' && u.createdAt && u.createdAt < sevenDaysAgoStr).length;
        const activeAffiliatesChange = activeAffiliatesPrevious > 0
            ? ((activeAffiliates - activeAffiliatesPrevious) / activeAffiliatesPrevious) * 100
            : 0;

        const PLAN_PRICES: Record<string, number> = {
            'basic': 400,
            'pro': 600,
            'growth': 900,
            'scale': 1500,
            'enterprise': 2500,
            'custom': 2500
        };

        const calculateMRR = (users: any[]) => {
            return users.reduce((sum, user) => {
                if (!user.plan || user.plan.toLowerCase() === 'free') return sum;
                const plan = user.plan.toLowerCase();
                return sum + (PLAN_PRICES[plan] || 0);
            }, 0);
        };

        const mrr = calculateMRR(allUsers);
        const previousPaidUsers = allUsers.filter((u: any) => u.createdAt && u.createdAt < sevenDaysAgoStr);
        const mrrPrevious = calculateMRR(previousPaidUsers);
        const mrrChange = mrrPrevious > 0 ? ((mrr - mrrPrevious) / mrrPrevious) * 100 : 0;

        // 3. Process Bookings in Memory
        const bookedCallsWeek = recentBookings.filter(b => b.date >= sevenDaysAgoDateStr).length;
        const bookedCallsPrevious = recentBookings.filter(b => b.date >= fourteenDaysAgoDateStr && b.date < sevenDaysAgoDateStr).length;
        const bookedCallsChange = bookedCallsPrevious > 0
            ? ((bookedCallsWeek - bookedCallsPrevious) / bookedCallsPrevious) * 100
            : 0;

        // 4. Daily Data for Charts
        const dailyData: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];

            const dayBookings = recentBookings.filter(b => b.date === dateStr).length;
            const daySignups = allUsers.filter((u: any) => u.createdAt && u.createdAt.startsWith(dateStr)).length;

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
                activeAffiliatesChange: activeAffiliatesChange.toFixed(1),
                mrr,
                mrrChange: mrrChange.toFixed(1),
                dailyData
            }
        });

    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch stats'
        }, { status: 500 });
    }
}
