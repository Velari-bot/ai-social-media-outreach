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
    const existingDoc = await gmailConnectionRef.get();

    let accounts: any[] = [];

    if (existingDoc.exists) {
      const data = existingDoc.data() || {};
      if (Array.isArray(data.accounts)) {
        accounts = [...data.accounts];
      } else if (data.email) {
        // Migration: Move legacy single account to array
        accounts.push({
          email: data.email,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          connected_at: data.connected_at,
          last_sync: data.last_sync,
          daily_limit: 50, // Default for migrated
          sent_today: 0
        });
      }
    }

    // Check if account already exists
    const existingIndex = accounts.findIndex(a => a.email === profile.emailAddress);

    const newAccountData = {
      email: profile.emailAddress,
      access_token: tokens.access_token,
      // IMPORTANT: Google only returns refresh_token on the first consent.
      // If `tokens.refresh_token` is undefined, keep the old one if it exists!
      refresh_token: tokens.refresh_token || (existingIndex >= 0 ? accounts[existingIndex].refresh_token : undefined),
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      connected_at: new Date().toISOString(),
      last_sync: new Date().toISOString(),
      // Preserve limits if updating, else default
      daily_limit: existingIndex >= 0 ? (accounts[existingIndex].daily_limit || 50) : 50,
      sent_today: existingIndex >= 0 ? (accounts[existingIndex].sent_today || 0) : 0
    };

    if (existingIndex >= 0) {
      // Update existing
      accounts[existingIndex] = newAccountData;
    } else {
      // Add new
      accounts.push(newAccountData);
    }

    await gmailConnectionRef.set({
      user_id: userId,
      accounts: accounts,
      // Keep legacy fields for a moment if other systems break, or just remove them? 
      // Let's keep the *latest* one as legacy fallback for safety, but primary source is 'accounts'
      email: profile.emailAddress,
      access_token: tokens.access_token,
      // Same logic for legacy field fallback
      refresh_token: tokens.refresh_token || (existingDoc.exists ? (existingDoc.data()?.refresh_token) : undefined),
      last_sync: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      email: profile.emailAddress,
      accounts: accounts.map(a => ({ email: a.email, connected: true }))
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

