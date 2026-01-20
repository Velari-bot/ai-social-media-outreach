
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

        // 1. Fetch ALL outreach queue items (Everyone we planned to contact / contacted)
        const queueSnap = await db.collection('outreach_queue')
            .where('user_id', '==', userId)
            .get();

        // 2. Fetch ALL threads (Active conversations with potential rates/phone numbers)
        const threadsSnap = await db.collection('email_threads')
            .where('user_id', '==', userId)
            .get();

        // Map threads by creator_id OR creator_email for easy lookup
        const threadsMap = new Map();
        threadsSnap.docs.forEach(doc => {
            const d = doc.data();
            if (d.creator_id) threadsMap.set(d.creator_id, d);
            else if (d.creator_email) threadsMap.set(d.creator_email, d);
        });

        // 3. Build Leads List
        const leadsMap = new Map();

        // Start with Queue (Source of Truth for "Everyone contacted")
        queueSnap.docs.forEach(doc => {
            const q = doc.data();
            const id = q.creator_id || q.creator_email;
            if (!id) return;

            const lead: any = {
                id: doc.id,
                creator_id: q.creator_id,
                creator_email: q.creator_email,
                creator_url: "",
                phone_number: "",
                tiktok_rate: null,
                sound_promo_rate: null,
                status: q.status, // scheduled, sent, failed
                updated_at: q.updated_at?.toDate ? q.updated_at.toDate() : (q.created_at?.toDate ? q.created_at.toDate() : new Date()),
                creator_handle: q.creator_handle || "",
                creator_platform: q.creator_platform || ""
            };

            // Enhance with Thread Data if available
            const thread = threadsMap.get(q.creator_id) || threadsMap.get(q.creator_email);
            if (thread) {
                lead.phone_number = thread.phone_number || "";
                lead.tiktok_rate = thread.tiktok_rate || null;
                lead.sound_promo_rate = thread.sound_promo_rate || null;
                lead.status = thread.status; // active, completed, etc.
                if (thread.updated_at) {
                    lead.updated_at = thread.updated_at.toDate ? thread.updated_at.toDate() : thread.updated_at;
                }
            }

            // Fallback URL construction if we have handle+platform from queue
            if (!lead.creator_url && lead.creator_handle) {
                const handle = lead.creator_handle.replace('@', '');
                if (lead.creator_platform?.toLowerCase().includes('tiktok')) lead.creator_url = `https://tiktok.com/@${handle}`;
                else if (lead.creator_platform?.toLowerCase().includes('instagram')) lead.creator_url = `https://instagram.com/${handle}`;
                else lead.creator_url = `https://tiktok.com/@${handle}`; // Default
            }

            if (!leadsMap.has(id)) {
                leadsMap.set(id, lead);
            }
        });

        // Add any threads not in queue (Manual messages?)
        threadsSnap.docs.forEach(doc => {
            const t = doc.data();
            const id = t.creator_id || t.creator_email;
            if (!id || leadsMap.has(id)) return; // Already processed

            const lead: any = {
                id: doc.id,
                creator_id: t.creator_id,
                creator_email: t.creator_email,
                creator_url: "",
                phone_number: t.phone_number || "",
                tiktok_rate: t.tiktok_rate || null,
                sound_promo_rate: t.sound_promo_rate || null,
                status: t.status,
                updated_at: t.updated_at?.toDate ? t.updated_at.toDate() : new Date(),
                creator_handle: "",
                creator_platform: ""
            };
            leadsMap.set(id, lead);
        });

        const allLeads = Array.from(leadsMap.values());

        // 4. Enrich with proper Profile URL from Creators collection if ID exists (More accurate than queue handle)
        const creatorIds = allLeads.filter(l => l.creator_id).map(l => l.creator_id);

        if (creatorIds.length > 0) {
            const uniqCreatorIds = [...new Set(creatorIds)];

            // Chunking
            const chunkArray = (arr: any[], size: number) =>
                Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                    arr.slice(i * size, i * size + size)
                );

            // Limit checks to prevent massive reads if unnecessary? 
            // Current user count ~hundreds is fine.
            const chunks = chunkArray(uniqCreatorIds, 30);
            const creatorsMap = new Map();

            for (const chunk of chunks) {
                const refs = chunk.map(id => db.collection('creators').doc(id));
                if (refs.length > 0) {
                    const snaps = await db.getAll(...refs);
                    snaps.forEach(s => {
                        if (s.exists) creatorsMap.set(s.id, s.data());
                    });
                }
            }

            allLeads.forEach(lead => {
                // If enrichable from Creator Doc, do it (overwrites queue construct)
                if (lead.creator_id && creatorsMap.has(lead.creator_id)) {
                    const c = creatorsMap.get(lead.creator_id);
                    let url = "";
                    if (c.tiktok_handle) url = `https://tiktok.com/@${c.tiktok_handle.replace('@', '')}`;
                    else if (c.instagram_handle) url = `https://instagram.com/${c.instagram_handle.replace('@', '')}`;
                    else if (c.username) url = `https://tiktok.com/@${c.username.replace('@', '')}`;

                    if (url) lead.creator_url = url;
                }
            });
        }

        // Sort by most recent
        allLeads.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        return NextResponse.json({
            success: true,
            leads: allLeads
        });

    } catch (error: any) {
        console.error('Error fetching data leads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
