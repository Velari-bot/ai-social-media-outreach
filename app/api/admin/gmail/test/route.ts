
import { NextResponse } from 'next/server';
import { sendBookingEmails } from '@/lib/email-service';
import { db } from '@/lib/firebase-admin';

export async function POST() {
    try {
        console.log("[Test] Sending test email via admin configuration...");

        // 1. Check if configured
        const doc = await db.collection('settings').doc('email').get();
        if (!doc.exists) {
            return NextResponse.json({ error: "No email settings found. Connect Gmail first." }, { status: 400 });
        }
        const data = doc.data();
        if (!data?.refreshToken || !data?.email) {
            return NextResponse.json({ error: "Email settings incomplete.", data }, { status: 400 });
        }

        // 2. Mock booking data
        const mockBooking = {
            name: "Test User",
            email: data.email, // Send to self
            company: "Verality Test",
            selectedTierGuess: "$500 - $1k",
            date: new Date().toISOString().split('T')[0],
            time: "10:00",
            start: new Date(),
            end: new Date()
        };

        // 3. Attempt Send
        await sendBookingEmails(mockBooking);

        return NextResponse.json({ success: true, message: `Test email sent to ${data.email}` });
    } catch (error: any) {
        console.error('Error sending test email:', error);

        // Return full error details for debugging
        return NextResponse.json({
            error: error.message,
            stack: error.stack,
            code: error.code,
            response: error.response
        }, { status: 500 });
    }
}
