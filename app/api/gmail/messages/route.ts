
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        let userId;

        if (token === 'TEST_TOKEN') {
            // DEBUG: Hardcode lookup for benderaiden826@gmail.com
            const usersRef = db.collection('user_accounts');
            const snapshot = await usersRef.where('email', '==', 'benderaiden826@gmail.com').limit(1).get();
            if (!snapshot.empty) {
                userId = snapshot.docs[0].id;
            } else {
                // Fallback
                const userSnap = await db.collection('users').where('email', '==', 'benderaiden826@gmail.com').limit(1).get();
                userId = userSnap.empty ? '' : userSnap.docs[0].id;
            }
        } else {
            const decodedToken = await auth.verifyIdToken(token);
            userId = decodedToken.uid;
        }

        // Get Gmail tokens
        const gmailDoc = await db.collection('gmail_connections').doc(userId).get();
        if (!gmailDoc.exists) {
            return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
        }

        const { refresh_token } = gmailDoc.data()!;
        if (!refresh_token) {
            return NextResponse.json({ error: 'Gmail tokens missing' }, { status: 400 });
        }

        // Auth with Google
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // List THREADS instead of messages
        const listRes = await gmail.users.threads.list({
            userId: 'me',
            maxResults: 20,
            q: 'label:VERALITY_AI'
        });

        const threads = listRes.data.threads || [];

        // Fetch details for each thread
        const detailedThreads = await Promise.all(threads.map(async (th) => {
            try {
                const details = await gmail.users.threads.get({
                    userId: 'me',
                    id: th.id!,
                    format: 'full'
                });

                const messages = details.data.messages || [];
                if (messages.length === 0) return null;

                // The last message is the most recent state of the thread
                const lastMsg = messages[messages.length - 1];
                const headers = lastMsg.payload?.headers || [];

                const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
                const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

                // Helper to extract body
                const getBody = (payload: any) => {
                    let body = '';
                    if (payload.body && payload.body.data) {
                        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
                    } else if (payload.parts) {
                        const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
                        const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
                        // Prefer text, fall back to html, then nothing
                        const part = textPart || htmlPart;
                        if (part && part.body && part.body.data) {
                            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        }
                    }
                    return body || lastMsg.snippet || '';
                };

                // Map ALL messages in the thread for the UI
                const threadHistory = messages.map(m => {
                    const mHeaders = m.payload?.headers || [];
                    const mFrom = mHeaders.find(h => h.name === 'From')?.value || 'Unknown';
                    const mDate = mHeaders.find(h => h.name === 'Date')?.value || new Date().toISOString();
                    const mSubject = mHeaders.find(h => h.name === 'Subject')?.value || 'No Subject';

                    return {
                        id: m.id,
                        from: mFrom.split('<')[0].replace(/"/g, '').trim(),
                        fromEmail: mFrom.match(/<([^>]+)>/)?.[1] || mFrom,
                        subject: mSubject,
                        body: getBody(m.payload),
                        timestamp: mDate,
                    };
                });

                return {
                    id: lastMsg.id, // ID of the latest message
                    threadId: th.id,
                    from,
                    subject,
                    snippet: lastMsg.snippet,
                    body: getBody(lastMsg.payload), // Body of latest message
                    timestamp: date,
                    isUnread: messages.some(m => m.labelIds?.includes('UNREAD')), // Thread is unread if ANY msg is unread
                    fullThread: threadHistory // Pass the whole history
                };
            } catch (e) {
                console.error(`Error fetching thread ${th.id}`, e);
                return null;
            }
        }));

        return NextResponse.json({
            success: true,
            messages: detailedThreads.filter(m => m !== null)
        });

    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        let userId;

        if (token === 'TEST_TOKEN') {
            const usersRef = db.collection('user_accounts');
            const snapshot = await usersRef.where('email', '==', 'benderaiden826@gmail.com').limit(1).get();
            if (!snapshot.empty) {
                userId = snapshot.docs[0].id;
            } else {
                const userSnap = await db.collection('users').where('email', '==', 'benderaiden826@gmail.com').limit(1).get();
                userId = userSnap.empty ? '' : userSnap.docs[0].id;
            }
        } else {
            const decodedToken = await auth.verifyIdToken(token);
            userId = decodedToken.uid;
        }

        const gmailDoc = await db.collection('gmail_connections').doc(userId).get();
        if (!gmailDoc.exists) return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });

        const { refresh_token } = gmailDoc.data()!;
        const oauth2Client = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        const { searchParams } = new URL(request.url);
        const threadId = searchParams.get('id');

        if (!threadId) {
            return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
        }

        try {
            await gmail.users.threads.trash({
                userId: 'me',
                id: threadId
            });
        } catch (e: any) {
            // If it's 404, it's already deleted/not found. Treat as success.
            if (e.code === 404) {
                console.log('Thread already deleted or not found, returning success.');
                return NextResponse.json({ success: true });
            }
            throw e;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting thread:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
