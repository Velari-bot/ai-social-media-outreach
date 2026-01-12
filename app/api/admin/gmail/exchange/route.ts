import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGmailProfile } from '@/lib/gmail-oauth';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, redirectUri } = body;

        if (!code || !redirectUri) {
            return NextResponse.json({ error: 'Missing code or redirectUri' }, { status: 400 });
        }

        // 1. Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code, redirectUri);

        // 2. Get User Profile to confirm email address
        const profile = await getGmailProfile(tokens.access_token);

        // 3. Store in Firestore (settings/email)
        // We store the refresh token specifically because that's what we need for long-term access
        await db.collection('settings').doc('email').set({
            provider: 'gmail',
            email: profile.emailAddress,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token, // CRITICAL: This allows us to get new access tokens indefinitely
            expiresIn: tokens.expires_in,
            lastUpdated: new Date().toISOString(),
            isActive: true
        });

        return NextResponse.json({
            success: true,
            email: profile.emailAddress
        });

    } catch (error: any) {
        console.error('Error exchanging Gmail tokens:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
