import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const INFLUENCER_CLUB_API_KEY = process.env.INFLUENCER_CLUB_API_KEY || '';
const INFLUENCER_CLUB_BASE_URL = 'https://api-dashboard.influencers.club';

/**
 * GET /api/classifiers/topics?platform=youtube
 * Fetch valid topic codes from Influencer Club
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

        // Map platform to their topic endpoint naming
        const topicEndpoint = platform === 'youtube'
            ? 'yt-topics'
            : platform === 'instagram'
                ? 'ig-topics'
                : 'tt-topics'; // tiktok

        const response = await fetch(
            `${INFLUENCER_CLUB_BASE_URL}/public/v1/discovery/classifier/${topicEndpoint}`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Influencer Club Topics API Error (${response.status}):`, errorText);
            return NextResponse.json({ error: 'Failed to fetch topics' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Error fetching topics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
