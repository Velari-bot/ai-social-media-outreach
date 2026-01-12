
import nodemailer from 'nodemailer';
import { createEvent, EventAttributes } from 'ics';
import { BookingDetails } from './types';
import { google } from 'googleapis';
import { db } from './firebase-admin'; // Assuming we store admin tokens here or somewhere

// Environment variables should be set:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

const SMTP_FROM = process.env.SMTP_FROM || 'benderaiden826@gmail.com';
const CORY_EMAIL = 'benderaiden826@gmail.com';
const ADMIN_NAME = 'Aiden';

// Helper to get OAuth2 Transport if available
// Helper to get OAuth2 Transport if available
async function getTransporter() {
    const adminEmail = 'benderaiden826@gmail.com';
    let dynamicConfig: { refreshToken?: string; email?: string } | null = null;

    // 1. Try to find "Connected Gmail" for the admin user (matches creator outreach setup)
    try {
        let userSnap = await db.collection('user_accounts').where('email', '==', adminEmail).limit(1).get();
        if (userSnap.empty) {
            userSnap = await db.collection('users').where('email', '==', adminEmail).limit(1).get();
        }

        if (!userSnap.empty) {
            const userId = userSnap.docs[0].id;
            const connDoc = await db.collection('gmail_connections').doc(userId).get();
            if (connDoc.exists) {
                const connData = connDoc.data();
                if (connData && connData.refresh_token) {
                    console.log(`[Email] Using OAuth connection from gmail_connections for ${adminEmail}`);
                    dynamicConfig = {
                        refreshToken: connData.refresh_token,
                        email: connData.email || adminEmail
                    };
                }
            }
        }
    } catch (err) {
        console.warn("[Email] Error checking gmail_connections:", err);
    }

    // 2. Fallback to settings document if not found in connections
    if (!dynamicConfig) {
        try {
            const settingsDoc = await db.collection('settings').doc('email').get();
            if (settingsDoc.exists) {
                const data = settingsDoc.data();
                if (data && data.refreshToken) {
                    console.log(`[Email] Using config from settings/email`);
                    dynamicConfig = {
                        refreshToken: data.refreshToken,
                        email: data.email
                    };
                }
            }
        } catch (err) {
            console.warn("[Email] Error checking settings/email:", err);
        }
    }

    const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
    const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

    // Combined Priority: Connections -> Settings -> Env Vars
    const refreshToken = dynamicConfig?.refreshToken || process.env.GMAIL_ADMIN_REFRESH_TOKEN;
    const emailUser = dynamicConfig?.email || process.env.SMTP_USER || CORY_EMAIL;

    if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && refreshToken) {
        try {
            console.log(`[Email] Attempting to use Gmail API OAuth2 (User: ${emailUser})...`);
            const { OAuth2 } = google.auth;
            const oauth2Client = new OAuth2(
                GMAIL_CLIENT_ID,
                GMAIL_CLIENT_SECRET,
                "https://developers.google.com/oauthplayground"
            );

            oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            const accessToken = await new Promise((resolve, reject) => {
                oauth2Client.getAccessToken((err: Error | null, token?: string | null) => {
                    if (err) {
                        console.error("[Email] Error getting access token:", err);
                        reject(err);
                    }
                    resolve(token);
                });
            });

            console.log('[Email] ✅ Gmail OAuth2 access token obtained');
            return {
                transporter: nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        type: 'OAuth2',
                        user: emailUser,
                        clientId: GMAIL_CLIENT_ID,
                        clientSecret: GMAIL_CLIENT_SECRET,
                        refreshToken: refreshToken,
                        accessToken: accessToken as string,
                    },
                }),
                emailUser
            };
        } catch (error) {
            console.error("[Email] ❌ Failed to create Gmail OAuth transporter, falling back to SMTP:", error);
        }
    } else {
        console.warn("[Email] Gmail API credentials incomplete or missing. Falling back to SMTP.");
        if (!GMAIL_CLIENT_ID) console.warn("[Email] ⚠️  Missing GMAIL_CLIENT_ID");
        if (!GMAIL_CLIENT_SECRET) console.warn("[Email] ⚠️  Missing GMAIL_CLIENT_SECRET");
        if (!refreshToken) console.warn("[Email] ⚠️  Missing Refresh Token (Env or Firestore)");
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
        throw new Error('Email service not configured. Missing SMTP_USER or SMTP_PASS environment variables.');
    }

    console.log(`[Email] Using SMTP: ${smtpHost}:${smtpPort} with user: ${smtpUser}`);

    return {
        transporter: nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        }),
        emailUser: smtpUser
    };
}

export async function sendBookingEmails(booking: BookingDetails & { start: Date, end: Date, meetLink?: string }) {
    const { transporter, emailUser } = await getTransporter();

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

    // 2. Send Email to User (Confirmation + ICS)
    try {
        console.log(`[Email] Sending confirmation email to ${booking.email}...`);
        await transporter.sendMail({
            from: `"Verality Booking" <${emailUser}>`, // Must match auth user for Gmail API
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

    // 3. Send Notification to Aiden (if different from sender, but usually same inbox, so maybe skip or just logging)
    // If we are sending AS Aiden, he will see it in Sent Items. But let's send a specific notification anyway just in case.
    if (booking.email !== emailUser) {
        try {
            console.log(`[Email] Sending admin notification to ${emailUser}...`);
            await transporter.sendMail({
                from: `"Verality Booking System" <${emailUser}>`,
                to: emailUser,
                subject: `New Booking: ${booking.name} - ${booking.company}`,
                text: `New booking received.\n\nName: ${booking.name}\nEmail: ${booking.email}\nCompany: ${booking.company}\nTier Guess: ${booking.selectedTierGuess}\nDate: ${booking.date}\nTime: ${booking.time}`,
                html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1>New Booking Received</h1>
          <p>Hi ${ADMIN_NAME},</p>
          <p>You have a new booking from <strong>${booking.name}</strong>.</p>
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
            console.log(`[Email] ✅ Admin notification sent to ${emailUser}`);
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
