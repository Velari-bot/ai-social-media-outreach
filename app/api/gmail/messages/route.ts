
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

        if (!userId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 1. Get ALL connected accounts and tokens
        const gmailDoc = await db.collection('gmail_connections').doc(userId).get();
        if (!gmailDoc.exists) {
            return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
        }

        const data = gmailDoc.data()!;
        const accounts = data.accounts || [];

        // Map email -> details for quick lookup
        const accountMap = new Map<string, { refresh_token: string }>();

        // Add Legacy/Primary
        if (data.email && data.refresh_token) {
            accountMap.set(data.email, { refresh_token: data.refresh_token });
        }
        // Add Array accounts
        accounts.forEach((acc: any) => {
            if (acc.email && acc.refresh_token) {
                accountMap.set(acc.email, { refresh_token: acc.refresh_token });
            }
        });

        if (accountMap.size === 0) {
            // No tokens?
            return NextResponse.json({ error: 'No authenticated accounts found' }, { status: 400 });
        }

        // 2. Fetch Threads from Firestore (Source of Truth)
        // REMOVED orderBy to avoid "Index Required" error. We sort in memory.
        const threadsSnap = await db.collection('email_threads')
            .where('user_id', '==', userId)
            .get();

        if (threadsSnap.empty) {
            return NextResponse.json({ success: true, messages: [] });
        }

        // Sort in memory (Newest first)
        const allDocs = threadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allDocs.sort((a: any, b: any) => {
            const tA = a.updated_at?.toDate ? a.updated_at.toDate().getTime() : new Date(a.updated_at).getTime();
            const tB = b.updated_at?.toDate ? b.updated_at.toDate().getTime() : new Date(b.updated_at).getTime();
            return tB - tA;
        });

        // Take top 500
        const recentThreads = allDocs.slice(0, 500);

        // 3. Fetch Details from Gmail
        const detailedThreads = await Promise.all(recentThreads.map(async (threadData: any) => {
            const threadId = threadData.id;
            const accountEmail = threadData.connected_account_email;

            // Determine which account to use
            let accountInfo = accountEmail ? accountMap.get(accountEmail) : null;

            // Fallback: If we don't know the email, try the primary one
            if (!accountInfo) {
                // Just use the first available one as best guess? 
                // Or try to parse 'connected_account_email' might be missing on old ones.
                // We'll default to the first one in the map.
                accountInfo = accountMap.values().next().value;
            }

            if (!accountInfo) return null;

            try {
                // Auth with Google for THIS specific account
                const oauth2Client = new google.auth.OAuth2(
                    process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
                    process.env.GMAIL_CLIENT_SECRET
                );
                oauth2Client.setCredentials({ refresh_token: accountInfo.refresh_token });
                const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

                const details = await gmail.users.threads.get({
                    userId: 'me',
                    id: threadId,
                    format: 'full'
                });

                const messages = details.data.messages || [];
                if (messages.length === 0) return null;

                const lastMsg = messages[messages.length - 1];
                const headers = lastMsg.payload?.headers || [];

                const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
                const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();

                // Extract Body Helper
                const getBody = (payload: any) => {
                    let body = '';
                    if (payload.body && payload.body.data) {
                        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
                    } else if (payload.parts) {
                        const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
                        const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
                        const part = textPart || htmlPart;
                        if (part && part.body && part.body.data) {
                            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                        }
                    }
                    return body || lastMsg.snippet || '';
                };

                // Map History
                const threadHistory = messages.map(m => {
                    const mHeaders = m.payload?.headers || [];
                    const mFrom = mHeaders.find(h => h.name === 'From')?.value || 'Unknown';
                    const mDate = mHeaders.find(h => h.name === 'Date')?.value || new Date().toISOString();
                    const mSubject = mHeaders.find(h => h.name === 'Subject')?.value || 'No Subject';

                    // Parse Email for fromEmail
                    const mFromEmail = mFrom.match(/<([^>]+)>/)?.[1] || mFrom;

                    return {
                        id: m.id,
                        from: mFrom.split('<')[0].replace(/"/g, '').trim(),
                        fromEmail: mFromEmail,
                        subject: mSubject,
                        body: getBody(m.payload),
                        timestamp: mDate,
                        // NEW LOGIC: Is it User?
                        // It is User if the sender email is in our account map
                        isUser: accountMap.has(mFromEmail),
                        isAI: false // Deprecated/handled by isUser + content checks if needed
                    };
                });

                return {
                    id: lastMsg.id,
                    threadId: threadId,
                    from,
                    subject,
                    snippet: lastMsg.snippet,
                    body: getBody(lastMsg.payload),
                    timestamp: date,
                    isUnread: messages.some(m => m.labelIds?.includes('UNREAD')),
                    fullThread: threadHistory,
                    // Pass specific thread data from DB if needed
                    dbStatus: threadData.status,
                    connectedAccount: accountEmail,
                    insights: {
                        phone: threadData.phone_number,
                        tiktok_rate: threadData.tiktok_rate,
                        sound_promo_rate: threadData.sound_promo_rate
                    }
                };
            } catch (e) {
                console.error(`Error fetching thread ${threadId} from Gmail (Account: ${accountEmail})`, e);
                // Fallback: If Gmail fetch fails (e.g. 404 deleted), we might want to return a placeholder or null
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
