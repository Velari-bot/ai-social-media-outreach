/**
 * Client-side API helper functions
 * These functions call API routes which use Firebase Admin SDK server-side
 */

/**
 * Get Firebase Auth ID token for API requests
 */
async function getIdToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    const { auth } = await import('./firebase');
    if (!auth?.currentUser) return null;

    return auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getIdToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get user account
 */
export async function fetchUserAccount() {
  return apiRequest<{ success: boolean; account: any }>('/api/user/account');
}

/**
 * Get user stats
 */
export async function fetchUserStats() {
  return apiRequest<{ success: boolean; stats: any }>('/api/user/stats');
}

/**
 * Get recent requests
 */
export async function fetchRecentRequests(limit: number = 10) {
  return apiRequest<{ success: boolean; requests: any[] }>(`/api/user/requests?limit=${limit}`);
}

/**
 * Create creator request
 */
export async function createRequest(data: {
  name: string;
  platforms: string[];
  criteria: Record<string, any>;
}) {
  return apiRequest<{ success: boolean; request: any; creators?: any[]; meta?: any }>('/api/user/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Increment email quota
 */
export async function incrementQuota() {
  return apiRequest<{ success: boolean }>('/api/user/quota', {
    method: 'POST',
  });
}

/**
 * Create user account
 */
export async function createUserAccount(data: {
  email: string;
  name?: string;
}) {
  return apiRequest<{ success: boolean; account: any }>('/api/user/create-account', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update user account
 */
export async function updateUserAccount(updates: {
  purpose?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  outreach_intent?: string;
}): Promise<{ success: boolean; account?: any; error?: string }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/user/update-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  return response.json();
}

/**
 * Get Gmail OAuth URL
 */
export async function getGmailOAuthUrl(): Promise<{ success: boolean; url?: string; error?: string }> {
  const redirectUri = `${window.location.origin}/api/gmail/callback`;
  const response = await fetch(`/api/gmail/oauth-url?redirectUri=${encodeURIComponent(redirectUri)}`);
  return response.json();
}

/**
 * Connect Gmail account
 */
export async function connectGmail(code: string, redirectUri: string): Promise<{ success: boolean; email?: string; error?: string }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/gmail/connect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ code, redirectUri }),
  });
  return response.json();
}

/**
 * Get Gmail connection status
 */
export async function getGmailStatus(): Promise<{ success: boolean; connected?: boolean; email?: string; lastSync?: string; error?: string }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/gmail/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

/**
 * Disconnect Gmail account
 */
export async function disconnectGmail(): Promise<{ success: boolean; error?: string }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/gmail/disconnect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

/**
 * Get affiliate account
 */
export async function fetchAffiliateAccount() {
  return apiRequest<{ success: boolean; account: any }>('/api/affiliates/account');
}

/**
 * Create affiliate account
 */
export async function createAffiliateAccountApi(email: string) {
  return apiRequest<{ success: boolean; account: any }>('/api/affiliates/account', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
