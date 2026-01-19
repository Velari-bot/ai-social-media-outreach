import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { sendScheduledEmails } from '@/lib/services/outreach-sender';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    try {
        const { userId, forceAll } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        console.log(`[Debug] Force sending emails for user ${userId}`);

        // 1. Get all scheduled emails for this user
        let query = db.collection('outreach_queue')
            .where('user_id', '==', userId);

        // If forceAll is true, retry failed ones too
        if (!forceAll) {
            query = query.where('status', '==', 'scheduled');
        } else {
            query = query.where('status', 'in', ['scheduled', 'failed']);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return NextResponse.json({ message: 'No scheduled (or failed) emails found for this user.' });
        }

        const updates = [];
        const now = Timestamp.now();

        // 2. Update their scheduled_time to NOW so the sender picks them up
        // OR just invoke the sender directly on them.

        // Let's explicitly force their time to PASST (5 mins ago) to bypass the "future" check
        // and ensure the sender sees them as "ready".
        const past = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000); // 5 mins ago

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                scheduled_send_time: past,
                force_sent_debug: true,
                status: 'scheduled' // valid check
            });
        });
        await batch.commit();

        // 3. Trigger the sender function immediately
        // The sender filters by time <= now, which we just satisfied.
        const result = await sendScheduledEmails();

        return NextResponse.json({
            success: true,
            updatedCount: snapshot.size,
            sendResult: result
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
