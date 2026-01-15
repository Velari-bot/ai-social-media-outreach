import { NextRequest, NextResponse } from 'next/server';
import { getUserStats } from '@/lib/database';
import { auth } from '@/lib/firebase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/stats
 * Get current user's stats
 */
export async function GET(request: NextRequest) {
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

    const stats = await getUserStats(userId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    const isQuotaError = error.message?.includes('Quota exceeded') || error.code === 8;
    return NextResponse.json(
      { error: isQuotaError ? 'Database capacity reached. Please try again tomorrow.' : (error.message || 'Internal server error') },
      { status: isQuotaError ? 429 : 500 }
    );
  }
}

