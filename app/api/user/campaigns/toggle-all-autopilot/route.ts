import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { userId, enabled } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        console.log(`[Campaigns] Force setting all campaigns recurring for user ${userId} to ${enabled}`);

        const campaignsQuery = await db.collection('creator_requests')
            .where('user_id', '==', userId)
            // .where('is_active', '==', true) // Could filter, but maybe update all?
            .get();

        if (campaignsQuery.empty) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const batch = db.batch();
        let count = 0;

        campaignsQuery.docs.forEach(doc => {
            batch.update(doc.ref, {
                is_recurring: enabled,
                updated_at: admin.firestore.Timestamp.now()
            });
            count++;
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            count
        });

    } catch (error: any) {
        console.error("Error bulk updating campaigns:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
