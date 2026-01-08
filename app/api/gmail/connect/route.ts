import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';
import { exchangeCodeForTokens, getGmailProfile } from '@/lib/gmail-oauth';

/**
 * POST /api/gmail/connect
 * Connect Gmail account by exchanging OAuth code for tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing code or redirectUri' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Get Gmail profile to verify connection
    const profile = await getGmailProfile(tokens.access_token);

    // Store tokens in Firestore
    const gmailConnectionRef = db.collection('gmail_connections').doc(userId);
    await gmailConnectionRef.set({
      user_id: userId,
      email: profile.emailAddress,
      access_token: tokens.access_token, // In production, encrypt this
      refresh_token: tokens.refresh_token, // In production, encrypt this
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      connected_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      email: profile.emailAddress,
    });
  } catch (error: any) {
    console.error('Error connecting Gmail:', error);
    // Log additional details if available
    if (error.code) console.error('Error code:', error.code);
    if (error.stack) console.error('Error stack:', error.stack);

    return NextResponse.json(
      { error: error.message || 'Failed to connect Gmail', details: error.code },
      { status: 500 }
    );
  }
}

