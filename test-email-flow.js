
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

// --- 3. Run Test Flow ---
async function runTestFlow() {
    const targetEmail = 'benderaiden826@gmail.com'; // Sender
    const creatorEmail = 'jlbender2005@gmail.com'; // Receiver (Creator)

    console.log(`\n--- STARTING EMAIL TEST FLOW ---`);
    console.log(`Sender: ${targetEmail}`);
    console.log(`Recipient: ${creatorEmail}`);

    // A. Get User ID
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

    // B. Get Gmail Tokens
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    if (!connDoc.exists) {
        console.error('No Gmail connection found.');
        return;
    }
    const tokens = connDoc.data();
    console.log('Found Gmail tokens.');

    // C. Setup OAuth Client
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        "http://localhost:3000/onboarding" // Redirect URI (doesn't matter for refresh)
    );

    oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token
    });

    // D. Refresh Token (implicit in getAccessToken)
    const { token: accessToken } = await oauth2Client.getAccessToken();
    console.log('Access Token Refreshed.');

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // E. Prepare Email (AI Template Simulation)
    console.log('Generating AI Email Content...');
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let body;
    let subject = "Collaboration Opportunity: Verality AI Campaign";

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are Cory, a Campaign Manager at Beyond Vision. You are reaching out to creators.
                
                **YOUR STYLE (Exact Template to Model)**:
                "Hi [Name], Cory here with Beyond Vision! Hope you're doing well - I'm just getting in touch as we have some available budget with our client, Sheglam for November/December.
                
                We'd love to get you involved on the campaign as soon as possible, please let me know your rate for 1x TikTok post?
                
                If you're not interested in this deal, we work with a bunch of other brands so send over your pricing anyway and we can send over some other campaigns.
                
                Best,
                Cory"`
                },
                { role: "user", content: `Draft an invite for ${creatorEmail}` }
            ]
        });
        body = completion.choices[0].message.content;
    } catch (e) {
        console.error("AI Gen Failed, using backup", e);
        body = `Hi there,\n\nWe love your content and want to sponsor you. Are you open to a call?\n\nBest,\nVerality Team`;
    }

    console.log("Drafted Body:\n", body);


    // Ensure Label Exists
    console.log("Ensuring 'VERALITY_AI' label exists...");
    const labelName = 'VERALITY_AI';
    let labelId;
    try {
        const labelsRes = await gmail.users.labels.list({ userId: 'me' });
        const existing = labelsRes.data.labels.find(l => l.name === labelName);
        if (existing) {
            labelId = existing.id;
        } else {
            console.log(`Creating label: ${labelName}`);
            const createRes = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show'
                }
            });
            labelId = createRes.data.id;
        }
    } catch (e) {
        console.error('Error handling labels:', e.message);
    }
    console.log(`Using Label ID: ${labelId}`);


    // Encode email
    const str = [
        `To: ${creatorEmail}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        `MIME-Version: 1.0`,
        ``,
        body
    ].join('\n');

    const encodedMessage = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // F. Send Email
    console.log(`Sending email to ${creatorEmail}...`);
    try {
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });
        console.log(`Email Sent! ID: ${res.data.id}`);
        console.log(`Thread ID: ${res.data.threadId}`);

        // G. Apply Label
        if (labelId) {
            console.log(`Applying label ${labelName} to thread...`);
            await gmail.users.messages.modify({
                userId: 'me',
                id: res.data.id,
                requestBody: {
                    addLabelIds: [labelId]
                }
            });
            console.log('Label applied.');
        }

    } catch (e) {
        console.error('Error sending email:', e.message);
        return;
    }

    // Also apply label to current thread? No, the modifier above does it.

    console.log(`\n--- CHECK: Please verify the inbox of ${creatorEmail} ---`);
    console.log(`You should verify that a reply to this email appears in the Dashboard Inbox later.`);
}

runTestFlow().catch(console.error);
