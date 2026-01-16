
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';


export async function GET() {
    try {
        // Fetch upcoming bookings first
        const snapshot = await db.collection('bookings')
            .orderBy('date', 'desc')
            // Removed time sort to avoid composite index error: .orderBy('time', 'asc')
            .limit(50)
            .get();

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ success: true, bookings });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ success: false, error: 'Missing booking ID' }, { status: 400 });
        }

        // Fetch booking details for email notification
        const bookingRef = db.collection('bookings').doc(id);
        const bookingDoc = await bookingRef.get();

        if (bookingDoc.exists) {
            const booking = bookingDoc.data() as any;

            // Send cancellation email
            const { sendBookingCancellationEmail } = await import('@/lib/email-service');
            try {
                await sendBookingCancellationEmail({
                    name: booking.name,
                    email: booking.email,
                    date: booking.date,
                    time: booking.time
                });
            } catch (emailError) {
                console.error('Failed to send cancellation email:', emailError);
                // Continue with deletion even if email fails
            }

            // Restore availability slot
            if (booking.slotId) {
                await db.collection('availability').doc(booking.slotId).update({ isBooked: false });
            }
        }

        await bookingRef.delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting booking:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete booking' }, { status: 500 });
    }
}
