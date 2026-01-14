/**
 * 24/7 Reply Monitor
 * Checks all users' Gmail inboxes for creator replies
 * Automatically responds using AI
 */

import { db } from '@/lib/firebase-admin';
import { google } from 'googleapis';
import OpenAI from 'openai';
import { Timestamp } from 'firebase-admin/firestore';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function monitorAllReplies() {
    console.log('[Reply Monitor] Starting reply check for all users...');

    // Get all users with Gmail connected and AI enabled
    const settingsSnapshot = await db.collection('user_email_settings')
        .where('gmail_connected', '==', true)
        .where('ai_auto_reply_enabled', '==', true)
        .get();

    console.log(`[Reply Monitor] Checking ${settingsSnapshot.size} users`);

    let totalReplies = 0;
    let totalResponses = 0;

    for (const settingsDoc of settingsSnapshot.docs) {
        const userId = settingsDoc.id;

        try {
            const result = await checkUserReplies(userId);
            totalReplies += result.repliesFound;
            totalResponses += result.responsesSent;
        } catch (error: any) {
            console.error(`[Reply Monitor] Error for user ${userId}:`, error.message);
        }

        // Small delay between users
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Reply Monitor] Complete. Replies: ${totalReplies}, Responses: ${totalResponses}`);
    return { totalReplies, totalResponses };
}

async function checkUserReplies(userId: string) {
    console.log(`[Reply Monitor] Checking user ${userId}`);

    // Get Gmail connection
    const gmailConn = await db.collection('gmail_connections').doc(userId).get();
    if (!gmailConn.exists) {
        return { repliesFound: 0, responsesSent: 0 };
    }

    const { refresh_token } = gmailConn.data()!;

    // Setup Gmail client
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get user settings
    const settingsDoc = await db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() || {};

    // Get user data
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    const userData = userDoc.data() || {};
    const userName = userData.name || userData.first_name || 'Cory';
    const userEmail = userData.email || settings.gmail_email;

    // Check for threads with VERALITY_AI label
    const threadsRes = await gmail.users.threads.list({
        userId: 'me',
        q: 'label:VERALITY_AI is:unread',
        maxResults: 20
    });

    const threads = threadsRes.data.threads || [];
    console.log(`[Reply Monitor] User ${userId}: Found ${threads.length} unread threads`);

    if (threads.length === 0) {
        return { repliesFound: 0, responsesSent: 0 };
    }

    let repliesFound = 0;
    let responsesSent = 0;

    for (const thread of threads) {
        try {
            // Get full thread
            const threadData = await gmail.users.threads.get({
                userId: 'me',
                id: thread.id!
            });

            const messages = threadData.data.messages || [];
            if (messages.length === 0) continue;

            // Get last message
            const lastMessage = messages[messages.length - 1];
            const headers = lastMessage.payload?.headers || [];

            // Check if last message is from creator (not from us)
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
            const from = fromHeader?.value || '';

            if (from.toLowerCase().includes(userEmail.toLowerCase())) {
                // Last message was from us, skip
                continue;
            }

            repliesFound++;

            // Get thread tracking
            const threadDoc = await db.collection('email_threads').doc(thread.id!).get();
            if (!threadDoc.exists) {
                console.log(`[Reply Monitor] Thread ${thread.id} not tracked, skipping`);
                continue;
            }

            const threadData_db = threadDoc.data()!;

            // Check if AI should respond
            if (!threadData_db.ai_enabled) {
                console.log(`[Reply Monitor] AI disabled for thread ${thread.id}`);
                continue;
            }

            // Extract message body
            const messageBody = extractMessageBody(lastMessage);

            // Generate AI response
            const aiResponse = await generateAIReply({
                creatorMessage: messageBody,
                threadHistory: messages.slice(0, -1).map(m => extractMessageBody(m)).join('\n\n'),
                userName: userName,
                persona: settings.ai_persona || "Cory from Beyond Vision"
            });

            // Check if AI says to ignore
            if (aiResponse.toLowerCase().includes('ignore')) {
                console.log(`[Reply Monitor] AI suggests ignoring thread ${thread.id}`);

                // Update thread status
                await db.collection('email_threads').doc(thread.id!).update({
                    status: 'closed',
                    updated_at: Timestamp.now()
                });

                // Mark as read
                await gmail.users.threads.modify({
                    userId: 'me',
                    id: thread.id!,
                    requestBody: {
                        removeLabelIds: ['UNREAD']
                    }
                });

                continue;
            }

            // Send AI reply
            await sendGmailReply(gmail, {
                threadId: thread.id!,
                messageId: lastMessage.id!,
                body: aiResponse,
                userEmail: userEmail
            });

            // Extract data from creator's message
            const extractedData = await extractCreatorData(messageBody);

            // Update thread tracking
            await db.collection('email_threads').doc(thread.id!).update({
                last_message_from: 'user',
                last_message_at: Timestamp.now(),
                ai_reply_count: (threadData_db.ai_reply_count || 0) + 1,
                phone_number: extractedData.phone || threadData_db.phone_number,
                tiktok_rate: extractedData.tiktok_rate || threadData_db.tiktok_rate,
                sound_promo_rate: extractedData.sound_promo_rate || threadData_db.sound_promo_rate,
                updated_at: Timestamp.now()
            });

            // Update outreach queue status
            await db.collection('outreach_queue')
                .where('gmail_thread_id', '==', thread.id)
                .limit(1)
                .get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        return snapshot.docs[0].ref.update({
                            status: 'replied',
                            updated_at: Timestamp.now()
                        });
                    }
                });

            responsesSent++;
            console.log(`[Reply Monitor] ✅ Sent AI reply for thread ${thread.id}`);

            // Mark as read
            await gmail.users.threads.modify({
                userId: 'me',
                id: thread.id!,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });

            // Update user stats
            await db.collection('user_email_settings').doc(userId).update({
                total_replies_received: (settings.total_replies_received || 0) + 1,
                updated_at: Timestamp.now()
            });

        } catch (error: any) {
            console.error(`[Reply Monitor] Error processing thread ${thread.id}:`, error.message);
        }
    }

    return { repliesFound, responsesSent };
}

async function generateAIReply(params: {
    creatorMessage: string;
    threadHistory: string;
    userName: string;
    persona: string;
}): Promise<string> {
    const { creatorMessage, threadHistory, userName, persona } = params;

    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `You are ${persona}. You are negotiating with a Creator (or their manager).
                
                **YOUR STYLE (Based on proven examples)**:
                - Start with: "Thanks for that!" or "Great to hear from you!"
                - Tone: Friendly, professional, upbeat, but direct.
                - You are looking for specific rates for campaigns like "Sheglam".

                **YOUR SPECIFIC GOALS**:
                1. **Flat Rate in USD** for a "1x TikTok post" or "Sound Promo". (If they give a range, ask for a specific flat USD rate).
                2. **Phone Number**: Always ask for a phone number (theirs or a manager's) for "drafting purposes". Request include international dialing code (e.g., +1).

                **SCENARIO HANDLING**:

                1. **THEY GAVE A TIKTOK RATE**
                   - Reply: "Thanks for that! Could you also let me know your rate for a Sound Promo in USD? Also, do you have a phone number (yours or a manager's) we can use for drafting? Please include the international dialing code (e.g., +1)."

                2. **THEY GAVE EVERYTHING**
                   - Reply: "Thanks for sending those over! I'll be in touch soon regarding Sheglam and any other upcoming campaigns that would be a good fit for you. Best, ${userName}"

                3. **THEY GAVE A RANGE / WRONG CURRENCY**
                   - Reply: "To move forward and get everything logged in our system, we do require a single flat rate for both Sound Promos and Brand Deals in USD. Could you clarify that for me?"

                **STRICT RULES**:
                - Sign off ONLY as "Best, ${userName}".
                - NEVER suggest a call or Zoom.
                - Keep it human and brief.
                
                If they seem uninterested 2+ times, reply "IGNORE".`
            },
            {
                role: "user",
                content: `Previous conversation:\n${threadHistory}\n\nTheir latest message:\n${creatorMessage}\n\nGenerate your response:`
            }
        ],
        temperature: 0.7
    });

    return completion.choices[0].message.content || "";
}

async function extractCreatorData(message: string): Promise<{
    phone?: string;
    tiktok_rate?: number;
    sound_promo_rate?: number;
}> {
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `Extract the following data from the creator's message:
                1. Phone number (with international code if provided)
                2. TikTok post rate (in USD)
                3. Sound Promo rate (in USD)
                
                Return ONLY a JSON object with keys: phone, tiktok_rate, sound_promo_rate
                If a field is not found, omit it from the JSON.`
            },
            {
                role: "user",
                content: message
            }
        ],
        temperature: 0
    });

    try {
        const response = completion.choices[0].message.content || "{}";
        return JSON.parse(response);
    } catch {
        return {};
    }
}

function extractMessageBody(message: any): string {
    const payload = message.payload;
    if (!payload) return '';

    // Try to get plain text body
    if (payload.body?.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Check parts
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
        }
    }

    return '';
}

async function sendGmailReply(gmail: any, params: {
    threadId: string;
    messageId: string;
    body: string;
    userEmail: string;
}) {
    const { threadId, messageId, body, userEmail } = params;

    // Get original message to extract headers
    const originalMsg = await gmail.users.messages.get({
        userId: 'me',
        id: messageId
    });

    const headers = originalMsg.data.payload.headers;
    const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
    const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');

    const to = toHeader?.value || '';
    const subject = subjectHeader?.value || '';
    const reSubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

    const message = [
        `From: ${userEmail}`,
        `To: ${to}`,
        `Subject: ${reSubject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        '',
        body
    ].join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage,
            threadId: threadId
        }
    });
}
