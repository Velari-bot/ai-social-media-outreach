
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await db.collection('affiliates').limit(100).get();
        const affiliates = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Affiliate',
                email: data.email || 'No email',
                code: data.referral_code || 'N/A',
                clicks: data.clicks || 0,
                conversions: data.conversions || 0,
                earnings: `$${(data.total_earnings || 0).toLocaleString()}`,
                pending_earnings: data.pending_earnings || 0,
                status: 'Active'
            };
        });

        const totalEarned = affiliates.reduce((sum, a) => sum + parseFloat(a.earnings.replace('$', '').replace(',', '')), 0);
        const pendingPayouts = affiliates.reduce((sum, a) => sum + (a.pending_earnings || 0), 0);

        return NextResponse.json({
            success: true,
            affiliates,
            stats: {
                totalPartners: affiliates.length,
                pendingPayouts: `$${pendingPayouts.toLocaleString()}`,
                totalCommission: `$${totalEarned.toLocaleString()}`,
                conversionRate: affiliates.length > 0 ? (affiliates.reduce((sum, a) => sum + (a.conversions / (a.clicks || 1)), 0) / affiliates.length * 100).toFixed(1) + '%' : '0%'
            }
        });
    } catch (error: any) {
        console.error('Error fetching affiliates:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
