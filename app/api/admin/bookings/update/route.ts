
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { bookingId, status } = await req.json();

        if (!bookingId || !status) {
            return NextResponse.json({ success: false, error: 'Missing bookingId or status' }, { status: 400 });
        }

        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
        }

        const booking = bookingDoc.data() as any;
        const oldStatus = booking.status;

        // Update the status in Firestore
        await bookingRef.update({ status, updatedAt: new Date().toISOString() });

        // Restore slot if cancelled
        if (status === 'cancelled' && booking.slotId) {
            await db.collection('availability').doc(booking.slotId).update({ isBooked: false });
        }

        // Send notification if status changed
        if (status !== oldStatus) {
            const { sendBookingUpdateEmail, sendBookingCancellationEmail } = await import('@/lib/email-service');
            try {
                if (status === 'cancelled') {
                    await sendBookingCancellationEmail({
                        name: booking.name,
                        email: booking.email,
                        date: booking.date,
                        time: booking.time
                    });
                } else {
                    await sendBookingUpdateEmail({
                        name: booking.name,
                        email: booking.email,
                        date: booking.date,
                        time: booking.time,
                        status: status
                    });
                }
            } catch (emailError) {
                console.error('Failed to send status update email:', emailError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating booking status:', error);
        return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 });
    }
}
