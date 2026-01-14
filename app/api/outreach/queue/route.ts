/**
 * API Endpoint: Queue Creators for Outreach
 * POST /api/outreach/queue
 * Adds creators with emails to the automated outreach queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queueCreatorsForOutreach } from '@/lib/services/outreach-queue';

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.uid;
        const body = await request.json();

        const {
            creators,
            campaignId,
            requestId
        } = body;

        if (!creators || !Array.isArray(creators) || creators.length === 0) {
            return NextResponse.json({
                error: 'creators array is required'
            }, { status: 400 });
        }

        // Filter creators that have emails
        const creatorsWithEmails = creators.filter((c: any) => c.email && c.email.trim());

        if (creatorsWithEmails.length === 0) {
            return NextResponse.json({
                success: true,
                queued: 0,
                skipped: 0,
                message: 'No creators with emails found'
            });
        }

        // Queue creators
        const result = await queueCreatorsForOutreach({
            userId,
            creators: creatorsWithEmails.map((c: any) => ({
                creator_id: c.id || c.creator_id,
                email: c.email,
                handle: c.handle || c.username,
                platform: c.platform,
                name: c.fullname || c.name
            })),
            campaignId,
            requestId
        });

        return NextResponse.json({
            success: true,
            ...result,
            message: `Queued ${result.queued} creators for outreach`
        });

    } catch (error: any) {
        console.error('[Queue Outreach] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
