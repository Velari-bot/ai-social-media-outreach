
import nodemailer from 'nodemailer';
import { createEvent, EventAttributes } from 'ics';
import { BookingDetails } from './types';
import { google } from 'googleapis';
import { db } from './firebase-admin';

// CONSTANTS
const ADMIN_NAME = 'Aiden';
const MEETING_LOCATION = 'Google Meet';

/**
 * Re-implemented Email Service (OAuth2 Only)
 * Sources credentials solely from the Admin Settings panel (Firestore: settings/email)
 */
async function getTransporter() {
    const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
    const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
        throw new Error("Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET environment variables");
    }

    // 1. Fetch Configuration from Admin Settings
    console.log("[Email] Fetching OAuth credentials from Firestore (settings/email)...");
    const doc = await db.collection('settings').doc('email').get();

    if (!doc.exists) {
        throw new Error("No Admin Email configuration found. Please connect Gmail in Admin Settings.");
    }

    const data = doc.data();
    const refreshToken = data?.refreshToken;
    const emailUser = data?.email;

    if (!refreshToken || !emailUser) {
        console.error("[Email] Settings found but missing tokens:", data);
        throw new Error("Admin Email settings are incomplete (missing refresh token or email). Please reconnect in Admin Settings.");
    }

    console.log(`[Email] Found credentials for: ${emailUser}`);

    // 2. Create OAuth2 Client
    const { OAuth2 } = google.auth;
    const oauth2Client = new OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground" // Not used for refresh, but required by library
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    // 3. Get Fresh Access Token
    console.log("[Email] Refreshing access token...");
    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err: Error | null, token?: string | null) => {
            if (err) {
                console.error("[Email] Failed to refresh access token:", err);
                reject(err);
            }
            resolve(token);
        });
    });

    if (!accessToken) {
        throw new Error("Failed to generate access token.");
    }

    // 4. Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: emailUser,
            clientId: GMAIL_CLIENT_ID,
            clientSecret: GMAIL_CLIENT_SECRET,
            refreshToken: refreshToken,
            accessToken: accessToken as string,
        },
    });

    return { transporter, emailUser };
}

export async function sendBookingEmails(booking: BookingDetails & { start: Date, end: Date, meetLink?: string }) {
    console.log("[Email] Starting booking email flow...");

    // 1. Get Authenticated Transporter
    const { transporter, emailUser } = await getTransporter();

    const MEETING_LINK = booking.meetLink || process.env.MEETING_LINK || 'https://meet.google.com/your-default-code';

    // 2. Generate ICS Calendar File
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
        organizer: { name: 'Verality Team', email: emailUser },
        attendees: [
            { name: booking.name, email: booking.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
            { name: ADMIN_NAME, email: emailUser, rsvp: true, partstat: 'ACCEPTED', role: 'CHAIR' }
        ]
    };

    const icsFile = await new Promise<string>((resolve, reject) => {
        createEvent(event, (error: any, value: any) => {
            if (error) reject(error);
            resolve(value);
        });
    });

    // 3. Send Confirmation Email to Client
    try {
        console.log(`[Email] Sending confirmation to ${booking.email}...`);
        await transporter.sendMail({
            from: `"Verality Booking" <${emailUser}>`,
            to: booking.email,
            subject: 'Booking Confirmed: Call with Verality',
            text: `Hi ${booking.name},\n\nYour call is confirmed for ${booking.date} at ${booking.time}.\n\nLink: ${MEETING_LINK}\n\nSee you then,\nAiden`,
            html: `
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
            `,
            icalEvent: {
                filename: 'invite.ics',
                method: 'request',
                content: icsFile,
            },
        });
        console.log("[Email] ✅ Client confirmation sent.");
    } catch (error) {
        console.error("[Email] ❌ Failed to send client email:", error);
        throw error; // Critical failure
    }

    // 4. Send Notification to Admin (Self)
    if (booking.email !== emailUser) {
        try {
            console.log(`[Email] Sending admin notification to ${emailUser}...`);
            await transporter.sendMail({
                from: `"Verality System" <${emailUser}>`,
                to: emailUser,
                subject: `New Booking: ${booking.name}`,
                html: `
                    <div style="font-family: sans-serif;">
                        <h2>New Booking Received</h2>
                        <p><strong>Name:</strong> ${booking.name}</p>
                        <p><strong>Company:</strong> ${booking.company}</p>
                        <p><strong>Email:</strong> ${booking.email}</p>
                        <p><strong>Time:</strong> ${booking.date} @ ${booking.time}</p>
                    </div>
                `
            });
            console.log("[Email] ✅ Admin notification sent.");
        } catch (error) {
            console.error("[Email] ⚠️ Failed to send admin notification (non-critical):", error);
        }
    }
}
