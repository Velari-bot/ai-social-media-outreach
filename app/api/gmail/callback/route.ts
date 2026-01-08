import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * GET /api/gmail/callback
 * Handle Gmail OAuth callback
 * This route receives the OAuth callback from Google and redirects to onboarding
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');
  const state = request.nextUrl.searchParams.get('state');

  if (error) {
    // User denied access or error occurred
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/onboarding?error=missing_code', request.url));
  }

  // Redirect back to onboarding with code so it can be processed
  return NextResponse.redirect(new URL(`/onboarding?code=${code}`, request.url));
}

