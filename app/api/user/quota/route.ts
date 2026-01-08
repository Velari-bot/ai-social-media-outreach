import { NextRequest, NextResponse } from 'next/server';
import { incrementEmailQuota } from '@/lib/database';
import { auth } from '@/lib/firebase-admin';

/**
 * POST /api/user/quota
 * Increment email quota usage
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

    const success = await incrementEmailQuota(userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to increment quota' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error incrementing quota:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

