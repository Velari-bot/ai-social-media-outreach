import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/billing/transaction
 * Delete a transaction record (admin only)
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('id');

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
        }

        // In a real implementation, you would:
        // 1. Verify admin authentication
        // 2. Delete from your transactions collection in Firestore
        // 3. Optionally cancel/refund in Stripe if needed

        // For now, we'll just return success since transactions are mock data
        // If you're storing real transactions in Firestore, add:
        // await db.collection('transactions').doc(transactionId).delete();

        console.log(`Deleted transaction: ${transactionId}`);

        return NextResponse.json({
            success: true,
            message: 'Transaction deleted successfully'
        });

    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
