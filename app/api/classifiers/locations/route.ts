import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

/**
 * GET /api/classifiers/locations?platform=youtube
 * Fetch valid location codes from Influencer Club
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform') || 'youtube';

        if (!INFLUENCER_CLUB_API_KEY) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const authHeader = INFLUENCER_CLUB_API_KEY.startsWith('Bearer ')
            ? INFLUENCER_CLUB_API_KEY
            : `Bearer ${INFLUENCER_CLUB_API_KEY}`;

        const response = await fetch(
            `${INFLUENCER_CLUB_BASE_URL}/public/v1/discovery/classifier/locations/${platform}`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Influencer Club Locations API Error (${response.status}):`, errorText);
            return NextResponse.json({ error: 'Failed to fetch locations' }, { status: response.status });
        }

        const data = await response.json();
        console.log('[Locations API] Raw response:', JSON.stringify(data, null, 2));

        // Normalize response - handle different possible formats
        let locations = [];
        if (Array.isArray(data)) {
            locations = data;
        } else if (data.locations && Array.isArray(data.locations)) {
            locations = data.locations;
        } else if (data.data && Array.isArray(data.data)) {
            locations = data.data;
        }

        return NextResponse.json({ locations });

    } catch (error: any) {
        console.error('Error fetching locations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
