
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { db: adminDb } = await import('@/lib/firebase-admin');

        // 1. Get all requests for this user
        const requestsSnap = await adminDb.collection('creator_requests')
            .where('user_id', '==', userId)
            .get();

        if (requestsSnap.empty) {
            return NextResponse.json({ creators: [] });
        }

        // 2. Collect all Creator IDs
        const allCreatorIds = new Set<string>();
        requestsSnap.forEach(doc => {
            const data = doc.data();
            if (data.creator_ids && Array.isArray(data.creator_ids)) {
                data.creator_ids.forEach((id: string) => allCreatorIds.add(id));
            }
        });

        const creatorIdsArray = Array.from(allCreatorIds);

        if (creatorIdsArray.length === 0) {
            return NextResponse.json({ creators: [] });
        }

        // 3. Fetch all creators in chunks (Firestore limit 30 for 'in')
        // Actually, for massive exports, we might want to just stream or fetch all.
        // But 'in' queries are limited. We can use getAll() if we have exact IDs, or multiple 'in' queries.
        // getAll() supports many args but keep it reasonable. 
        // Best approach is chunks of 30 with 'in' query or using getAll with chunks of 10-100.

        const chunks = [];
        const chunkSize = 30;
        for (let i = 0; i < creatorIdsArray.length; i += chunkSize) {
            chunks.push(creatorIdsArray.slice(i, i + chunkSize));
        }

        const creators: any[] = [];
        const creatorsRef = adminDb.collection('creators');

        const results = await Promise.all(
            chunks.map(chunk => creatorsRef.where('__name__', 'in', chunk).get())
        );

        results.forEach(snap => {
            snap.forEach(doc => {
                const data = doc.data();
                const basic = data.basic_profile_data || {};
                const profile = basic.profile || {};

                creators.push({
                    id: doc.id,
                    ...data,
                    // Normalize fields
                    name: data.name || basic.fullname || basic.full_name || profile.full_name || data.handle,
                    handle: data.handle || basic.username || profile.username,
                    platform: data.platform || basic.platform || 'unknown',
                    followers: data.followers || basic.followers || profile.followers || 0,
                    engagement_rate: data.engagement_rate || basic.engagement_rate || (profile.engagement_percent ? profile.engagement_percent / 100 : 0),
                    picture: data.picture || basic.picture || basic.profile_pic_url || profile.picture,
                    location: data.location || basic.location || basic.country || basic.geo_country,
                    email: data.email || basic.email || (basic.emails && basic.emails[0]) || null,
                    // Add extra fields useful for export
                    biography: data.biography || basic.biography || profile.biography,
                    external_url: data.external_url || basic.external_url || profile.external_url
                });
            });
        });

        return NextResponse.json({
            success: true,
            creators,
            count: creators.length
        });

    } catch (error: any) {
        console.error('Error exporting all creators:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
