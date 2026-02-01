/**
 * 24/7 Reply Monitor
 * Checks all users' Gmail inboxes for creator replies
 * Automatically responds using AI
 */

import { db } from '../firebase-admin';
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
    // Standardize accounts list
    const accounts = [];

    // Add Primary
    if (data.email && data.refresh_token) {
        accounts.push({
            email: data.email,
            refresh_token: data.refresh_token,
            name: data.name
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

    // Dynamic Fallbacks
    const globalName = userData.name || userData.first_name || 'Outreach Manager';
    const companyName = userData.company_name || userData.company || 'our brand';

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
            let senderName = account.name || globalName;

            // Check for threads in the last 2 days
            const threadsRes = await gmail.users.threads.list({
                userId: 'me',
                q: 'label:INBOX newer_than:2d',
                maxResults: 50
            });

            const threads = threadsRes.data.threads || [];
            if (threads.length === 0) continue;

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
                        try {
                            const creatorEmailMatch = from.match(/<([^>]+)>/);
                            const creatorEmail = (creatorEmailMatch ? creatorEmailMatch[1] : from).toLowerCase().trim();

                            // Try to find context from queue
                            const queueSnap = await db.collection('outreach_queue')
                                .where('creator_email', '==', creatorEmail)
                                .where('user_id', '==', userId)
                                .limit(1)
                                .get();

                            if (!queueSnap.empty) {
                                const queueItem = queueSnap.docs[0].data();
                                await db.collection('email_threads').doc(thread.id!).set({
                                    user_id: userId,
                                    creator_id: queueItem.creator_id,
                                    creator_email: creatorEmail,
                                    status: 'active',
                                    last_message_from: 'creator',
                                    last_message_at: Timestamp.now(),
                                    ai_enabled: settings.ai_auto_reply_enabled !== false,
                                    ai_reply_count: 0,
                                    connected_account_email: account.email,
                                    gmail_labels: ['VERALITY_AI'],
                                    created_at: Timestamp.now(),
                                    updated_at: Timestamp.now()
                                });
                                threadDoc = await db.collection('email_threads').doc(thread.id!).get();
                                threadData_db = threadDoc.data()!;
                            }
                        } catch (recErr) {
                            console.log(`[Recovery Failed] ${thread.id}`);
                        }
                    }

                    if (!threadData_db || !threadData_db.ai_enabled) continue;

                    // Skip if we already processed this exact message
                    if (threadData_db.last_processed_message_id === lastMessage.id) continue;

                    console.log(`[Reply Monitor] Processing reply for thread ${thread.id} from creator ${threadData_db.creator_email}`);

                    const messageBody = extractMessageBody(lastMessage);

                    // --- GENERATE AI RESPONSE ---
                    const aiResult = await generateAIReply({
                        creatorMessage: messageBody,
                        threadHistory: messages.slice(0, -1).map(m => extractMessageBody(m)).join('\n\n'),
                        userName: senderName,
                        companyName: companyName,
                        persona: settings.ai_persona || `Campaign Manager`
                    });

                    // Parse the JSON response
                    let aiResponseText = "";
                    let detectedIntent = "unknown";

                    try {
                        const parsed = JSON.parse(aiResult);
                        aiResponseText = parsed.reply_text || "";
                        detectedIntent = parsed.intent || "unknown";
                    } catch (e) {
                        console.error("AI JSON Parse Error", e);
                        aiResponseText = aiResult; // Fallback to raw text if JSON fails
                    }

                    console.log(`[Reply Monitor] AI Decision: ${detectedIntent} | Reply: ${aiResponseText ? 'YES' : 'NO'}`);

                    // Handle "IGNORE" or empty cases
                    if (aiResponseText.trim().toUpperCase() === 'IGNORE' || !aiResponseText) {
                        await db.collection('email_threads').doc(thread.id!).update({
                            intent: detectedIntent, // Save intent even if ignoring
                            last_processed_message_id: lastMessage.id,
                            status: (detectedIntent === 'not_interested' || detectedIntent === 'out_of_office') ? 'closed' : 'active',
                            updated_at: Timestamp.now()
                        });

                        // Mark read so we don't loop
                        await gmail.users.threads.modify({
                            userId: 'me',
                            id: thread.id!,
                            requestBody: { removeLabelIds: ['UNREAD'] }
                        });
                        continue;
                    }

                    // Send the Reply
                    await sendGmailReply(gmail, {
                        threadId: thread.id!,
                        messageId: lastMessage.id!,
                        body: aiResponseText,
                        userEmail: account.email
                    });

                    // Update Data & Metrics
                    const extractedData = await extractCreatorData(messageBody);

                    await db.collection('email_threads').doc(thread.id!).update({
                        last_message_from: 'user',
                        last_message_at: Timestamp.now(),
                        last_processed_message_id: lastMessage.id,
                        ai_reply_count: (threadData_db.ai_reply_count || 0) + 1,

                        // NEW fields for metrics
                        intent: detectedIntent,
                        intent_last_updated: Timestamp.now(),

                        phone_number: extractedData.phone || threadData_db.phone_number,
                        tiktok_rate: extractedData.tiktok_rate || threadData_db.tiktok_rate,
                        sound_promo_rate: extractedData.sound_promo_rate || threadData_db.sound_promo_rate,
                        key_points: extractedData.key_points || [],

                        updated_at: Timestamp.now()
                    });

                    // Increment Stats
                    await db.collection('user_email_settings').doc(userId).set({
                        total_replies_received: FieldValue.increment(1),
                        total_ai_replies_sent: FieldValue.increment(1),
                        updated_at: Timestamp.now()
                    }, { merge: true });

                    // Mark read
                    await gmail.users.threads.modify({
                        userId: 'me',
                        id: thread.id!,
                        requestBody: { removeLabelIds: ['UNREAD'] }
                    });

                    totalSent++;
                    console.log(`[Reply Monitor] ✅ Sent AI reply to ${threadData_db.creator_email}`);

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
    companyName: string;
    persona: string;
}): Promise<string> {
    const { creatorMessage, threadHistory, userName, companyName, persona } = params;

    const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" }, // FORCE JSON
        messages: [
            {
                role: "system",
                content: `You are ${userName}, working with ${companyName}.
                
                **YOUR TASK**:
                Analyze the creator's email and generate the appropriate response (or decision to ignore).
                
                **OUTPUT FORMAT (JSON ONLY)**:
                {
                   "intent": "interested" | "price_inquiry" | "not_interested" | "out_of_office" | "needs_info" | "deal_accepted" | "unknown",
                   "reply_text": "The email body..." (or "IGNORE" if no reply needed),
                   "reasoning": "Why you chose this reply..."
                }

                **INTENT DEFINITIONS**:
                - "price_inquiry": Asking for budget/rates.
                - "interested": Positive sentiment, willing to collab.
                - "deal_accepted": Agreed to terms or sent contract back.
                - "not_interested": Explicit no.

                **STRATEGY**:
                - Goal 1: Get their **Flat Rate in USD** for the campaign (check history if already asked).
                - Goal 2: Get a **Phone Number** for "drafting the agreement".
                - Tone: Brief, Casual Professional. (e.g. "Hey [Name], thanks for the quick reply!").
                - Length: Under 4 sentences.
                - **NEVER** suggest a call/Zoom. We work asynchronously.

                **SCENARIOS**:
                1. **Gift/Product Only**: If they offer free work for product -> Ask if they have a PAID rate. We prefer paid partnerships.
                2. **Rate Provided**: If they explicitly gave a rate -> Acknowledge it. "Thanks! I'll run this by the team and get back to you shortly."
                3. **Not Interested**: Return "reply_text": "IGNORE" (and intent: "not_interested").
                
                **SIGNATURE**:
                "Best,\n${userName}"`
            },
            {
                role: "user",
                content: `HISTORY:\n${threadHistory}\n\nLATEST MESSAGE:\n${creatorMessage}`
            }
        ],
        temperature: 0.7
    });

    return completion.choices[0].message.content || "{}";
}

async function extractCreatorData(message: string): Promise<{
    phone?: string;
    tiktok_rate?: number;
    sound_promo_rate?: number;
    key_points?: string[];
}> {
    const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `Extract the following data from the creator's message:
                1. Phone number (any format, e.g. +1..., (555)..., or just digits. PREFER international format if possible).
                2. TikTok post rate (in USD). Interpret "1k" as 1000. If they just say "rate is $500", assume TikTok rate.
                3. Sound Promo rate (in USD).
                4. Key Points: A JSON array of 3-5 strings summarizing the key info.
                
                Return ONLY a JSON object with keys: phone, tiktok_rate, sound_promo_rate, key_points.
                If a field is not found, omit it from the JSON.
                Ensure rates are clean NUMBERS (e.g. 400 not "400").`
            },
            {
                role: "user",
                content: `Message Body:\n${message}`
            }
        ],
        temperature: 0
    });

    try {
        const response = completion.choices[0].message.content || "{}";
        console.log(`[Reply Monitor] Extracted Data Raw: ${response}`);
        return JSON.parse(response);
    } catch (e) {
        console.error(`[Reply Monitor] Extraction Error:`, e);
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
    let htmlBody = '';
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            if (part.mimeType === 'text/html' && part.body?.data) {
                htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            // Handle nested parts (multipart/alternative)
            if (part.parts) {
                for (const subPart of part.parts) {
                    if (subPart.mimeType === 'text/plain' && subPart.body?.data) {
                        return Buffer.from(subPart.body.data, 'base64').toString('utf-8');
                    }
                    if (subPart.mimeType === 'text/html' && subPart.body?.data) {
                        htmlBody = Buffer.from(subPart.body.data, 'base64').toString('utf-8');
                    }
                }
            }
        }
    }

    // Fallback to HTML if no plain text found
    if (htmlBody) {
        // Simple strip tags
        return htmlBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
