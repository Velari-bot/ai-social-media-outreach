import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const threadId = searchParams.get('threadId');

        if (!threadId) {
            return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
        }

        // Authenticate
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Allow if it's the bot checking (future proofing) or just rely on backend admin
            // For now, require auth for frontend
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch from Firestore
        const doc = await db.collection('thread_settings').doc(threadId).get();
        const status = doc.exists ? doc.data()?.status : 'active'; // Default to active

        return NextResponse.json({ status });

    } catch (error: any) {
        console.error('Error fetching thread status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { threadId, status } = body;

        if (!threadId || !status) {
            return NextResponse.json({ error: 'Missing threadId or status' }, { status: 400 });
        }

        if (!['active', 'paused'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Save to Firestore
        await db.collection('thread_settings').doc(threadId).set({
            status,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        console.error('Error saving thread status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
