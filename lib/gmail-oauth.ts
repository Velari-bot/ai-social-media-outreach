/**
 * Gmail OAuth integration
 * Uses Google OAuth 2.0 to connect user's Gmail account
 */

const GMAIL_API_KEY = process.env.NEXT_PUBLIC_GMAIL_API_KEY || '';
const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '';

// Gmail API scopes
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

/**
 * Get Gmail OAuth URL
 */
export function getGmailOAuthUrl(redirectUri: string): string {
  if (!GMAIL_CLIENT_ID) {
    throw new Error('Gmail Client ID is not configured. Please set NEXT_PUBLIC_GMAIL_CLIENT_ID in your .env.local file. See GMAIL_SETUP.md for instructions.');
  }

  const params = new URLSearchParams({
    client_id: GMAIL_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  // Debug logging for credentials
  console.log("OAuth Debug - Client ID:", GMAIL_CLIENT_ID ? `${GMAIL_CLIENT_ID.substring(0, 15)}...` : "Missing");
  console.log("OAuth Debug - Redirect URI:", redirectUri);
  console.log("OAuth Debug - Client Secret:", clientSecret ? `Present (Length: ${clientSecret.length}, Starts with: ${clientSecret.substring(0, 3)}...)` : "Missing");

  if (!clientSecret) {
    console.error("GMAIL_CLIENT_SECRET is missing from environment variables");
    throw new Error("Server configuration error: GMAIL_CLIENT_SECRET is missing");
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GMAIL_CLIENT_ID,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Google Token Exchange Error:", error);
    throw new Error(error.error_description || error.error || 'Failed to exchange code for tokens');
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh access token');
  }

  return response.json();
}

/**
 * Get user's Google Profile (Email)
 * Uses the OIDC userinfo endpoint which works with the 'userinfo.email' scope
 */
export async function getGmailProfile(accessToken: string): Promise<{
  emailAddress: string;
  picture?: string;
}> {
  // We use the userinfo endpoint because it only requires the userinfo.email scope.
  // The Gmail profile endpoint requires gmail.readonly which is too intrusive for just sending.
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch user profile:", errorText);
    throw new Error(`Failed to fetch Google profile: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    emailAddress: data.email,
    picture: data.picture
  };
}

