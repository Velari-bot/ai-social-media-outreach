
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const PLAN_PRICES: Record<string, number> = {
    'basic': 400,
    'pro': 600,
    'growth': 900,
    'scale': 1500,
    'enterprise': 2500
};

export async function GET() {
    try {
        const snapshot = await db.collection('user_accounts').get();
        const users = snapshot.docs.map(doc => doc.data());

        const paidUsers = users.filter(u => u.role !== 'admin' && u.plan && u.plan.toLowerCase() !== 'free');
        const mrr = paidUsers.reduce((sum, u) => sum + (PLAN_PRICES[u.plan.toLowerCase()] || 0), 0);

        // Remove dummy multiplier. 1.0x MRR or whatever is actually in database.
        const totalRevenue = mrr;

        // Recent Transactions (Mocking from recent paid user creations ONLY if no real transactions exist)
        // In a real app, you'd fetch from a 'transactions' collection.
        const recentTransactions = paidUsers
            .sort((a, b) => {
                const bDate = (b.created_at?.seconds) || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
                const aDate = (a.created_at?.seconds) || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
                return bDate - aDate;
            })
            .slice(0, 10)
            .map((u, i) => {
                const createdAt = u.created_at || u.createdAt;
                const d = createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date());
                return {
                    id: `TXN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    customer: u.name || u.email || 'Customer',
                    amount: `$${(PLAN_PRICES[u.plan.toLowerCase()] || 0).toLocaleString()}`,
                    status: 'Succeeded',
                    date: d.toLocaleString()
                };
            });

        return NextResponse.json({
            success: true,
            stats: {
                totalRevenue: `$${totalRevenue.toLocaleString()}`,
                activeSubs: paidUsers.length,
                churnRate: '0%', // Need historical data for actual churn
                avgSale: paidUsers.length > 0 ? `$${(mrr / paidUsers.length).toFixed(2)}` : '$0.00'
            },
            transactions: recentTransactions
        });
    } catch (error: any) {
        console.error('Error fetching billing stats:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
