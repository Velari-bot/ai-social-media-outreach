import { NextRequest, NextResponse } from 'next/server';
import { getGmailOAuthUrl } from '@/lib/gmail-oauth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/gmail/oauth-url
 * Get Gmail OAuth URL for initiating connection
 */
export async function GET(request: NextRequest) {
  try {
    const redirectUri = request.nextUrl.searchParams.get('redirectUri');

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'Missing redirectUri parameter' },
        { status: 400 }
      );
    }

    // Generate secure state to prevent CSRF
    const state = crypto.randomUUID();

    const url = getGmailOAuthUrl(redirectUri, state);

    // Set state in cookie
    const response = NextResponse.json({
      success: true,
      url,
    });

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error generating Gmail OAuth URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}

