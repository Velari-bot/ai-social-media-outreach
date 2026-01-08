
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { bookingId, status } = await req.json();

        if (!bookingId || !status) {
            return NextResponse.json({ success: false, error: 'Missing bookingId or status' }, { status: 400 });
        }

        await db.collection('bookings').doc(bookingId).update({ status });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating booking status:', error);
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
    }
}
