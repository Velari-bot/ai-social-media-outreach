import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get('email') || 'benderaiden826@gmail.com';

        let userId = req.nextUrl.searchParams.get('userId');

        // 1. Find User ID if not provided
        if (!userId) {
            const usersSnap = await db.collection('user_accounts').where('email', '==', email).limit(1).get();
            if (!usersSnap.empty) {
                userId = usersSnap.docs[0].id;
            } else {
                // Try users collection
                const uSnap = await db.collection('users').where('email', '==', email).limit(1).get();
                if (!uSnap.empty) userId = uSnap.docs[0].id;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'User not found' });
        }

        const report: any = { userId, email };

        // 2. Check Gmail Connection
        const connDoc = await db.collection('gmail_connections').doc(userId).get();
        if (!connDoc.exists) {
            report.connection = "MISSING Doc";
        } else {
            const data = connDoc.data() || {};
            report.connection = {
                hasEmail: !!data.email,
                email: data.email,
                hasRefreshToken: !!data.refresh_token,
                refreshTokenLength: data.refresh_token?.length,
                accountsCount: data.accounts?.length || 0,
                accounts: data.accounts || []
            };

            // Test Token Validity
            try {
                const clientId = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID;
                const clientSecret = process.env.GMAIL_CLIENT_SECRET;

                if (!clientId || !clientSecret) {
                    report.env = { error: "Missing Env Vars", hasId: !!clientId, hasSecret: !!clientSecret };
                } else {
                    const auth = new google.auth.OAuth2(clientId, clientSecret);
                    // Use the first available refresh token
                    const rToken = data.refresh_token || (data.accounts?.[0]?.refresh_token);

                    if (rToken) {
                        auth.setCredentials({ refresh_token: rToken });
                        const tokenInfo = await auth.getAccessToken();
                        report.tokenTest = { success: true, token: tokenInfo.token ? "Generated" : "Empty" };
                    } else {
                        report.tokenTest = { success: false, error: "No refresh token found" };
                    }
                }
            } catch (e: any) {
                report.tokenTest = { success: false, error: e.message };
            }
        }

        // 3. Check Queue Errors
        const queueSnap = await db.collection('outreach_queue')
            .where('user_id', '==', userId)
            // .where('status', 'in', ['failed', 'scheduled']) // 'in' query limitations sometimes
            .orderBy('updated_at', 'desc')
            .limit(10)
            .get();

        report.recentQueueItems = queueSnap.docs.map(d => {
            const dat = d.data();
            return {
                id: d.id,
                status: dat.status,
                creator: dat.creator_email,
                last_error: dat.last_error,
                scheduled: dat.scheduled_send_time?.toDate?.() || dat.scheduled_send_time,
                retry_count: dat.retry_count
            };
        });

        return NextResponse.json(report);

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
