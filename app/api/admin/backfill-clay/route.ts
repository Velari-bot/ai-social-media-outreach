import { db } from '../../../../lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

const CLAY_WEBHOOK_URL = process.env.CLAY_WEBHOOK_URL || 'https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-2f50d72c-37c4-4ef0-86e9-f36fd3897aac';

function constructProfileUrl(platform: string, handle: string): string {
    if (!handle) return "";
    const h = handle.replace(/^@/, '');
    switch ((platform || '').toLowerCase()) {
        case 'youtube': return `https://www.youtube.com/@${h}`;
        case 'instagram': return `https://www.instagram.com/${h}`;
        case 'tiktok': return `https://www.tiktok.com/@${h}`;
        default: return `https://${platform}.com/${h}`;
    }
}

export async function POST(req: NextRequest) {
    try {
        // In a real app, verify admin session here.

        const snapshot = await db.collection('creators').get();
        if (snapshot.empty) {
            return NextResponse.json({ success: true, message: 'No creators found to backfill' });
        }

        console.log(`[Backfill] Found ${snapshot.size} creators. Processing...`);

        // Batched process for speed (Vercel timeout protection)
        const BATCH_SIZE = 20;
        const items = snapshot.docs; // Process ALL docs now that we are faster
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < items.length; i += BATCH_SIZE) {
            const batch = items.slice(i, i + BATCH_SIZE);

            // Process batch in parallel
            await Promise.all(batch.map(async (doc) => {
                try {
                    const data = doc.data();
                    const basicData = data.basic_profile_data || {};

                    const payload = {
                        "verality_id": doc.id,
                        "creator_name": data.full_name || basicData.fullname || basicData.full_name || data.handle || "Unknown",
                        "platform": data.platform || "instagram",
                        "username": data.handle || basicData.username,
                        "profile_url": data.profile_url || basicData.profile_url || basicData.url || constructProfileUrl(data.platform || 'instagram', data.handle),
                        "niche": data.niche || "",
                        "followers": Number(data.followers || basicData.followers || 0),
                        "bio": data.bio || basicData.biography || basicData.bio || "",
                        "website": data.website || basicData.external_url || basicData.website || "",
                        "user_id": data.user_id || "",
                        "backfill": true
                    };

                    const res = await fetch(CLAY_WEBHOOK_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) successCount++;
                    else failCount++;
                } catch (e) {
                    console.error(`Failed to push ${doc.id}`, e);
                    failCount++;
                }
            }));

            console.log(`[Backfill] Batch ${i / BATCH_SIZE + 1} done.`);
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${items.length}. Success: ${successCount}, Failed: ${failCount}`,
            count: successCount,
            total: items.length
        });
    } catch (error: any) {
        console.error('Backfill error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
