
import { createEvent } from 'ics';
import { BookingDetails } from './types';
import { google } from 'googleapis';
import { db } from './firebase-admin';

// CONSTANTS
const ADMIN_NAME = 'Aiden';
const MEETING_LOCATION = 'Google Meet';
const ADMIN_EMAIL = 'benderaiden826@gmail.com'; // Hardcoded as per working system logic

/**
 * Helper to construct a raw MIME email string
 */
function makeBody(to: string, from: string, subject: string, message: string, htmlMessage: string, icsContent?: string) {
    const boundary = "foo_bar_baz";
    const str = [
        "MIME-Version: 1.0",
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "",
        htmlMessage,
        ""
    ];

    if (icsContent) {
        str.push(`--${boundary}`);
        str.push("Content-Type: text/calendar; method=REQUEST; charset=UTF-8");
        str.push("Content-Transfer-Encoding: base64");
        str.push("");
        str.push(Buffer.from(icsContent).toString('base64'));
        str.push("");
    }

    str.push(`--${boundary}--`);

    return Buffer.from(str.join("\n"))
        .toString("base64")
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * EXACT Replica of 'Simulate Outreach' Logic
 * 1. User Lookup (user_accounts)
 * 2. Get Tokens (gmail_connections)
 * 3. Use Google Gmail API directly (NO Nodemailer)
 */
async function sendViaGmailApi(to: string, subject: string, text: string, html: string, ics?: string) {
    console.log(`[Email] Starting direct Gmail API send to ${to}...`);

    // 1. User Lookup for Admin
    const usersRef = db.collection('user_accounts');
    let snapshot = await usersRef.where('email', '==', ADMIN_EMAIL).limit(1).get();

    // Fallback search in 'users' collection if not in 'user_accounts'
    if (snapshot.empty) {
        snapshot = await db.collection('users').where('email', '==', ADMIN_EMAIL).limit(1).get();
    }

    if (snapshot.empty) {
        throw new Error(`[Email] Admin user (${ADMIN_EMAIL}) not found in database.`);
    }
    const userId = snapshot.docs[0].id;

    // 2. Get Tokens from gmail_connections
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    const connData = connDoc.data();
    if (!connDoc.exists || !connData) {
        throw new Error(`[Email] No Gmail connection found for admin user (ID: ${userId}). Please connect in Admin Dashboard.`);
    }

    const { refresh_token } = connData;
    if (!refresh_token) {
        throw new Error("[Email] Refresh token missing in gmail_connections.");
    }

    // 3. Setup Gmail Client directly
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 4. Construct Raw Email
    const raw = makeBody(to, ADMIN_EMAIL, subject, text, html, ics);

    // 5. Send
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
    });

    console.log(`[Email] ✅ Sent successfully via Gmail API to ${to}`);
}

export async function sendBookingEmails(booking: BookingDetails & { start: Date, end: Date, meetLink?: string }) {
    console.log("[Email] Initiating Booking Email Flow...");

    const MEETING_LINK = booking.meetLink || process.env.MEETING_LINK || 'https://meet.google.com/your-default-code';

    // 1. Generate ICS
    const event = {
        start: [
            booking.start.getFullYear(),
            booking.start.getMonth() + 1,
            booking.start.getDate(),
            booking.start.getHours(),
            booking.start.getMinutes(),
        ],
        duration: { minutes: 30 },
        title: `Call with ${booking.name} (Verality)`,
        description: `Discussion regarding ${booking.company}.\n\nJoin the call here: ${MEETING_LINK}`,
        location: MEETING_LOCATION,
        url: MEETING_LINK,
        organizer: { name: 'Verality Team', email: ADMIN_EMAIL },
        attendees: [
            { name: booking.name, email: booking.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
            { name: ADMIN_NAME, email: ADMIN_EMAIL, rsvp: true, partstat: 'ACCEPTED', role: 'CHAIR' }
        ]
    };

    const icsFile = await new Promise<string>((resolve, reject) => {
        createEvent(event, (error: any, value: any) => {
            if (error) reject(error);
            resolve(value);
        });
    });

    // 2. Send Client Confirmation
    const clientHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
            <h1>Booking Confirmed</h1>
            <p>Hi ${booking.name},</p>
            <p>Your call is scheduled for <strong>${booking.date}</strong> at <strong>${booking.time}</strong>.</p>
            <p>
                <a href="${MEETING_LINK}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Join Google Meet
                </a>
            </p>
            <p>A calendar invite is attached.</p>
            <p>Best,<br>Aiden</p>
        </div>
    `;

    try {
        await sendViaGmailApi(
            booking.email,
            'Booking Confirmed: Call with Verality',
            `Hi ${booking.name}, Your call is confirmed. Link: ${MEETING_LINK}`,
            clientHtml,
            icsFile
        );
    } catch (e) {
        console.error("[Email] Failed to send client confirmation:", e);
        throw e; // Critical failure
    }

    // 3. Send Admin Notification (if not self-booking)
    if (booking.email !== ADMIN_EMAIL) {
        const adminHtml = `
            <div style="font-family: sans-serif;">
                <h2>New Booking Received</h2>
                <p><strong>Name:</strong> ${booking.name}</p>
                <p><strong>Company:</strong> ${booking.company}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Time:</strong> ${booking.date} @ ${booking.time}</p>
            </div>
        `;
        try {
            await sendViaGmailApi(
                ADMIN_EMAIL,
                `New Booking: ${booking.name}`,
                `New booking from ${booking.name} (${booking.email})`,
                adminHtml
            );
        } catch (e) {
            console.error("[Email] Failed to send admin notification:", e);
        }
    }
}
