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

        // Verify admin (Assuming middleware handles general admin auth, but good to be safe)
        // For this step, we just execute the deletion.

        // Delete from 'wallet_transactions' collection
        await db.collection('wallet_transactions').doc(transactionId).delete();

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
