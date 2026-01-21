import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyExtensionToken } from '@/lib/extension-auth';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        console.log('[API/me] Auth Header:', authHeader ? `Present (${authHeader.substring(0, 15)}...)` : 'MISSING');

        const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
        console.log('[API/me] Extracted Token:', token ? 'Success' : 'FAIL');

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized', details: 'No token provided' }, { status: 401 });
        }

        const payload = await verifyExtensionToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid or expired token', details: 'JWT verification failed' }, { status: 401 });
        }

        const { userId } = payload;

        // Fetch user account from Firestore
        const userDoc = await db.collection('user_accounts').doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        const credits = (userData?.email_quota_daily || 0) - (userData?.email_used_today || 0);

        return NextResponse.json({
            userId,
            email: payload.email,
            name: userData?.name || userData?.email?.split('@')[0],
            credits: Math.max(0, credits),
            dailyQuota: userData?.email_quota_daily || 0,
            plan: userData?.plan || 'free'
        });
    } catch (error) {
        console.error('Error fetching extension user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
