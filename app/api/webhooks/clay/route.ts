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

        // Default to "General" if missing, per user request
        updateData.region = region || "General";

        if (picture) updateData.picture_url = picture; // PFP
        if (profile) updateData.profile_url = profile; // Social Link

        // Default to "General" if missing
        updateData.niche = niche || "General";

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

        // Credit Refund Logic
        // If no email was found, and this was a user request (not backfill), refund the credit.
        // We check 'email_found' in updateData.

        // Extract user_id and backfill from body (Clay should pass these back if they were in the input)
        // Note: Clay webhook payload structure depends on how the webhook action is configured in Clay.
        // We assume Clay passes through the 'user_id' and 'backfill' fields we sent, or we fetch user_id from the doc.

        let targetUserId = body.user_id;

        // If Clay didn't return user_id, fall back to the creator doc's user_id
        if (!targetUserId && docSnap.exists) {
            const docData = docSnap.data();
            targetUserId = docData?.user_id;
        }

        const isBackfill = body.backfill === true || body.backfill === "true";

        if (targetUserId && !updateData.email_found && !isBackfill) {
            console.log(`[Clay Webhook] No email found for ${verality_id}. Refunding 1 credit to user ${targetUserId}.`);
            // Import dynamically to avoid circular deps if any, or just import at top if clean
            const { incrementEmailQuota } = await import('@/lib/database');
            await incrementEmailQuota(targetUserId, -1);
        }

        console.log(`[Clay Webhook] Successfully updated Firestore doc ${verality_id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Clay Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
