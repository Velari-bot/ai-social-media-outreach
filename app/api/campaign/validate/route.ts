
import { NextRequest, NextResponse } from 'next/server';
import { campaignValidator, CampaignContext } from '@/lib/services/campaign-validator';
// Note: We might need a real auth verification here, but for now we'll assume the client sends valid data 
// and potentially verify the user token if we had a server-side auth helper ready.
// In a real app involving money/email, we MUST verify the user from the "Authorization" header.

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic structural validation of body can happen here or inside validateCampaign's context parsing
        const context: CampaignContext = {
            userId: body.userId, // In real app, get this from Auth token!
            campaignId: body.campaignId,
            name: body.name,
            platform: body.platform,
            creatorIds: body.creatorIds || [],
            emailTemplate: body.emailTemplate || {},
            schedule: body.schedule || {},
            brandContext: body.brandContext
        };

        if (!context.userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const result = await campaignValidator.validateCampaign(context);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error("Campaign validation API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
