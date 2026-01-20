
import { NextResponse } from 'next/server';
import { monitorAllReplies } from '@/lib/services/reply-monitor';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Starting Debug Monitor via API...");
        const result = await monitorAllReplies();
        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("Monitor Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
