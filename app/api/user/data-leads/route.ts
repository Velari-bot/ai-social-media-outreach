
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // Fetch all threads for user
        const threadsSnap = await db.collection('email_threads')
            .where('user_id', '==', userId)
            .get();

        if (threadsSnap.empty) {
            return NextResponse.json({ success: true, leads: [] });
        }

        const allLeads = threadsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                creator_email: data.creator_email,
                phone_number: data.phone_number,
                tiktok_rate: data.tiktok_rate,
                sound_promo_rate: data.sound_promo_rate,
                status: data.status,
                updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at
            };
        });

        // Filter for "valuable" leads (has data)
        const valuableLeads = allLeads.filter(l =>
            l.phone_number || l.tiktok_rate || l.sound_promo_rate
        );

        // Enrich with Creator URL
        if (valuableLeads.length > 0) {
            const creatorRefs = valuableLeads
                .map(l => {
                    const data = threadsSnap.docs.find(d => d.id === l.id)?.data();
                    return data?.creator_id ? db.collection('creators').doc(data.creator_id) : null;
                })
                .filter((ref): ref is FirebaseFirestore.DocumentReference => ref !== null);

            if (creatorRefs.length > 0) {
                // db.getAll supports up to 100 refs usually, safer to chunk if massive, but for now fine
                const creatorsSnap = await db.getAll(...creatorRefs);
                const creatorsMap = new Map();
                creatorsSnap.forEach(doc => {
                    if (doc.exists) {
                        creatorsMap.set(doc.id, doc.data());
                    }
                });

                // Attach URL
                valuableLeads.forEach(lead => {
                    const threadData = threadsSnap.docs.find(d => d.id === lead.id)?.data();
                    const creatorId = threadData?.creator_id;
                    if (creatorId && creatorsMap.has(creatorId)) {
                        const c = creatorsMap.get(creatorId);
                        // Construct URL: Priority TikTok -> Instagram -> Just Handle
                        let url = "";
                        if (c.tiktok_handle) url = `https://tiktok.com/@${c.tiktok_handle.replace('@', '')}`;
                        else if (c.instagram_handle) url = `https://instagram.com/${c.instagram_handle.replace('@', '')}`;
                        else if (c.username) url = `https://tiktok.com/@${c.username.replace('@', '')}`; // Fallback

                        (lead as any).creator_url = url;
                    } else {
                        (lead as any).creator_url = "";
                    }
                });
            }
        }

        // Sort by most recent
        valuableLeads.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        return NextResponse.json({
            success: true,
            leads: valuableLeads
        });

    } catch (error: any) {
        console.error('Error fetching data leads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
