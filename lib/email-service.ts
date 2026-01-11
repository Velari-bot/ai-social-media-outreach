
import nodemailer from 'nodemailer';
import { createEvent, EventAttributes } from 'ics';
import { BookingDetails } from './types';
import { google } from 'googleapis';
import { db } from './firebase-admin'; // Assuming we store admin tokens here or somewhere

// Environment variables should be set:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

const SMTP_FROM = process.env.SMTP_FROM || 'bookings@verality.io';
const CORY_EMAIL = 'cory@beyondvisionltd.org';

// Helper to get OAuth2 Transport if available
async function getTransporter() {
    // Check if we have a system admin token stored in Firestore or Env
    // For this "fix", we will try to use env vars for Service Account or User Refresh Token if provided
    // Otherwise fall back to SMTP.
    // BUT the user asked to "send email via gmail api".
    // This usually implies using a refresh token to generate an access token.

    const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
    const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
    const GMAIL_REFRESH_TOKEN = process.env.GMAIL_ADMIN_REFRESH_TOKEN; // New env var for the admin's refresh token

    if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
        try {
            console.log('[Email] Attempting to use Gmail API OAuth2...');
            const { OAuth2 } = google.auth;
            const oauth2Client = new OAuth2(
                GMAIL_CLIENT_ID,
                GMAIL_CLIENT_SECRET,
                "https://developers.google.com/oauthplayground" // Callback URL
            );

            oauth2Client.setCredentials({
                refresh_token: GMAIL_REFRESH_TOKEN
            });

            const accessToken = await new Promise((resolve, reject) => {
                oauth2Client.getAccessToken((err, token) => {
                    if (err) reject(err);
                    resolve(token);
                });
            });

            console.log('[Email] ✅ Gmail OAuth2 access token obtained');
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.SMTP_USER || CORY_EMAIL, // The email address of the admin
                    clientId: GMAIL_CLIENT_ID,
                    clientSecret: GMAIL_CLIENT_SECRET,
                    refreshToken: GMAIL_REFRESH_TOKEN,
                    accessToken: accessToken as string,
                },
            });
        } catch (error) {
            console.error("[Email] ❌ Failed to create Gmail OAuth transporter, falling back to SMTP:", error);
        }
    } else {
        console.warn("[Email] Gmail API credentials incomplete. Falling back to SMTP.");
        if (!GMAIL_CLIENT_ID) console.warn("[Email] ⚠️  Missing GMAIL_CLIENT_ID");
        if (!GMAIL_CLIENT_SECRET) console.warn("[Email] ⚠️  Missing GMAIL_CLIENT_SECRET");
        if (!GMAIL_REFRESH_TOKEN) console.warn("[Email] ⚠️  Missing GMAIL_ADMIN_REFRESH_TOKEN");
    }

    // Fallback to SMTP
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    // Validate SMTP credentials
    if (!smtpUser || !smtpPass) {
        console.error('[Email] ❌ CRITICAL: SMTP credentials missing!');
        console.error('[Email] ⚠️  SMTP_USER:', smtpUser ? '✅ SET' : '❌ NOT SET');
        console.error('[Email] ⚠️  SMTP_PASS:', smtpPass ? '✅ SET' : '❌ NOT SET');
        console.error('[Email] 📖 See EMAIL_FIX_GUIDE.md for setup instructions');
        throw new Error('Email service not configured. Missing SMTP_USER or SMTP_PASS environment variables.');
    }

    console.log(`[Email] Using SMTP: ${smtpHost}:${smtpPort} with user: ${smtpUser}`);

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
}

export async function sendBookingEmails(booking: BookingDetails & { start: Date, end: Date, meetLink?: string }) {
    const transporter = await getTransporter();

    const MEETING_LOCATION = 'Google Meet';
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
        duration: { minutes: 30 }, // 30 minute slots
        title: `Call with ${booking.name} (Verality)`,
        description: `Discussion regarding ${booking.company}. 
        
Join the call here: ${MEETING_LINK}`,
        location: MEETING_LOCATION,
        url: MEETING_LINK,
        organizer: { name: 'Verality Team', email: CORY_EMAIL },
        attendees: [
            { name: booking.name, email: booking.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' },
            { name: 'Cory', email: CORY_EMAIL, rsvp: true, partstat: 'ACCEPTED', role: 'CHAIR' }
        ]
    };

    const icsFile = await new Promise<string>((resolve, reject) => {
        createEvent(event, (error: any, value: any) => {
            if (error) reject(error);
            resolve(value);
        });
    });

    // 2. Send Email to User (Confirmation + ICS)
    try {
        console.log(`[Email] Sending confirmation email to ${booking.email}...`);
        await transporter.sendMail({
            from: `"Verality Booking" <${process.env.SMTP_USER || CORY_EMAIL}>`, // Must match auth user for Gmail API
            to: booking.email,
            subject: 'Booking Confirmed: Call with Verality',
            text: `Hi ${booking.name},\n\nYour call has been confirmed for ${booking.date} at ${booking.time} (30 mins).\n\nJoin the call here: ${process.env.MEETING_LINK || 'Check calendar invite'}\n\nPlease find the calendar invite attached.\n\nBest,\nVerality Team`,
            html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
          <h1 style="color: #000;">Booking Confirmed</h1>
          <p>Hi ${booking.name},</p>
          <p>Your call has been confirmed for <strong>${booking.date}</strong> at <strong>${booking.time}</strong> (30 mins).</p>
          
          <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">
            <p style="margin-top: 0;"><strong>Meeting Details:</strong></p>
            <p><strong>Platform:</strong> ${process.env.MEETING_LOCATION || 'Google Meet'}</p>
            <a href="${process.env.MEETING_LINK || '#'}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Meeting</a>
          </div>

          <p>Please find the calendar invite attached for your records.</p>
          <br/>
          <p>Best,</p>
          <p><strong>Verality Team</strong></p>
        </div>
      `,
            icalEvent: {
                filename: 'invite.ics',
                method: 'request',
                content: icsFile,
            },
        });
        console.log(`[Email] ✅ Confirmation email sent successfully to ${booking.email}`);
    } catch (err: any) {
        console.error('[Email] ❌ Error sending user confirmation email:', err);
        console.error('[Email] Error details:', {
            message: err.message,
            code: err.code,
            command: err.command,
            response: err.response,
            responseCode: err.responseCode
        });
        // Re-throw so the booking API knows email failed
        throw new Error(`Failed to send confirmation email: ${err.message}`);
    }

    // 3. Send Notification to Cory (if different from sender, but usually same inbox, so maybe skip or just logging)
    // If we are sending AS Cory, he will see it in Sent Items. But let's send a specific notification anyway just in case.
    if (booking.email !== CORY_EMAIL) {
        try {
            console.log(`[Email] Sending admin notification to ${CORY_EMAIL}...`);
            await transporter.sendMail({
                from: `"Verality Booking System" <${process.env.SMTP_USER || CORY_EMAIL}>`,
                to: CORY_EMAIL,
                subject: `New Booking: ${booking.name} - ${booking.company}`,
                text: `New booking received.\n\nName: ${booking.name}\nEmail: ${booking.email}\nCompany: ${booking.company}\nTier Guess: ${booking.selectedTierGuess}\nDate: ${booking.date}\nTime: ${booking.time}`,
                html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1>New Booking Received</h1>
          <ul>
            <li><strong>Name:</strong> ${booking.name}</li>
            <li><strong>Email:</strong> ${booking.email}</li>
            <li><strong>Company:</strong> ${booking.company}</li>
            <li><strong>Tier Guess:</strong> ${booking.selectedTierGuess}</li>
            <li><strong>Date:</strong> ${booking.date}</li>
            <li><strong>Time:</strong> ${booking.time}</li>
          </ul>
        </div>
      `,
            });
            console.log(`[Email] ✅ Admin notification sent to ${CORY_EMAIL}`);
        } catch (err: any) {
            console.error('[Email] ❌ Error sending admin notification email:', err);
            console.error('[Email] Error details:', {
                message: err.message,
                code: err.code
            });
            // Don't throw - admin notification is not critical
        }
    }
}
