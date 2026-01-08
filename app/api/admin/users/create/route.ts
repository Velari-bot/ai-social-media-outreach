
import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { email, displayName, role, plan } = await req.json();

        // 1. Create in Firebase Auth
        let uid;
        try {
            const userRecord = await auth.createUser({
                email,
                displayName,
                emailVerified: true // Implicitly verified since admin created it
            });
            uid = userRecord.uid;
        } catch (e: any) {
            if (e.code === 'auth/email-already-exists') {
                // Fetch existing
                const userRecord = await auth.getUserByEmail(email);
                uid = userRecord.uid;
            } else {
                throw e;
            }
        }

        // 2. Create/Update in Firestore
        await db.collection('users').doc(uid).set({
            email,
            displayName,
            role: role || 'user',
            plan: plan || 'free',
            status: 'active',
            createdAt: new Date(),
        }, { merge: true });

        // 3. Maybe send a welcome email? (Skipping for now to focus on core)

        return NextResponse.json({ success: true, uid });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
