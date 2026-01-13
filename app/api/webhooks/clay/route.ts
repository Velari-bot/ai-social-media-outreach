import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CLAY_WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { verality_id, email, status, phone, region, picture, niche, followers } = body;

        if (!verality_id) {
            return NextResponse.json({ error: 'Missing verality_id' }, { status: 400 });
        }

        console.log(`[Clay Webhook] Received update for creator ${verality_id}:`, { email, status, phone });

        // prepare update data
        const updateData: any = {
            clay_enriched_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (email) {
            updateData.email = email;
            updateData.email_found = true;
        }
        if (status) updateData.email_status = status;
        if (phone) updateData.phone = phone;
        if (region) updateData.region = region;
        if (picture) updateData.picture_url = picture;
        if (niche) updateData.niche = niche;
        if (followers) updateData.followers = Number(followers);

        // Update Firestore Document
        // verality_id corresponds to the Firestore Document ID
        await db.collection('creators').doc(verality_id).set(updateData, { merge: true });

        console.log(`[Clay Webhook] Successfully updated Firestore doc ${verality_id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Clay Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
