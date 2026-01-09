
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
    try {
        const { date, startTime, endTime } = await request.json();

        await db.collection('availability').add({
            date,
            startTime,
            endTime,
            isBooked: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { slotId } = await request.json();
        if (!slotId) {
            return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
        }

        await db.collection('availability').doc(slotId).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
