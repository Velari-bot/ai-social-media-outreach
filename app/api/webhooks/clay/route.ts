import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { verality_id, email, status, clay_row_id } = body;

        if (!verality_id) {
            return NextResponse.json({ error: 'Missing verality_id' }, { status: 400 });
        }

        console.log(`[Clay Webhook] Received update for creator ${verality_id}:`, { email, status });

        // prepare update data
        const updateData: any = {
            clay_enriched_at: new Date().toISOString(),
            updated_at: new Date().toISOString() // Keep timestamp consistent
        };

        if (email) {
            updateData.email = email;
            updateData.email_found = true;
        }

        // Update Firestore Document
        // verality_id corresponds to the Firestore Document ID
        await db.collection('creators').doc(verality_id).update(updateData);

        console.log(`[Clay Webhook] Successfully updated Firestore doc ${verality_id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Clay Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
