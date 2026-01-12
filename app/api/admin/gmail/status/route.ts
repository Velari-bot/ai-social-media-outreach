
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const doc = await db.collection('settings').doc('email').get();

        if (doc.exists) {
            const data = doc.data();
            return NextResponse.json({
                connected: true,
                email: data?.email,
                picture: data?.picture,
                lastUpdated: data?.lastUpdated
            });
        }

        return NextResponse.json({ connected: false });
    } catch (error: any) {
        console.error('Error fetching gmail status:', error);
        return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
    }
}
