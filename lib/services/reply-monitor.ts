/**
 * 24/7 Reply Monitor
 * Checks all users' Gmail inboxes for creator replies
 * Automatically responds using AI
 */

import { db } from '@/lib/firebase-admin';
import { google } from 'googleapis';
import OpenAI from 'openai';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

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

// Helper to get Google Profile Name
async function getAccountName(auth: any): Promise<string> {
    try {
        const gmail = google.gmail({ version: 'v1', auth });
        const profile = await gmail.users.getProfile({ userId: 'me' });
        // Gmail profile doesn't always have name. We might need People API or just rely on DB settings.
        // For now, let's try to assume the user wants the name associated with the account.
        // If we can't get it, we'll return null and fallback.
        return "";
    } catch {
        return "";
    }
}

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

            // Update last check timestamp
            await db.collection('user_email_settings').doc(userId).update({
                last_reply_check: Timestamp.now(),
                updated_at: Timestamp.now()
            });
        } catch (error: any) {
            // console.error(`[Reply Monitor] Error for user ${userId}:`, error.message);
        }

        // Small delay between users
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[Reply Monitor] Complete. Replies: ${totalReplies}, Responses: ${totalResponses}`);
    return { totalReplies, totalResponses };
}

async function checkUserReplies(userId: string) {
    // console.log(`[Reply Monitor] Checking user ${userId}`);

    // Get Gmail connections (ALL of them)
    const gmailConn = await db.collection('gmail_connections').doc(userId).get();
    if (!gmailConn.exists) {
        return { repliesFound: 0, responsesSent: 0 };
    }

    const data = gmailConn.data()!;
    // Standardize accounts list: keys are 'email', 'refresh_token', 'name' (optional)
    const accounts = [];

    // Add Primary
    if (data.email && data.refresh_token) {
        accounts.push({
            email: data.email,
            refresh_token: data.refresh_token,
            name: data.name // Might be tracked here?
        });
    }
    // Add Secondary
    if (data.accounts && Array.isArray(data.accounts)) {
        data.accounts.forEach((acc: any) => {
            if (acc.email && acc.refresh_token && acc.email !== data.email) {
                accounts.push(acc);
            }
        });
    }

    // Get user settings (Global fallback)
    const settingsDoc = await db.collection('user_email_settings').doc(userId).get();
    const settings = settingsDoc.data() || {};

    // Get user data (Global fallback)
    const userDoc = await db.collection('user_accounts').doc(userId).get();
    const userData = userDoc.data() || {};
    const globalName = userData.name || userData.first_name || 'Cory'; // Absolute fallback

    let totalReplies = 0;
    let totalSent = 0;

    // Iterate through EACH account
    for (const account of accounts) {
        // console.log(`[Reply Monitor] Checking inbox: ${account.email}`);

        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
                process.env.GMAIL_CLIENT_SECRET
            );
            oauth2Client.setCredentials({ refresh_token: account.refresh_token });
            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Determine Name for THIS account
            // 1. Explicitly saved name for this connected account
            // 2. Name from User Account (Global)
            let senderName = account.name || globalName;

            // Check for threads in the last 2 days
            const threadsRes = await gmail.users.threads.list({
                userId: 'me',
                q: 'label:INBOX newer_than:2d',
                maxResults: 50
            });

            const threads = threadsRes.data.threads || [];
            if (threads.length === 0) continue;

            // console.log(`[Reply Monitor] ${account.email}: Found ${threads.length} unread threads`);

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
                    const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
                    const from = fromHeader?.value || '';

                    // Skip if from US (checking current account email)
                    if (from.toLowerCase().includes(account.email.toLowerCase())) {
                        continue;
                    }

                    totalReplies++;

                    // Get thread tracking or attempt recovery
                    let threadDoc = await db.collection('email_threads').doc(thread.id!).get();
                    let threadData_db = threadDoc.exists ? threadDoc.data()! : null;

                    if (!threadDoc.exists) {
                        console.log(`[Reply Monitor] Thread ${thread.id} not tracked. Attempting recovery...`);

                        const creatorEmailMatch = from.match(/<([^>]+)>/);
                        const creatorEmail = (creatorEmailMatch ? creatorEmailMatch[1] : from).toLowerCase().trim();
                        console.log(`[Reply Monitor] Attempting recovery for thread ${thread.id} (Email: ${creatorEmail})`);

                        // 1. Try to find by thread ID (most reliable)
                        let queueSnap = await db.collection('outreach_queue')
                            .where('gmail_thread_id', '==', thread.id)
                            .limit(1)
                            .get();

                        // 2. Fallback to creator email
                        if (queueSnap.empty) {
                            queueSnap = await db.collection('outreach_queue')
                                .where('creator_email', '==', creatorEmail)
                                .where('user_id', '==', userId)
                                .orderBy('created_at', 'desc')
                                .limit(1)
                                .get();
                        }

                        if (!queueSnap.empty) {
                            const queueItem = queueSnap.docs[0].data();
                            console.log(`[Reply Monitor] Recovered thread ${thread.id} for creator ${queueItem.creator_id}`);

                            await db.collection('email_threads').doc(thread.id!).set({
                                user_id: userId,
                                creator_id: queueItem.creator_id,
                                creator_email: creatorEmail,
                                status: 'active',
                                last_message_from: 'creator',
                                last_message_at: Timestamp.now(),
                                ai_enabled: settings.ai_auto_reply_enabled !== false,
                                ai_reply_count: 0,
                                connected_account_email: account.email, // Bind to THIS account
                                gmail_labels: ['VERALITY_AI'],
                                created_at: Timestamp.now(),
                                updated_at: Timestamp.now()
                            });

                            // UPDATE QUEUE STATUS
                            // Find the queue item and mark it as replied
                            const queueDocs = await db.collection('outreach_queue')
                                .where('creator_email', '==', creatorEmail)
                                .where('user_id', '==', userId)
                                .limit(1)
                                .get();

                            if (!queueDocs.empty) {
                                await queueDocs.docs[0].ref.update({
                                    status: 'replied',
                                    updated_at: Timestamp.now()
                                });
                            }

                            threadDoc = await db.collection('email_threads').doc(thread.id!).get();
                            threadData_db = threadDoc.data()!;
                        } else {
                            console.log(`[Reply Monitor] FAILED recovery for ${thread.id}. Email '${creatorEmail}' not found in queue.`);
                            continue;
                        }
                    }

                    if (!threadData_db || !threadData_db.ai_enabled) {
                        console.log(`[Reply Monitor] Thread ${thread.id} skipped - AI disabled or data missing.`);
                        continue;
                    }

                    // Skip if we already processed this exact message
                    if (threadData_db.last_processed_message_id === lastMessage.id) {
                        console.log(`[Reply Monitor] Thread ${thread.id} already processed (Message ID: ${lastMessage.id})`);
                        continue;
                    }

                    console.log(`[Reply Monitor] Processing reply for thread ${thread.id} from creator ${threadData_db.creator_email}`);

                    // Skip if the last message is from US (secondary check)
                    if (threadData_db.last_message_from === 'user' && threadData_db.last_message_at) {
                        // If it was more than 1 minute ago, maybe we can assume it's stable.
                        // But mostly if it's from 'user', we shouldn't reply again unless creator replied.
                        // Actually, the header check above (line 160) already handles this for the very last message.
                    }

                    // Use sender name specific to this thread if tracked, else current account logic
                    // If we just recovered it, we set connected_account_email to account.email.
                    // If it was already tracked, rely on account.email.

                    const messageBody = extractMessageBody(lastMessage);

                    const aiResponse = await generateAIReply({
                        creatorMessage: messageBody,
                        threadHistory: messages.slice(0, -1).map(m => extractMessageBody(m)).join('\n\n'),
                        userName: senderName, // USES CORRECT NAME for this account
                        persona: settings.ai_persona || `Outreach Specialist at Verality`
                    });

                    console.log(`[Reply Monitor] AI Response for ${thread.id}: ${aiResponse.substring(0, 50)}...`);

                    if (aiResponse.toLowerCase().includes('ignore')) {
                        console.log(`[Reply Monitor] AI decided to IGNORE thread ${thread.id}`);
                        await db.collection('email_threads').doc(thread.id!).update({
                            status: 'closed',
                            updated_at: Timestamp.now()
                        });
                        await gmail.users.threads.modify({
                            userId: 'me',
                            id: thread.id!,
                            requestBody: { removeLabelIds: ['UNREAD'] }
                        });
                        continue;
                    }

                    await sendGmailReply(gmail, {
                        threadId: thread.id!,
                        messageId: lastMessage.id!,
                        body: aiResponse,
                        userEmail: account.email // Send from CORRECT account
                    });

                    // Update data
                    // Update data
                    const extractedData = await extractCreatorData(messageBody);
                    await db.collection('email_threads').doc(thread.id!).update({
                        last_message_from: 'user',
                        last_message_at: Timestamp.now(),
                        last_processed_message_id: lastMessage.id, // TRACK THIS
                        ai_reply_count: (threadData_db.ai_reply_count || 0) + 1,
                        phone_number: extractedData.phone || threadData_db.phone_number,
                        tiktok_rate: extractedData.tiktok_rate || threadData_db.tiktok_rate,
                        sound_promo_rate: extractedData.sound_promo_rate || threadData_db.sound_promo_rate,
                        key_points: extractedData.key_points || [],
                        updated_at: Timestamp.now()
                    });

                    // Increment User Stats
                    await db.collection('user_email_settings').doc(userId).set({
                        total_replies_received: FieldValue.increment(1),
                        updated_at: Timestamp.now()
                    }, { merge: true });

                    // Mark read
                    await gmail.users.threads.modify({
                        userId: 'me',
                        id: thread.id!,
                        requestBody: { removeLabelIds: ['UNREAD'] }
                    });

                    totalSent++;
                    console.log(`[Reply Monitor] ✅ Sent AI reply from ${account.email} as ${senderName}`);

                } catch (e) {
                    // Ignore individual thread errors
                }
            }

        } catch (e: any) {
            console.error(`[Reply Monitor] Error connecting to ${account.email}:`, e.message);
        }
    }

    return { repliesFound: totalReplies, responsesSent: totalSent };
}

async function generateAIReply(params: {
    creatorMessage: string;
    threadHistory: string;
    userName: string;
    persona: string;
}): Promise<string> {
    const { creatorMessage, threadHistory, userName, persona } = params;

    const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `You are ${userName}. (Do NOT use any other name).
                
                **YOUR ROLE**:
                You are ${persona}. You are negotiating brand deals.
                
                **FIRST STEP: ANALYZE THE CONTEXT**:
                - Look at the VERY FIRST message sent by YOU (the user) in the \`Previous conversation\`.
                - What was the original request? (e.g. YouTube Integration? TikTok Post? Sound Promo?)
                - **STICK TO THAT GOAL**. Do not pivot to TikTok if the thread is about YouTube.

                **YOUR STYLE**:
                - Friendly, professional, upbeat, but direct.
                - Start with: "Thanks for that!" or "Great to hear from you!" or "Thanks for getting back to me!"

                **SCENARIO HANDLING RULES**:
                
                1. **GIFTING vs PAID**:
                   - IF they offered "Gifting only" or "Free product" (e.g. "I do it for free, just ship items"):
                   - AND your goal is PAID (e.g. you asked for a rate):
                   - RESPONSE: Gently push back. "Thanks for explaining! For this specific campaign, the brand is looking for a dedicated paid integration... I'd be happy to ask the team if gifting-only works, but could you let me know if you'd consider a paid integration and what that rate might be?"
                
                2. **THEY GAVE THE RATE YOU ASKED FOR**:
                   - "Thanks for sending those over! I'll be in touch soon regarding the campaign. Best, ${userName}"

                3. **THEY ASKED A QUESTION**:
                   - Answer it simply and redirect back to getting the rate/info needed.
                
                4. **GENERAL NEGOTIATION**:
                   - If you asked for a "YouTube 2-min integration" rate, DO NOT ask for a TikTok rate unless they brought it up.
                   - If you asked for TikTok, stick to TikTok.
                   - ALWAYS ask for a **Phone Number** for drafting purposes if you don't have it yet.

                **Strict Rules**:
                - Sign off ONLY as "Best, ${userName}".
                - NEVER suggest a call or Zoom.
                - Keep it under 4-5 sentences.
                - If they seem uninterested 2+ times, reply "IGNORE".`
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
    key_points?: string[];
}> {
    const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `Extract the following data from the creator's message:
                1. Phone number (with international code if provided)
                2. TikTok post rate (in USD). LOOK FOR FORMATS LIKE: "usd 400", "400 usd", "$400", "400".
                3. Sound Promo rate (in USD). LOOK FOR FORMATS LIKE: "usd 200", "200 usd", "$200".
                4. Key Points: A JSON array of 3-5 strings summarizing the key info, negotiations, or questions.
                
                Return ONLY a JSON object with keys: phone, tiktok_rate, sound_promo_rate, key_points
                If a field is not found, omit it from the JSON.
                Ensure rates are NUMBERS in the JSON (e.g. 400 not "400").`
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
