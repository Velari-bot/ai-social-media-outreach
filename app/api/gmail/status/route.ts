import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/gmail/status
 * Get Gmail connection status for current user
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
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get Gmail connection from Firestore
    const gmailConnectionRef = db.collection('gmail_connections').doc(userId);
    const gmailConnectionDoc = await gmailConnectionRef.get();

    if (!gmailConnectionDoc.exists) {
      return NextResponse.json({
        success: true,
        connected: false,
      });
    }

    const data = gmailConnectionDoc.data()!;
    let accounts = data.accounts || [];

    // Fallback/Migration for legacy
    if (accounts.length === 0 && data.email) {
      accounts = [{
        email: data.email,
        connected: true,
        last_sync: data.last_sync,
        daily_limit: 50,
        sent_today: 0
      }];
    }

    return NextResponse.json({
      success: true,
      connected: accounts.length > 0,
      accounts: accounts.map((a: any) => ({
        email: a.email,
        connected: true,
        lastSync: a.last_sync,
        daily_limit: a.daily_limit || 50,
        sent_today: a.sent_today || 0
      })),
      // Legacy support for basic UI
      email: accounts.length > 0 ? accounts[0].email : null,
      lastSync: accounts.length > 0 ? accounts[0].last_sync : null,
      connectedAt: data.connected_at,
    });
  } catch (error: any) {
    console.error('Error fetching Gmail status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Gmail status' },
      { status: 500 }
    );
  }
}

