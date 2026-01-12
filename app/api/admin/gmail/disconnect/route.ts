
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST() {
    try {
        console.log("[Admin] Disconnecting Gmail (deleting settings/email)...");
        await db.collection('settings').doc('email').delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error disconnecting Gmail:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
