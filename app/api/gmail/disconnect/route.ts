import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

/**
 * POST /api/gmail/disconnect
 * Disconnect Gmail account
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

    // Delete Gmail connection from Firestore
    const gmailConnectionRef = db.collection('gmail_connections').doc(userId);
    await gmailConnectionRef.delete();

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error disconnecting Gmail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect Gmail' },
      { status: 500 }
    );
  }
}

