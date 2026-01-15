import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let userId: string;
    let limit: number;

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;

        limit = parseInt(request.nextUrl.searchParams.get('limit') || '5');

        // Get recent threads with activity
        const snapshot = await db.collection('email_threads')
            .where('user_id', '==', userId)
            .where('status', 'in', ['active', 'replied'])
            .orderBy('updated_at', 'desc')
            .limit(limit)
            .get();

        const threads = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                last_message_at: data.last_message_at?.toDate?.() || data.last_message_at,
                updated_at: data.updated_at?.toDate?.() || data.updated_at
            };
        });

        return NextResponse.json({ success: true, threads });
    } catch (error: any) {
        if (error.code === 9) { // FAILED_PRECONDITION: usually missing index
            // Fallback: fetch without order and sort in memory
            console.warn('Missing index for email_threads, falling back to in-memory sort');
            try {
                // Need to redefine if not assigned above, but hoisting solves it
                if (!userId!) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

                const snapshot = await db.collection('email_threads')
                    .where('user_id', '==', userId!)
                    .where('status', 'in', ['active', 'replied'])
                    .limit(50) // Fetch more to sort
                    .get();

                const threads = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        last_message_at: data.last_message_at?.toDate?.() || data.last_message_at,
                        updated_at: data.updated_at?.toDate?.() || data.updated_at
                    };
                });

                threads.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                return NextResponse.json({ success: true, threads: threads.slice(0, limit!) });
            } catch (e) {
                console.error('Error fetching threads (fallback):', e);
                error = e; // Pass to general catch logic below
            }
        }

        console.error('Error fetching threads:', error);
        const isQuotaError = error.message?.includes('Quota exceeded') || error.code === 8;
        return NextResponse.json({
            success: false,
            error: isQuotaError ? 'Database capacity reached. Try again later.' : error.message
        }, { status: isQuotaError ? 429 : 500 });
    }
}
