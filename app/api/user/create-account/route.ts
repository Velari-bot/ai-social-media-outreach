import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/user/create-account
 * Create user account in Firestore
 */
export async function POST(request: NextRequest) {
  try {
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
    const { email, name } = body;

    // Check if account already exists
    const existingDoc = await db.collection('user_accounts').doc(userId).get();
    if (existingDoc.exists) {
      return NextResponse.json({
        success: true,
        account: existingDoc.data(),
      });
    }

    // Create new account
    const now = Timestamp.now();
    const quotaResetDate = new Date();
    quotaResetDate.setDate(quotaResetDate.getDate() + 1);

    const accountData = {
      email: email || decodedToken.email || '',
      name: name || '',
      plan: 'pro',
      email_quota_daily: 100,
      email_quota_monthly: 3000,
      email_used_today: 0,
      email_used_this_month: 0,
      quota_reset_date: Timestamp.fromDate(quotaResetDate),
      created_at: now,
      updated_at: now,
    };

    await db.collection('user_accounts').doc(userId).set(accountData);

    return NextResponse.json({
      success: true,
      account: accountData,
    });
  } catch (error: any) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

