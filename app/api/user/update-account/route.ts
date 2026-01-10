import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

/**
 * POST /api/user/update-account
 * Update user account data
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
    const updates: any = {};

    // Only allow specific fields to be updated
    if (body.purpose !== undefined) updates.purpose = body.purpose;
    if (body.name !== undefined) updates.name = body.name;
    if (body.first_name !== undefined) updates.first_name = body.first_name;
    if (body.last_name !== undefined) updates.last_name = body.last_name;
    if (body.outreach_intent !== undefined) updates.outreach_intent = body.outreach_intent;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    // Update user account in Firestore
    const userAccountRef = db.collection('user_accounts').doc(userId);
    await userAccountRef.update(updates);

    // Get updated account
    const updatedDoc = await userAccountRef.get();
    const updatedAccount = { id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({
      success: true,
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error('Error updating user account:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

