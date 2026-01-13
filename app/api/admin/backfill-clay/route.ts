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

        console.log(`[Backfill] Found ${snapshot.size} creators. Processing sequentially...`);

        // Sequential processing to guarantee delivery and respect Rate Limits
        // Vercel Serverless Function Limit is usually 10-60s. 

        let successCount = 0;
        let failCount = 0;
        const docs = snapshot.docs;

        for (const doc of docs) {
            try {
                const data = doc.data();
                const basicData = data.basic_profile_data || {};

                // Construct Payload
                const payload = {
                    "verality_id": doc.id,
                    "creator_name": data.full_name || basicData.fullname || basicData.full_name || data.handle || "Unknown",
                    "platform": data.platform || "instagram",
                    "username": data.handle || basicData.username,
                    "profile_url": data.profile_url || data.picture_url || basicData.profile_url || basicData.url || constructProfileUrl(data.platform || 'instagram', data.handle),
                    "picture_url": data.picture_url || basicData.picture || basicData.profile_pic_url || "",
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

                if (res.ok) {
                    successCount++;
                } else {
                    console.error(`Clay returned ${res.status} for ${doc.id}`);
                    failCount++;
                }

                // Small delay to prevent rate limiting (critical for Clay)
                await new Promise(r => setTimeout(r, 150));

            } catch (e) {
                console.error(`Exception pushing ${doc.id}`, e);
                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${snapshot.size}. Success: ${successCount}. Fail: ${failCount}`,
            count: successCount
        });
    } catch (error: any) {
        console.error('Backfill error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
