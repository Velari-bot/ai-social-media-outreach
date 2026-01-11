import { google } from 'googleapis';
import { BookingDetails } from './types';

/**
 * Google Calendar Service
 * Creates calendar events with Google Meet links
 */

export async function createGoogleMeetEvent(booking: BookingDetails & { start: Date, end: Date }) {
    try {
        const GMAIL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GMAIL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GMAIL_REFRESH_TOKEN = process.env.GMAIL_ADMIN_REFRESH_TOKEN;

        if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
            console.warn('Google Calendar API credentials missing. Skipping Google Meet creation.');
            return null;
        }

        // Initialize OAuth2 client
        const { OAuth2 } = google.auth;
        const oauth2Client = new OAuth2(
            GMAIL_CLIENT_ID,
            GMAIL_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: GMAIL_REFRESH_TOKEN
        });

        // Initialize Calendar API
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Create event with Google Meet
        const event = {
            summary: `Call with ${booking.name} (Verality)`,
            description: `Discussion regarding ${booking.company || 'your project'}.\n\nTier Interest: ${booking.selectedTierGuess || 'Not specified'}`,
            start: {
                dateTime: booking.start.toISOString(),
                timeZone: 'America/New_York', // Adjust as needed
            },
            end: {
                dateTime: booking.end.toISOString(),
                timeZone: 'America/New_York',
            },
            attendees: [
                { email: booking.email, displayName: booking.name },
            ],
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`, // Unique ID for the Meet
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 day before
                    { method: 'popup', minutes: 30 }, // 30 minutes before
                ],
            },
            guestsCanModify: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: true,
        };

        // Create the event
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1, // Required for Google Meet
            sendUpdates: 'all', // Send email invites to all attendees
        });

        const createdEvent = response.data;
        const meetLink = createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.[0]?.uri;

        console.log('✅ Google Calendar event created:', createdEvent.id);
        console.log('📹 Google Meet link:', meetLink);

        return {
            eventId: createdEvent.id,
            meetLink: meetLink || null,
            htmlLink: createdEvent.htmlLink || null,
        };

    } catch (error: any) {
        console.error('❌ Error creating Google Meet event:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

/**
 * Update an existing calendar event
 */
export async function updateGoogleMeetEvent(eventId: string, updates: any) {
    try {
        const GMAIL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GMAIL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GMAIL_REFRESH_TOKEN = process.env.GMAIL_ADMIN_REFRESH_TOKEN;

        if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
            return null;
        }

        const { OAuth2 } = google.auth;
        const oauth2Client = new OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
        oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: updates,
            sendUpdates: 'all',
        });

        console.log('✅ Google Calendar event updated:', response.data.id);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error updating Google Meet event:', error.message);
        return null;
    }
}

/**
 * Cancel/Delete a calendar event
 */
export async function cancelGoogleMeetEvent(eventId: string) {
    try {
        const GMAIL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GMAIL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const GMAIL_REFRESH_TOKEN = process.env.GMAIL_ADMIN_REFRESH_TOKEN;

        if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
            return null;
        }

        const { OAuth2 } = google.auth;
        const oauth2Client = new OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET);
        oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
            sendUpdates: 'all', // Notify attendees
        });

        console.log('✅ Google Calendar event cancelled:', eventId);
        return true;

    } catch (error: any) {
        console.error('❌ Error cancelling Google Meet event:', error.message);
        return false;
    }
}
