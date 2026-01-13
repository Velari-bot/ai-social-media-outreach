
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await db.collection('creators').orderBy('created_at', 'desc').limit(500).get();
        const creators = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                handle: data.handle || 'Unknown',
                platform: data.platform || 'Instagram',
                followers: data.basic_profile_data?.followers_count || data.basic_profile_data?.followers || '0',
                niche: data.basic_profile_data?.category || 'General',
                email: data.email || 'No email',
                status: data.email_found ? 'Verified' : 'Pending'
            };
        });

        return NextResponse.json({ success: true, creators });
    } catch (error: any) {
        console.error('Error fetching creators:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
