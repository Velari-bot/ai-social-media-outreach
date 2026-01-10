
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Try to fetch from 'audit_logs' or similar. 
        // If it doesn't exist, it will just return empty snapshot.
        const snapshot = await db.collection('audit_logs').orderBy('created_at', 'desc').limit(50).get();

        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                type: data.type || 'info',
                title: data.action || data.title || 'System Event',
                user: data.user_email || data.user || 'System',
                ip: data.ip || 'N/A',
                time: data.created_at?.toDate ? data.created_at.toDate().toLocaleString() : 'Just now'
            };
        });

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        // We don't want to error out if the collection doesn't exist, just return empty
        return NextResponse.json({ success: true, logs: [] });
    }
}
