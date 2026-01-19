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
            console.log(`[Debug] Queue empty. Checking for lost campaign items...`);

            // Auto-Recovery: Check if there are active campaigns with results but no queue items
            const campaigns = await db.collection('creator_requests')
                .where('user_id', '==', userId)
                .where('status', 'in', ['searching', 'in_progress', 'delivered']) // 'delivered' means "Sent First Email"
                .get();

            let recoveredCount = 0;

            if (!campaigns.empty) {
                const { addCreatorsToQueue } = await import('@/lib/services/outreach-queue');

                for (const camp of campaigns.docs) {
                    const data = camp.data();
                    const creatorIds = data.creator_ids || [];

                    if (creatorIds.length > 0) {
                        // Check if these are already in queue (addCreatorsToQueue does this check too, efficiently enough)
                        // But let's just try to add them. The service skips duplicates.
                        console.log(`[Debug] Attempting to recover ${creatorIds.length} creators for campaign ${camp.id}`);

                        try {
                            const result = await addCreatorsToQueue(
                                creatorIds,
                                userId,
                                camp.id,
                                data.name
                            );
                            if (result && result.queued > 0) {
                                recoveredCount += result.queued;
                                console.log(`[Debug] Recovered ${result.queued} emails for campaign ${camp.id}`);
                            }
                        } catch (e: any) {
                            console.error(`[Debug] Recovery failed for campaign ${camp.id}:`, e.message);
                        }
                    }
                }
            }

            if (recoveredCount > 0) {
                // Now retry sending immediately!
                const result = await sendScheduledEmails();
                return NextResponse.json({
                    success: true,
                    message: `Recovered ${recoveredCount} missing emails and triggered send.`,
                    recoveryCount: recoveredCount,
                    sendResult: result
                });
            }

            return NextResponse.json({ message: 'No scheduled (or failed) emails found, and no missing campaign items found.' });
        }

        const updates = [];
        const now = Timestamp.now();
        // ... rest of processing ...
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
        console.error("Force Send Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
