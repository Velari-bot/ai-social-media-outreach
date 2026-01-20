
import { NextResponse } from 'next/server';
import { monitorAllReplies } from '@/lib/services/reply-monitor';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Force triggering reply monitor...");
        const result = await monitorAllReplies();
        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("Force reply monitor failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
