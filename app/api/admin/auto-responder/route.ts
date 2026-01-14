
import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { google } from 'googleapis';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const { action, targetEmail } = payload;

        if (action === 'process') {
            const { skipDelay } = payload;
            const result = await processAllThreads(targetEmail || 'benderaiden826@gmail.com', skipDelay);
            return NextResponse.json({ success: true, ...result });
        }

        if (action === 'simulate') {
            const { creatorEmail } = payload;
            const result = await simulateOutreach(targetEmail || 'benderaiden826@gmail.com', creatorEmail || 'jlbender2005@gmail.com');
            return NextResponse.json({ success: true, ...result });
        }

        if (action === 'reset') {
            const result = await resetLabelStatus(targetEmail || 'benderaiden826@gmail.com');
            return NextResponse.json({ success: true, ...result });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Auto-responder error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function processAllThreads(targetEmail: string, skipDelay: boolean = false) {
    console.log(`[Auto-Responder] Processing threads for ${targetEmail}`);

    // 1. User Lookup
    const usersRef = db.collection('user_accounts');
    let snapshot = await usersRef.where('email', '==', targetEmail).limit(1).get();
    if (snapshot.empty) {
        snapshot = await db.collection('users').where('email', '==', targetEmail).limit(1).get();
    }
    if (snapshot.empty) return { processed: 0, error: 'User not found' };

    const userId = snapshot.docs[0].id;

    // 2. Get Tokens
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    const connData = connDoc.data();
    if (!connDoc.exists || !connData) return { processed: 0, error: 'No Gmail connection' };
    const { refresh_token } = connData;

    // 3. Setup Gmail Client
    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 4. List Threads with Label
    const listRes = await gmail.users.threads.list({
        userId: 'me',
        q: 'label:VERALITY_AI',
        maxResults: 20
    });

    const threads = listRes.data.threads || [];
    let processedCount = 0;
    let repliedCount = 0;
    let pendingCount = 0;

    for (const th of threads) {
        try {
            const threadDetails = await gmail.users.threads.get({ userId: 'me', id: th.id! });
            const messages = threadDetails.data.messages || [];
            if (messages.length === 0) continue;

            // Check if AI is paused for this thread
            const settingsDoc = await db.collection('thread_settings').doc(th.id!).get();
            const threadStatus = settingsDoc.data()?.status;
            if (threadStatus === 'paused') continue;

            const lastMsg = messages[messages.length - 1];
            const headers = lastMsg.payload?.headers || [];
            const lastFrom = headers.find(h => h.name === 'From')?.value || '';
            const lastFromEmail = lastFrom.match(/<([^>]+)>/)?.[1] || lastFrom;
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';

            // Don't reply if the last message is from US
            if (lastFromEmail.includes(targetEmail)) continue;

            processedCount++;

            // Build History
            // 5. Randomize Response Time (Human behavior)
            // Check if last message is at least X minutes old to avoid "instant" bot replies
            const lastMsgInternalDate = parseInt(lastMsg.internalDate || '0');
            const nowTime = Date.now();
            const elapsedMinutes = (nowTime - lastMsgInternalDate) / (1000 * 60);

            // Deterministic delay (5-15 mins) based on message ID
            // This ensures the delay doesn't keep changing on every poll
            let randomDelay = 0;
            if (!skipDelay) {
                const seed = (lastMsg.id || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                randomDelay = (seed % 11) + 5; // 5 to 15 minutes
            }

            if (elapsedMinutes < randomDelay) {
                console.log(`[Auto-Responder] Skipping thread ${th.id} - too soon (elapsed: ${elapsedMinutes.toFixed(1)}m, delay: ${randomDelay}m)`);
                pendingCount++;
                continue;
            }

            // 6. User Personalization (Fetch Name)
            const userProfile = snapshot.docs[0].data();
            const userName = userProfile.first_name || userProfile.name || 'Outreach Manager';

            // 7. Build History
            const conversationLog = messages.slice(-5).map(m => {
                const mHeaders = m.payload?.headers || [];
                const mFrom = mHeaders.find(h => h.name === 'From')?.value || 'Unknown';
                const isMe = mFrom.includes(targetEmail);
                const role = isMe ? `${userName} (You)` : "Creator";
                return `${role}: ${m.snippet?.substring(0, 200)}`;
            }).join('\n---\n');

            // 8. Generate AI Response
            if (!openai) {
                throw new Error('OpenAI API key not configured');
            }
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

                        **SIGN OFF**:
                        Sign off ONLY as "Best, Cory" or "Best, Cory Hodkinson".
                        
                        **RULES**:
                        1. Always be polite and direct.
                        2. NEVER suggest a call or Zoom.
                        3. Confirm the rate per video or ask for it if not known.
                        
                        If they seem uninterested 2+ times, reply "IGNORE".`
                    },
                    {
                        role: "user",
                        content: `Conversation History:\n${conversationLog}\n\nDraft a brief reply to the Creator.`
                    }
                ],
            });

            const aiText = completion.choices[0].message.content || '';

            if (aiText.trim() === 'IGNORE') {
                // Mark as read and skip
                await gmail.users.messages.modify({
                    userId: 'me',
                    id: lastMsg.id!,
                    requestBody: { removeLabelIds: ['UNREAD'] }
                });
                continue;
            }

            // Send Reply
            const raw = Buffer.from(
                [
                    `To: ${lastFrom}`,
                    `Subject: Re: ${subject.replace(/^Re: /, '')}`,
                    `In-Reply-To: ${lastMsg.id}`,
                    `References: ${lastMsg.id}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `MIME-Version: 1.0`,
                    ``,
                    aiText
                ].join('\n')
            ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw, threadId: th.id }
            });

            // Mark incoming as read
            await gmail.users.messages.modify({
                userId: 'me',
                id: lastMsg.id!,
                requestBody: { removeLabelIds: ['UNREAD'] }
            });

            repliedCount++;
            console.log(`[Auto-Responder] Replied to ${lastFrom} in thread ${th.id}`);

        } catch (err: any) {
            console.error(`Error processing thread ${th.id}:`, err.message);
        }
    }

    return { threadsChecked: threads.length, processed: processedCount, replied: repliedCount, pending: pendingCount };
}

async function simulateOutreach(targetEmail: string, creatorEmail: string) {
    // Lookup User
    const usersRef = db.collection('user_accounts');
    let snapshot = await usersRef.where('email', '==', targetEmail).limit(1).get();
    if (snapshot.empty) return { error: 'User not found' };
    const userId = snapshot.docs[0].id;

    // Get Tokens
    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    const connData = connDoc.data();
    if (!connDoc.exists || !connData) return { error: 'No Gmail connection' };
    const { refresh_token } = connData;

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // AI Generation
    const userProfile = snapshot.docs[0].data();
    const userName = userProfile.first_name || userProfile.name || 'Outreach Manager';

    if (!openai) {
        throw new Error('OpenAI API key not configured');
    }
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
                Cory"

                **Instructions**:
                1. Adapt the above template for the creator.
                2. If name is unknown, use "Hi there".
                3. Keep it brief and personalized.
                4. Sign off ONLY as "Best, Cory" or "Best, Cory Hodkinson".`
            },
            { role: "user", content: `Draft an invite for ${creatorEmail}` }
        ]
    });
    const body = completion.choices[0].message.content || '';

    // Label Management
    const labelName = 'VERALITY_AI';
    let labelId;
    const labelsRes = await gmail.users.labels.list({ userId: 'me' });
    const existing = labelsRes.data.labels?.find(l => l.name === labelName);
    if (existing) {
        labelId = existing.id;
    } else {
        const createRes = await gmail.users.labels.create({
            userId: 'me',
            requestBody: { name: labelName, labelListVisibility: 'labelShow', messageListVisibility: 'show' }
        });
        labelId = createRes.data.id;
    }

    // Send
    const raw = Buffer.from(
        [
            `To: ${creatorEmail}`,
            `Subject: Partnership Opportunity`,
            `Content-Type: text/plain; charset=utf-8`,
            ``,
            body
        ].join('\n')
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
    });

    // Apply Label
    if (labelId && res.data.id) {
        await gmail.users.messages.modify({
            userId: 'me',
            id: res.data.id,
            requestBody: { addLabelIds: [labelId] }
        });
    }

    return { sent: true, messageId: res.data.id, threadId: res.data.threadId };
}

async function resetLabelStatus(targetEmail: string) {
    const usersRef = db.collection('user_accounts');
    let snapshot = await usersRef.where('email', '==', targetEmail).limit(1).get();
    if (snapshot.empty) return { error: 'User not found' };
    const userId = snapshot.docs[0].id;

    const connDoc = await db.collection('gmail_connections').doc(userId).get();
    const connData = connDoc.data();
    if (!connDoc.exists || !connData) return { error: 'No Gmail connection' };
    const { refresh_token } = connData;

    const oauth2Client = new google.auth.OAuth2(
        process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'label:VERALITY_AI',
        maxResults: 50
    });

    const messages = listRes.data.messages || [];
    for (const msg of messages) {
        await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id!,
            requestBody: { addLabelIds: ['UNREAD'] }
        });
    }

    return { reset: messages.length };
}
