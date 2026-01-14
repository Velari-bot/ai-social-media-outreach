
import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        // Verify token and maybe check for admin custom claim if you have it
        // For now, simple auth check
        await auth.verifyIdToken(token);

        // Fetch logs (limit 50, recent first)
        const snapshot = await db.collection('audit_logs')
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();

        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate?.()?.toISOString()
        }));

        return NextResponse.json({ success: true, logs });

    } catch (error: any) {
        console.error("Fetch audit logs error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
