
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
        const mrr = paidUsers.reduce((sum, u) => sum + (PLAN_PRICES[(u.plan || '').toLowerCase()] || 0), 0);

        // Stripe Fees: 2.9% + $0.30 per payment
        const stripeFees = (mrr * 0.029) + (paidUsers.length * 0.30);
        const netRevenue = mrr - stripeFees;

        // Fetch Real Transactions from Firestore
        let recentTransactions: any[] = [];
        try {
            const txSnapshot = await db.collection('wallet_transactions')
                .orderBy('created_at', 'desc')
                .limit(50)
                .get();

            if (!txSnapshot.empty) {
                recentTransactions = txSnapshot.docs.map(doc => {
                    const data = doc.data();
                    const createdAt = data.created_at;
                    const d = createdAt?.toDate ? createdAt.toDate() : (createdAt ? new Date(createdAt) : new Date());

                    return {
                        id: doc.id,
                        customer: data.user_email || data.user_id || 'Unknown',
                        amount: data.amount ? `$${data.amount}` : '$0.00',
                        status: data.status || 'Completed',
                        date: d.toLocaleString()
                    };
                });
            }
        } catch (err) {
            console.warn("Failed to fetch wallet_transactions (collection might not exist yet)", err);
        }

        // Fallback: If no transactions exist, return empty array instead of mock data
        // This stops the confusion where deleting something doesn't work because it was never real.

        return NextResponse.json({
            success: true,
            stats: {
                totalRevenue: `$${netRevenue.toLocaleString()}`, // Show Net Revenue
                grossRevenue: `$${mrr.toLocaleString()}`,
                stripeFees: `$${stripeFees.toLocaleString()}`,
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
