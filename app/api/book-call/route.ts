
import { NextRequest, NextResponse } from 'next/server';
import { bookSlot } from '@/lib/booking-service';
import { BookingDetails } from '@/lib/types';
import { sendBookingEmails } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { slotId, name, email, company, selectedTierGuess, date, time } = body;

        if (!slotId || !name || !email || !date || !time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const bookingDetails: BookingDetails = {
            name,
            email,
            company: company || '',
            selectedTierGuess: selectedTierGuess || '',
            date,
            time,
        };

        // 1. Transactional Booking in Firestore
        const result = await bookSlot(slotId, bookingDetails);

        // 2. Send Emails (Async, don't block response too long, implies successful DB write first)
        // Construct Date objects for ICS
        const startTimeParts = time.split(':');
        const start = new Date(date);
        start.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]));

        // Assume 30 minute duration
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 30);

        await sendBookingEmails({
            ...bookingDetails,
            start,
            end
        });

        return NextResponse.json({ success: true, bookingId: result.bookingId });
    } catch (error: any) {
        console.error('Error booking call:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
