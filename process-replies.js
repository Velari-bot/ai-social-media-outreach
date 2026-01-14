
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// --- 1. Load Environment Variables ---
function loadEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                if (!process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        });
    }
}
loadEnv();

// --- 2. Initialize Firebase Admin ---
if (!admin.apps.length) {
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        console.error('Error parsing service account');
        process.exit(1);
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const OpenAI = require('openai');

// Initialize OpenAI (key loaded from env)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- 3. Reply Processor Logic ---
async function processReplies() {
    const targetEmail = 'benderaiden826@gmail.com';
    console.log(`\n--- STARTING REPLY PROCESSOR ---`);
    console.log(`Checking inbox for: ${targetEmail}`);

    // A. User Lookup
    const usersRef = db.collection('user_accounts');
    let userDocSnap = await usersRef.where('email', '==', targetEmail).limit(1).get();
    if (userDocSnap.empty) {
        userDocSnap = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
    }
    if (userDocSnap.empty) {
        console.error('User not found!');
        return;
    }
    const userId = userDocSnap.docs[0].id;
    const userData = userDocSnap.docs[0].data();

    // CUSTOM BUSINESS NAME (or default to Verality)
    const businessName = userData.business_name || "Verality";
    const teamName = `${businessName} Team`;

    console.log(`User ID: ${userId} | Business: ${businessName}`);

    // B. Get Tokens
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    if (!connDoc.exists) {
        console.error('No Gmail connection.');
        return;
    }
    const { refresh_token } = connDoc.data();

    // C. Setup Gmail Client
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // D. Check for Threads with Label (Read or Unread)
    console.log('Checking for recent threads...');
    // We list threads instead of messages to get the conversation state
    const listRes = await gmail.users.threads.list({
        userId: 'me',
        q: 'label:VERALITY_AI',
        maxResults: 10 // Check last 10 active threads
    });

    const threads = listRes.data.threads || [];
    console.log(`Found ${threads.length} active threads.`);

    if (threads.length === 0) {
        console.log('No threads found with label VERALITY_AI.');
        return;
    }

    // E. Process Threads
    for (const th of threads) {
        // Fetch full thread details
        const threadDetails = await gmail.users.threads.get({ userId: 'me', id: th.id });
        const messages = threadDetails.data.messages || [];

        if (messages.length === 0) continue;

        // CHECK: Thread Settings (User Control)
        // Default is 'active' if no doc exists
        const settingsDoc = await db.collection('thread_settings').doc(th.id).get();
        const threadStatus = settingsDoc.exists ? settingsDoc.data().status : 'active';

        if (threadStatus === 'paused') {
            console.log(`\nSkipping Thread ${th.id}: AI is PAUSED by user.`);
            continue;
        }

        // Get the very last message in the thread
        const lastMsg = messages[messages.length - 1];
        const lastMsgHeaders = lastMsg.payload.headers;
        const lastSubject = lastMsgHeaders.find(h => h.name === 'Subject')?.value || '';
        const lastFrom = lastMsgHeaders.find(h => h.name === 'From')?.value || '';
        const lastFromEmail = lastFrom.match(/<([^>]+)>/)?.[1] || lastFrom;

        // CHECK: Is the last message from ME (the bot) or the CREATOR?
        // Adapting check to match the bot's email from environment or hardcoded
        const botEmail = 'benderaiden826@gmail.com';

        // If the last email is from US, we are waiting for their reply -> SKIP
        if (lastFromEmail.includes(botEmail) || lastFrom.includes('Verality AI')) {
            console.log(`\nThread ${th.id}: Last message is from US. Waiting for reply...`);
            continue;
        }

        console.log(`\nProcessing Thread: ${lastSubject} (Last Msg From: ${lastFrom})`);

        // --- HUMAN-LIKE DELAY CHECK ---
        const lastMsgInternalDate = parseInt(lastMsg.internalDate || '0');
        const nowTime = Date.now();
        const elapsedMinutes = (nowTime - lastMsgInternalDate) / (1000 * 60);

        // Deterministic delay (5-15 mins) based on message ID
        // This ensures the delay doesn't keep changing on every poll
        const seed = (lastMsg.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomDelay = (seed % 11) + 5; // 5 to 15 minutes

        if (elapsedMinutes < randomDelay) {
            console.log(`[Delay] Skipping thread ${th.id} - too soon. Received ${elapsedMinutes.toFixed(1)}m ago. Target delay: ${randomDelay}m.`);
            continue;
        }
        // ------------------------------

        // Setup variables for AI context (using last message details)
        const details = await gmail.users.messages.get({ userId: 'me', id: lastMsg.id, format: 'full' }); // Redundant but consistent
        const from = lastFrom;
        const subject = lastSubject;
        const threadId = th.id;

        // Reuse thread history from above
        // const threadMessages = messages; // Already available

        // Helper to extract text body
        const getBody = (payload) => {
            let body = '';
            if (payload.body && payload.body.data) {
                body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
            } else if (payload.parts) {
                const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
                if (textPart && textPart.body && textPart.body.data) {
                    body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
            }
            return body || payload.snippet || '';
        };

        // Helper to cleaning quoted text and strict legal footers
        const cleanBody = (text) => {
            let lines = text.split(/\r?\n/);
            const cleanLines = [];

            // patterns that typically start a footer block to ignore
            const footerTriggers = [
                /^Sent from my/i,
                /^Get Outlook for/i,
                /^Registered in/i,
                /^Company Number/i,
                /^Unsubscribe/i,
                /^Manage preferences/i,
                /^--\s*$/, // Standard signature dash
                /^__\s*$/,
                /^Beyond Vision Ltd/i, // Specific catch from user example
                /Limited is a company registered/i
            ];

            for (let line of lines) {
                const trimmed = line.trim();

                // standard quote removal
                if (trimmed.startsWith('>')) continue;
                if (line.includes('On ') && line.includes('wrote:')) continue;
                if (line.includes('From:') && line.includes('To:') && line.includes('Subject:')) continue; // Forwarded headers

                // check footer triggers - if hit, we might want to stop or skip
                // For now, let's skip the line. If it's a block, usually they cluster at the end.
                // A stronger heuristic: if we hit a "Registered in", stop everything? 
                // Let's just filter out the noisy lines for now to be safe.
                if (footerTriggers.some(regex => regex.test(trimmed))) {
                    console.log(`(Stripping footer line: ${trimmed.substring(0, 20)}...)`);
                    continue;
                }

                cleanLines.push(line);
            }
            return cleanLines.join('\n').trim();
        };

        // NEW: Data Extraction Helper
        const extractCreatorData = async (text, fromEmail) => {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: `You are a data extraction assistant. Analyze the email body.
                            Extract:
                            1. **PhoneNumber**: Any phone number provided (e.g. +44..., (555)...).
                            2. **Rate**: Any pricing or rate mentioned (e.g. "$500", "500 usd").
                            
                            Return valid JSON: { "phoneNumber": string | null, "rate": string | null }`
                        },
                        { role: "user", content: text }
                    ],
                    response_format: { type: "json_object" }
                });

                const data = JSON.parse(completion.choices[0].message.content);

                if (data.phoneNumber || data.rate) {
                    console.log(`[Extraction] Found Data for ${fromEmail}:`, data);

                    // Update Firestore
                    // 1. Find creator by email
                    const creatorsRef = db.collection('creators');
                    const q = await creatorsRef.where('email', '==', fromEmail).limit(1).get();

                    if (!q.empty) {
                        const docId = q.docs[0].id;
                        const updateData = {};
                        if (data.phoneNumber) updateData.phone_number = data.phoneNumber;
                        if (data.rate) updateData.rate = data.rate;

                        await creatorsRef.doc(docId).set(updateData, { merge: true });
                        console.log(`[Extraction] Updated creator ${docId} in DB.`);
                    } else {
                        console.log(`[Extraction] Creator email ${fromEmail} not found in DB, skipping save.`);
                    }
                }
            } catch (err) {
                console.error("[Extraction Error]", err.message);
            }
        };

        // Build Conversation History String
        let conversationLog = messages.map(m => {
            const mHeaders = m.payload.headers;
            const mFrom = mHeaders.find(h => h.name === 'From')?.value || 'Unknown';
            const mBody = getBody(m.payload);
            const clean = cleanBody(mBody); // Clean it up

            const isMe = mFrom.includes(botEmail) || mFrom.includes('Verality'); // simplified check
            const role = isMe ? "Verality AI (You)" : "Creator";
            return `${role}: ${clean.substring(0, 800)}`;
        }).join('\n---\n');

        console.log('Conversation History:\n', conversationLog);

        // TRIGGER EXTRACTOR (Side Effect)
        // We only extract from the LAST message (the new reply)
        const lastMsgBody = getBody(lastMsg.payload);
        const lastMsgClean = cleanBody(lastMsgBody);
        await extractCreatorData(lastMsgClean, lastFromEmail);


        let aiResponseText;
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are Cory, a Campaign Manager at Beyond Vision. You are negotiating with a Creator (or their manager).
                        
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
                           - Reply: "Thanks for sending those over! I'll be in touch soon regarding Sheglam and any other upcoming campaigns that would be a good fit for you. Best, Cory"

                        3. **THEY GAVE A RANGE / WRONG CURRENCY**
                           - Reply: "To move forward and get everything logged in our system, we do require a single flat rate for both Sound Promos and Brand Deals in USD. Could you clarify that for me?"

                        **STRICT RULES**:
                        - Sign off ONLY as "Best, Cory" or "Best, Cory Hodkinson".
                        - NEVER suggest a call or Zoom.
                        - Keep it human and brief.
                        `
                    },
                    {
                        role: "user",
                        content: `History:\n${conversationLog}\n\nTask: They replied. Draft a casual, human response.`
                    }
                ],
            });
            aiResponseText = completion.choices[0].message.content;
        } catch (openaiError) {
            console.error('OpenAI Error:', openaiError.message);
            aiResponseText = "Hi there,\n\nWe'd love to discuss this further. Are you available for a quick call?\n\nBest,\nVerality Team";
        }

        if (aiResponseText.trim() === "IGNORE") {
            console.log("AI decided to IGNORE this thread due to repeated refusals.");
            await gmail.users.messages.modify({
                userId: 'me',
                id: lastMsg.id,
                requestBody: { removeLabelIds: ['UNREAD'] }
            });
            continue; // Skip sending reply
        }

        // Send Reply
        console.log('Sending OpenAI Generated Reply...');

        const str = [
            `To: ${from}`,
            `Subject: Re: ${subject.replace(/^Re: /, '')}`,
            `In-Reply-To: ${details.data.id}`,
            `References: ${details.data.id}`,
            `Content-Type: text/plain; charset=utf-8`,
            `MIME-Version: 1.0`,
            ``,
            aiResponseText
        ].join('\n');

        const encodedMessage = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        try {
            await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedMessage,
                    threadId: threadId
                }
            });
            console.log('AI Reply SENT successfully.');

            // Mark as read
            await gmail.users.messages.modify({
                userId: 'me',
                id: lastMsg.id,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });
            console.log('Marked incoming message as READ.');

        } catch (e) {
            console.error('Failed to send reply:', e.message);
        }
    }

    console.log('\n--- PROCESSING COMPLETE ---');
}

processReplies().catch(console.error);
