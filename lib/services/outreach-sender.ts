/**
 * Automated Email Sender Cron Job
 * Runs every 5 minutes to send scheduled outreach emails
 * Uses each user's connected Gmail account
 */

import { db } from '@/lib/firebase-admin';
import { google } from 'googleapis';
import OpenAI from 'openai';
import { Timestamp } from 'firebase-admin/firestore';

let openai_inst: OpenAI | null = null;
function getOpenAI() {
    if (!openai_inst) {
        if (!process.env.OPEN_AI_KEY && !process.env.OPENAI_API_KEY) {
            console.warn('OpenAI API key missing. AI features will fail.');
        }
        openai_inst = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY
        });
    }
    return openai_inst;
}

export async function sendScheduledEmails() {
    console.log('[Outreach Sender] Starting scheduled email send...');

    const now = Timestamp.now();

    // Get all emails in scheduled status
    // Filter by time in memory to avoid needing a composite index
    const snapshot = await db.collection('outreach_queue')
        .where('status', '==', 'scheduled')
        .limit(200) // Fetch a larger batch to filter
        .get();

    const emailsToSend = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => {
            const sendTime = d.scheduled_send_time?.toDate?.() || new Date(d.scheduled_send_time);
            return sendTime <= now.toDate();
        })
        .sort((a: any, b: any) => {
            const timeA = a.scheduled_send_time?.toDate?.() || new Date(a.scheduled_send_time);
            const timeB = b.scheduled_send_time?.toDate?.() || new Date(b.scheduled_send_time);
            return timeA.getTime() - timeB.getTime();
        })
        .slice(0, 50); // Process 50 at a time

    console.log(`[Outreach Sender] Found ${emailsToSend.length} emails ready to send (from ${snapshot.size} scheduled)`);

    if (emailsToSend.length === 0) {
        return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Group by user to batch process
    const emailsByUser = new Map<string, any[]>();

    emailsToSend.forEach((data: any) => {
        if (!emailsByUser.has(data.user_id)) {
            emailsByUser.set(data.user_id, []);
        }
        emailsByUser.get(data.user_id)!.push(data);
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

    const connData = gmailConn.data()!;
    let accounts: any[] = connData.accounts || [];

    // Legacy fallback
    if (accounts.length === 0 && connData.email) {
        accounts = [{
            email: connData.email,
            refresh_token: connData.refresh_token,
            access_token: connData.access_token,
            daily_limit: 50,
            sent_today: 0
        }];
    }

    if (accounts.length === 0) {
        console.error(`[Outreach Sender] No connected accounts found for user ${userId}`);
        return { sent: 0, failed: emails.length }; // Or mark failed
    }

    // Get user settings
    const settingsDoc = await db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() || {};

    // Get user data for personalization
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    const userData = userDoc.data() || {};
    const userName = userData.name || userData.first_name || 'Cory';

    let sentCount = 0;
    let failedCount = 0;

    // Usage tracking map: email -> count used in this batch
    const usageMap: Record<string, number> = {};
    const successfulCampaignIds = new Set<string>();

    // Send emails
    for (const emailItem of emails) {
        // Find suitable account
        // We filter for accounts that have NOT reached their limit (considering current batch usage)
        const availableAccounts = accounts.filter(acc => {
            const currentUsage = (acc.sent_today || 0) + (usageMap[acc.email] || 0);
            return currentUsage < (acc.daily_limit || 50);
        });

        if (availableAccounts.length === 0) {
            console.warn(`[Outreach Sender] All accounts reached daily limits for user ${userId}. Skipping remaining.`);
            break;
        }

        // Pick account with lowest usage ratio or just first one? 
        // Let's pick the one with most remaining quota to balance it out
        availableAccounts.sort((a, b) => {
            const remA = (a.daily_limit || 50) - ((a.sent_today || 0) + (usageMap[a.email] || 0));
            const remB = (b.daily_limit || 50) - ((b.sent_today || 0) + (usageMap[b.email] || 0));
            return remB - remA; // Descending order of remaining
        });

        const selectedAccount = availableAccounts[0];
        const sendingEmail = selectedAccount.email;

        console.log(`[Outreach Sender] Selected sender: ${sendingEmail} (Limit: ${selectedAccount.daily_limit}, Used: ${(selectedAccount.sent_today || 0) + (usageMap[sendingEmail] || 0)})`);

        try {
            // Setup Gmail Client for this account
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET
            );
            oauth2Client.setCredentials({ refresh_token: selectedAccount.refresh_token });
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Generate AI email (Personalized from this specific email address)
            const emailContent = await generateOutreachEmail({
                creatorName: emailItem.creator_name || emailItem.creator_handle,
                creatorHandle: emailItem.creator_handle,
                creatorPlatform: emailItem.creator_platform,
                userName: userName,
                userEmail: sendingEmail, // Send from selected account
                persona: settings.ai_persona || "Cory from Beyond Vision",
                templateBody: userData.outreach_persona_message,
                templateSubject: userData.outreach_subject_line
            });

            // Send via Gmail
            const result = await sendGmailMessage(gmail, {
                to: emailItem.creator_email,
                subject: emailContent.subject,
                body: emailContent.body,
                userEmail: sendingEmail
            });

            // Update usage stats immediately in memory
            usageMap[sendingEmail] = (usageMap[sendingEmail] || 0) + 1;

            // Update queue item
            await db.collection('outreach_queue').doc(emailItem.id).update({
                status: 'sent',
                sent_at: Timestamp.now(),
                gmail_thread_id: result.threadId,
                gmail_message_id: result.messageId,
                email_subject: emailContent.subject,
                email_body: emailContent.body,
                sent_from_email: sendingEmail, // Track which email sent it
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
                connected_account_email: sendingEmail, // Key for reply monitoring
                gmail_labels: ['VERALITY_AI'],
                created_at: Timestamp.now(),
                updated_at: Timestamp.now()
            });

            sentCount++;
            if (emailItem.campaign_id) {
                successfulCampaignIds.add(emailItem.campaign_id);
            }
            console.log(`[Outreach Sender] ✅ Sent to ${emailItem.creator_email} via ${sendingEmail}`);

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
            console.error(`[Outreach Sender] Failed to send via ${sendingEmail}:`, error.message);
            // ... Error handling logic same as before ...
            await db.collection('outreach_queue').doc(emailItem.id).update({
                status: emailItem.retry_count >= 2 ? 'failed' : 'scheduled',
                retry_count: emailItem.retry_count + 1,
                last_error: error.message,
                scheduled_send_time: Timestamp.fromDate(new Date(Date.now() + 3600000)), // Retry in 1 hour
                updated_at: Timestamp.now()
            });
            failedCount++;
        }
    }

    // Update DB with new usage counts
    // We fetch the doc again or just update based on what we know? Best to be atomic if possible, but for now simple update.
    // We already have 'accounts' array. We map over it and update sent_today.

    // Refresh the accounts list in case of race conditions? 
    // Ideally yes, but let's just update the fields we changed.

    const updatedAccounts = accounts.map(acc => {
        if (usageMap[acc.email]) {
            return {
                ...acc,
                sent_today: (acc.sent_today || 0) + usageMap[acc.email],
                last_sent_at: new Date().toISOString()
            };
        }
        return acc;
    });

    await db.collection('gmail_connections').doc(userId).update({
        accounts: updatedAccounts,
        updated_at: Timestamp.now()
    });

    // Update user global stats
    await db.collection('user_email_settings').doc(userId).update({
        total_emails_sent: (settings.total_emails_sent || 0) + sentCount,
        last_email_sent_at: Timestamp.now(),
        updated_at: Timestamp.now()
    });

    // UPDATE CAMPAIGN STATUS for all campaigns that had successful sends
    if (successfulCampaignIds.size > 0 && sentCount > 0) {
        await updateCampaignStatus(successfulCampaignIds);
    }

    return { sent: sentCount, failed: failedCount };
}

async function updateCampaignStatus(campaignIds: Set<string>) {
    if (campaignIds.size === 0) return;

    console.log(`[Outreach Sender] Updating status for ${campaignIds.size} campaigns...`);

    for (const campaignId of Array.from(campaignIds)) {
        try {
            const docRef = db.collection('creator_requests').doc(campaignId);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data();
                // Only update if currently "in_progress" (Sending) or "searching" (Finding)
                // Do not overwrite "completed" or if it's already "delivered" (to save write)
                if (data?.status === 'in_progress' || data?.status === 'searching') {
                    await docRef.update({
                        status: 'delivered',
                        updated_at: Timestamp.now()
                    });
                    console.log(`[Outreach Sender] Updated campaign ${campaignId} status to 'delivered' (Sent First Email)`);
                }
            }
        } catch (error) {
            console.error(`[Outreach Sender] Failed to update campaign ${campaignId}:`, error);
        }
    }
}

async function generateOutreachEmail(params: {
    creatorName: string;
    creatorHandle: string;
    creatorPlatform: string;
    userName: string;
    userEmail: string;
    persona: string;
    templateBody?: string;
    templateSubject?: string;
}): Promise<{ subject: string; body: string }> {
    const { creatorName, creatorHandle, creatorPlatform, userName, userEmail, persona, templateBody, templateSubject } = params;

    // 1. STRICT TEMPLATE MODE
    if (templateBody && templateBody.trim().length > 10) {
        // Simple variable replacement
        let body = templateBody
            .replace(/\[Name\]/gi, creatorName || "there")
            .replace(/\[First Name\]/gi, creatorName ? creatorName.split(' ')[0] : "there")
            .replace(/\[Handle\]/gi, creatorHandle || "")
            .replace(/\[Platform\]/gi, creatorPlatform || "social media");

        // Subject handling
        let subject = "Collaboration Opportunity";
        if (templateSubject && templateSubject.trim().length > 0) {
            subject = templateSubject
                .replace(/\[Name\]/gi, creatorName || "")
                .replace(/\[Handle\]/gi, creatorHandle || "");
        } else {
            // Generate subject from body using AI if missing? 
            // Or just use a default. For speed/reliability, default is safer, or quick AI call.
            // Let's do a quick AI call for subject transparency if missing
            try {
                const completion = await getOpenAI().chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "Generate a short, casual subject line for this email body. No quotes." },
                        { role: "user", content: body }
                    ]
                });
                subject = completion.choices[0].message.content?.replace(/"/g, '') || "Collaboration request";
            } catch (e) {
                subject = "Question for you";
            }
        }

        return { subject, body };
    }

    // 2. AI GENERATION MODE
    const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `You are ${persona}. You are reaching out to creators.
                
                **YOUR STYLE (Exact Template to Model)**:
                "Hey!

                Cory here with Beyond Vision! Hope you're doing well - I'm just getting in touch as we have some available budget with our client, Sheglam for November/December. 

                We'd love to get you involved on the campaign as soon as possible, please let me know your rate for 1x TikTok post?

                If you're not interested in this deal, we work with a bunch of other brands so send over your pricing anyway and we can send over some other campaigns.

                Best,

                Cory"

                **Instructions**:
                1. Adapt the above template for the creator
                2. Use their name if provided, otherwise using "Hey!" or "Hi there" is fine.
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
    const subject = subjectMatch ? subjectMatch[1].trim() : (templateSubject || "Quick opportunity");

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
