
import { NextRequest, NextResponse } from 'next/server';
import { trackAffiliateClick } from '@/lib/database';
// Ensure firebase-admin is initialized
import '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { refCode } = await request.json();

        if (!refCode) {
            return NextResponse.json({ error: 'Ref code required' }, { status: 400 });
        }

        // Get IP for simple unique check / privacy
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // Track click asynchronously (don't block response too long)
        await trackAffiliateClick(refCode, ipHash);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track error:', error);
        // Always return success to client to avoid disrupting UX
        return NextResponse.json({ success: true });
    }
}
