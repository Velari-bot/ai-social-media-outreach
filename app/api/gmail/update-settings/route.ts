import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';

/**
 * POST /api/gmail/update-settings
 * Update Gmail connection settings (daily limits, remove account)
 */
export async function POST(request: NextRequest) {
    try {
        // Get user ID from Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const body = await request.json();
        const { action, email, daily_limit } = body;

        const gmailConnectionRef = db.collection('gmail_connections').doc(userId);
        const doc = await gmailConnectionRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'No connection found' }, { status: 404 });
        }

        const data = doc.data()!;
        let accounts: any[] = data.accounts || [];

        // Fallback migration if needed
        if (accounts.length === 0 && data.email) {
            accounts = [{
                email: data.email,
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                daily_limit: 50,
                sent_today: 0
            }];
        }

        if (action === 'update_limit') {
            const index = accounts.findIndex(a => a.email === email);
            if (index >= 0) {
                accounts[index].daily_limit = typeof daily_limit === 'number' ? daily_limit : 50;
            }
        } else if (action === 'remove_account') {
            accounts = accounts.filter(a => a.email !== email);
        }

        await gmailConnectionRef.update({
            accounts: accounts,
            updated_at: new Date().toISOString()
        });

        return NextResponse.json({
            success: true,
            accounts: accounts.map(a => ({
                email: a.email,
                daily_limit: a.daily_limit,
                sent_today: a.sent_today
            }))
        });

    } catch (error: any) {
        console.error('Error updating Gmail settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}
