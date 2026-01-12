
import { NextRequest, NextResponse } from 'next/server';
import { bookSlot } from '@/lib/booking-service';
import { BookingDetails } from '@/lib/types';
import { sendBookingEmails } from '@/lib/email-service';
import { createGoogleMeetEvent } from '@/lib/google-calendar-service';
import { db } from '@/lib/firebase-admin';

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

        // 2. Create Google Meet Event
        const startTimeParts = time.split(':');
        const start = new Date(date);
        start.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]));

        // Assume 30 minute duration
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 30);

        let meetLink = null;
        let calendarEventId = null;

        try {
            const googleEvent = await createGoogleMeetEvent({
                ...bookingDetails,
                start,
                end
            });

            if (googleEvent) {
                meetLink = googleEvent.meetLink;
                calendarEventId = googleEvent.eventId;

                // Update booking with Google Meet link
                await db.collection('bookings').doc(result.bookingId).update({
                    meetLink: meetLink,
                    calendarEventId: calendarEventId,
                    updatedAt: new Date().toISOString()
                });

                console.log('✅ Google Meet created and booking updated:', meetLink);
            }
        } catch (meetError) {
            console.error('Error creating Google Meet (continuing with booking):', meetError);
            // Don't fail the booking if Google Meet creation fails
        }

        // 3. Email sending disabled per user request
        /*
        await sendBookingEmails({
            ...bookingDetails,
            start,
            end,
            meetLink: meetLink || undefined
        });
        */

        return NextResponse.json({
            success: true,
            bookingId: result.bookingId,
            meetLink: meetLink
        });
    } catch (error: any) {
        console.error('Error booking call:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
