
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
    try {
        // 1. Total Users
        const usersSnapshot = await db.collection('users').count().get();
        const totalUsers = usersSnapshot.data().count;

        // 2. Booked Calls (This Week)
        // Calculate start of week
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);

        const bookingsSnapshot = await db.collection('bookings')
            .where('date', '>=', startOfWeek.toISOString().split('T')[0]) // Simple string comparison for YYYY-MM-DD
            .count()
            .get();
        const bookedCallsWeek = bookingsSnapshot.data().count;

        // 3. Active Affiliates (Mock for now, or check 'users' with role 'affiliate')
        const affiliatesSnapshot = await db.collection('users').where('role', '==', 'affiliate').count().get();
        const activeAffiliates = affiliatesSnapshot.data().count;

        // 4. MRR (Mock calculation based on plan types in 'users' or 'subscriptions')
        // Ideally you'd sum up value from a 'subscriptions' collection
        const paidUsersSnapshot = await db.collection('users').where('plan', '!=', 'free').get();
        let mrr = 0;
        paidUsersSnapshot.docs.forEach(doc => {
            const plan = doc.data().plan;
            if (plan === 'basic') mrr += 300;
            if (plan === 'pro') mrr += 500;
            if (plan === 'growth') mrr += 800;
            if (plan === 'enterprise') mrr += 1200;
        });

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                bookedCallsWeek,
                activeAffiliates,
                mrr
            }
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
    }
}
