/**
 * Automated Email Sender Cron Job
 * Runs every 5 minutes to send scheduled outreach emails
 * Uses each user's connected Gmail account
 */

import { db } from '@/lib/firebase-admin';
import { google } from 'googleapis';
import OpenAI from 'openai';
import { Timestamp } from 'firebase-admin/firestore';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function sendScheduledEmails() {
    console.log('[Outreach Sender] Starting scheduled email send...');

    const now = Timestamp.now();

    // Get all emails scheduled to be sent now or earlier
    const queueSnapshot = await db.collection('outreach_queue')
        .where('status', '==', 'scheduled')
        .where('scheduled_send_time', '<=', now)
        .limit(50) // Process 50 at a time
        .get();

    console.log(`[Outreach Sender] Found ${queueSnapshot.size} emails to send`);

    if (queueSnapshot.empty) {
        return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Group by user to batch process
    const emailsByUser = new Map<string, any[]>();

    queueSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!emailsByUser.has(data.user_id)) {
            emailsByUser.set(data.user_id, []);
        }
        emailsByUser.get(data.user_id)!.push({ id: doc.id, ...data });
    });

    // Process each user's emails
    for (const [userId, emails] of emailsByUser.entries()) {
        try {
            const result = await sendEmailsForUser(userId, emails);
            sent += result.sent;
            failed += result.failed;
        } catch (error: any) {
            console.error(`[Outreach Sender] Error for user ${userId}:`, error.message);
            failed += emails.length;
        }
    }

    console.log(`[Outreach Sender] Complete. Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
}

async function sendEmailsForUser(userId: string, emails: any[]) {
    console.log(`[Outreach Sender] Processing ${emails.length} emails for user ${userId}`);

    // Get user's Gmail connection
    const gmailConn = await db.collection('gmail_connections').doc(userId).get();
    if (!gmailConn.exists) {
        console.error(`[Outreach Sender] No Gmail connection for user ${userId}`);
        // Mark all as failed
        const batch = db.batch();
        emails.forEach(email => {
            batch.update(db.collection('outreach_queue').doc(email.id), {
                status: 'failed',
                last_error: 'No Gmail connection',
                updated_at: Timestamp.now()
            });
        });
        await batch.commit();
        return { sent: 0, failed: emails.length };
    }

    const { refresh_token } = gmailConn.data()!;

    // Get user settings
    const settingsDoc = await db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() || {};

    // Check daily limit
    const emailsSentToday = settings.emails_sent_today || 0;
    const maxPerDay = settings.max_emails_per_day || 100;

    if (emailsSentToday >= maxPerDay) {
        console.log(`[Outreach Sender] User ${userId} has reached daily limit`);
        return { sent: 0, failed: 0 };
    }

    // Setup Gmail client
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get user data for personalization
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    const userData = userDoc.data() || {};
    const userName = userData.name || userData.first_name || 'Cory';
    const userEmail = userData.email || settings.gmail_email;

    let sent = 0;
    let failed = 0;

    // Send emails one by one
    for (const emailItem of emails) {
        // Check if we've hit the limit
        if (emailsSentToday + sent >= maxPerDay) {
            console.log(`[Outreach Sender] Daily limit reached for user ${userId}`);
            break;
        }

        try {
            // Generate AI email
            const emailContent = await generateOutreachEmail({
                creatorName: emailItem.creator_name || emailItem.creator_handle,
                creatorHandle: emailItem.creator_handle,
                creatorPlatform: emailItem.creator_platform,
                userName: userName,
                userEmail: userEmail,
                persona: settings.ai_persona || "Cory from Beyond Vision"
            });

            // Send via Gmail
            const result = await sendGmailMessage(gmail, {
                to: emailItem.creator_email,
                subject: emailContent.subject,
                body: emailContent.body,
                userEmail: userEmail
            });

            // Update queue item
            await db.collection('outreach_queue').doc(emailItem.id).update({
                status: 'sent',
                sent_at: Timestamp.now(),
                gmail_thread_id: result.threadId,
                gmail_message_id: result.messageId,
                email_subject: emailContent.subject,
                email_body: emailContent.body,
                updated_at: Timestamp.now()
            });

            // Create email thread tracking
            await db.collection('email_threads').doc(result.threadId).set({
                user_id: userId,
                creator_id: emailItem.creator_id,
                creator_email: emailItem.creator_email,
                status: 'active',
                last_message_from: 'user',
                last_message_at: Timestamp.now(),
                ai_enabled: settings.ai_auto_reply_enabled !== false,
                ai_reply_count: 0,
                gmail_labels: ['VERALITY_AI'],
                created_at: Timestamp.now(),
                updated_at: Timestamp.now()
            });

            sent++;
            console.log(`[Outreach Sender] ✅ Sent to ${emailItem.creator_email}`);

            // Small delay between sends
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
            console.error(`[Outreach Sender] Failed to send to ${emailItem.creator_email}:`, error.message);

            // Update with error
            await db.collection('outreach_queue').doc(emailItem.id).update({
                status: emailItem.retry_count >= 2 ? 'failed' : 'scheduled',
                retry_count: emailItem.retry_count + 1,
                last_error: error.message,
                scheduled_send_time: Timestamp.fromDate(new Date(Date.now() + 3600000)), // Retry in 1 hour
                updated_at: Timestamp.now()
            });

            failed++;
        }
    }

    // Update user's email count
    await db.collection('user_email_settings').doc(userId).update({
        emails_sent_today: emailsSentToday + sent,
        total_emails_sent: (settings.total_emails_sent || 0) + sent,
        last_email_sent_at: Timestamp.now(),
        updated_at: Timestamp.now()
    });

    return { sent, failed };
}

async function generateOutreachEmail(params: {
    creatorName: string;
    creatorHandle: string;
    creatorPlatform: string;
    userName: string;
    userEmail: string;
    persona: string;
}): Promise<{ subject: string; body: string }> {
    const { creatorName, creatorHandle, creatorPlatform, userName, userEmail, persona } = params;

    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `You are ${persona}. You are reaching out to creators.
                
                **YOUR STYLE (Exact Template to Model)**:
                "Hi [Name], Cory here with Beyond Vision! Hope you're doing well - I'm just getting in touch as we have some available budget with our client, Sheglam for November/December.
                
                We'd love to get you involved on the campaign as soon as possible, please let me know your rate for 1x TikTok post?
                
                If you're not interested in this deal, we work with a bunch of other brands so send over your pricing anyway and we can send over some other campaigns.
                
                Best,
                Cory"

                **Instructions**:
                1. Adapt the above template for the creator
                2. Use their name if provided, otherwise use "Hi there"
                3. Keep it brief and personalized
                4. Sign off as "${userName}" or "Best, ${userName}"
                5. Generate a subject line that's casual and direct`
            },
            {
                role: "user",
                content: `Draft an outreach email for @${creatorHandle} on ${creatorPlatform}. Their name is ${creatorName}.`
            }
        ],
        temperature: 0.7
    });

    const response = completion.choices[0].message.content || "";

    // Extract subject and body
    const subjectMatch = response.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : "Quick opportunity with Sheglam";

    // Remove subject line from body
    const body = response.replace(/Subject:\s*.+\n*/i, '').trim();

    return { subject, body };
}

async function sendGmailMessage(gmail: any, params: {
    to: string;
    subject: string;
    body: string;
    userEmail: string;
}): Promise<{ threadId: string; messageId: string }> {
    const { to, subject, body, userEmail } = params;

    const message = [
        `From: ${userEmail}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
    ].join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });

    return {
        threadId: result.data.threadId,
        messageId: result.data.id
    };
}
