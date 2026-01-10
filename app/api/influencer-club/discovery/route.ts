import { NextResponse } from "next/server";
import { InfluencerClubClient } from "@/lib/services/influencer-club-client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { platform, limit = 50, offset = 0, filters } = body;

        if (!platform) {
            return NextResponse.json({ error: "Missing platform" }, { status: 400 });
        }

        const client = new InfluencerClubClient({
            apiKey: process.env.INFLUENCER_CLUB_API_KEY || "",
            baseUrl: "https://api-dashboard.influencers.club"
        });

        // Use the centralized client which handles:
        // 1. Strict Payload Structure (paging, sort, filters mapping)
        // 2. Authorization Headers
        // 3. Post-Fetch Filtering (Credit Firewall)
        const creators = await client.discoverCreators({
            platform,
            limit,
            offset,
            filters: filters || {}
        });

        return NextResponse.json({
            creators,
            meta: {
                total: creators.length,
                offset: offset
            }
        });

    } catch (error: any) {
        console.error("[InfluencerClub] Route Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
