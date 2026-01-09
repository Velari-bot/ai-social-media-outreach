
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';


export async function GET() {
    try {
        // Fetch upcoming bookings first
        const snapshot = await db.collection('bookings')
            .orderBy('date', 'desc')
            // Removed time sort to avoid composite index error: .orderBy('time', 'asc')
            .limit(50)
            .get();

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ success: true, bookings });

    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
    }
}
