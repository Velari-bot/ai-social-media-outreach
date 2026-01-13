import { NextRequest, NextResponse } from 'next/server';
import { getUserAccount } from '@/lib/database';
import { auth } from '@/lib/firebase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/account
 * Get current user's account data
 */
export async function GET(request: NextRequest) {
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

    if (!auth) {
      console.error('Firebase Auth not initialized. Check server logs for credential issues.');
      return NextResponse.json(
        { error: 'Server authentication service unavailable' },
        { status: 503 }
      );
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const account = await getUserAccount(userId);


    // Admin Override: If account missing but email matches, return mock enterprise
    if (!account && decodedToken.email === 'benderaiden826@gmail.com') {
      const now = new Date().toISOString();
      return NextResponse.json({
        success: true,
        account: {
          id: userId,
          email: decodedToken.email,
          name: decodedToken.name || 'Admin',
          plan: 'enterprise',
          email_quota_daily: 10000,
          email_quota_monthly: 300000,
          email_used_today: 0,
          email_used_this_month: 0,
          quota_reset_date: now,
          created_at: now,
          updated_at: now
        }
      });
    }

    // --- Auto-Create (Lazy Creation) if missing ---
    if (!account) {
      console.log(`[UserAccount] Account not found for ${userId}, creating new one...`);
      const { db } = await import('@/lib/firebase-admin');
      const { Timestamp } = await import('firebase-admin/firestore');

      const now = Timestamp.now();
      const quotaResetDate = new Date();
      quotaResetDate.setDate(quotaResetDate.getDate() + 1);

      const newAccountData = {
        email: decodedToken.email || '',
        name: decodedToken.name || '',
        plan: 'pro', // Default plan
        email_quota_daily: 100,
        email_quota_monthly: 3000,
        email_used_today: 0,
        email_used_this_month: 0,
        quota_reset_date: Timestamp.fromDate(quotaResetDate),
        created_at: now,
        updated_at: now,
      };

      await db.collection('user_accounts').doc(userId).set(newAccountData);

      // Return the new account (formatting timestamps to string if needed to match getUserAccount return type)
      return NextResponse.json({
        success: true,
        account: {
          id: userId,
          ...newAccountData,
          created_at: now.toDate().toISOString(),
          updated_at: now.toDate().toISOString(),
          quota_reset_date: quotaResetDate.toISOString(),
        }
      });
    }

    // Normal return if found
    return NextResponse.json({
      success: true,
      account,
    });
  } catch (error: any) {
    console.error('Error fetching user account:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

