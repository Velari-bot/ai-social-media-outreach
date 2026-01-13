import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        // Authentication disabled for easier integration
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CLAY_WEBHOOK_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await request.json();
        const { verality_id, email, email_2, email_3, status, phone, region, picture, profile, niche, followers } = body;

        if (!verality_id) {
            return NextResponse.json({ error: 'Missing verality_id' }, { status: 400 });
        }

        console.log(`[Clay Webhook] Received update for creator ${verality_id}:`, { email, status, phone });

        // prepare update data
        const updateData: any = {
            clay_enriched_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Handle Primary Email
        if (email) {
            updateData.email = email;
            updateData.email_found = true;
        }

        // Handle Other Emails (merge any that are not the primary)
        const others = [email_2, email_3].filter(e => e && e !== email && e.trim() !== '');
        if (others.length > 0) {
            updateData.other_emails = others;
            // If primary was missing but we found others, treat as found
            if (!updateData.email) {
                updateData.email = others[0];
                updateData.email_found = true;
            }
        }
        if (status) updateData.email_status = status;
        if (phone) updateData.phone = phone;
        if (region) updateData.region = region;
        if (picture) updateData.picture_url = picture; // PFP
        if (profile) updateData.profile_url = profile; // Social Link
        if (niche) updateData.niche = niche;
        if (followers) updateData.followers = Number(followers);

        // Update Firestore Document
        // verality_id corresponds to the Firestore Document ID
        const docRef = db.collection('creators').doc(verality_id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.error(`[Clay Webhook] Creator ${verality_id} not found.`);
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        await docRef.set(updateData, { merge: true });

        console.log(`[Clay Webhook] Successfully updated Firestore doc ${verality_id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Clay Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
