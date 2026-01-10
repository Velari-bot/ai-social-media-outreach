
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
    let snapshot = await usersRef.where('email', '==', targetEmail).limit(1).get();
    if (snapshot.empty) {
        snapshot = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
    }
    if (snapshot.empty) {
        console.error('User not found!');
        return;
    }
    const userId = snapshot.docs[0].id;
    console.log(`User ID: ${userId}`);

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

        // Helper to clean quoted text for AI context (reduces noise)
        const cleanBody = (text) => {
            return text
                .split(/\r?\n/)
                .filter(line => !line.trim().startsWith('>')) // Remove quotes
                .filter(line => !line.includes('On ') && !line.includes('wrote:')) // Remove headers
                .join('\n')
                .trim();
        };

        // Build Conversation History String
        let conversationLog = messages.map(m => {
            const mHeaders = m.payload.headers;
            const mFrom = mHeaders.find(h => h.name === 'From')?.value || 'Unknown';
            const mBody = getBody(m.payload);
            const clean = cleanBody(mBody); // Clean it up

            const isMe = mFrom.includes('benderaiden826@gmail.com');
            const role = isMe ? "Verality AI (You)" : "Creator";
            return `${role}: ${clean.substring(0, 500)}`; // limit length
        }).join('\n---\n');

        console.log('Conversation History:\n', conversationLog);

        let aiResponseText;
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You reach out to creators for sponsorships.
                        
                        TONE:
                        - Professional but casual. Think "Founder reaching out", not "Corporate sales bot".
                        - Be polite, respectful, and clear.
                        - Use standard punctuation where appropriate, but keep it brief.
                        - Avoid excessive fluff like "I hope this email finds you well", but don't be rude.
                        - Example: "Hey [Name], thanks for getting back to me. We're big fans of your content and would love to discuss a paid collaboration."

                        GOAL:
                        - If they say "Sure", "Yes", or ask nicely -> Get their **rates** or **phone number** directly in this email.
                        - Do NOT send any external links (no Calendly). Keep the conversation right here.
                        - "Great! What are your rates for a dedicated video? And what's your best number to text?"

                        REFUSALS:
                        - Only return "IGNORE" if they say "Stop", "Unsubscribe", "Not interested", or "No" CLEARLY 2+ times.
                        - "Sure" is a YES. "Okay" is a YES.

                        Sign off: "Best, Verality Team" or just "Verality Team"`
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
