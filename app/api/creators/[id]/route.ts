import { NextRequest, NextResponse } from 'next/server';
import { getBasicProfile } from '@/lib/services/creator-service';

/**
 * GET /api/creators/[id]
 * Get basic profile for display - Step 2 of the flow
 * No API calls allowed here
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = parseInt(params.id);

    if (isNaN(creatorId)) {
      return NextResponse.json(
        { error: 'Invalid creator ID' },
        { status: 400 }
      );
    }

    const creator = await getBasicProfile(creatorId);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Return only basic profile data (no email, no deep analytics)
    const basicData = {
      id: creator.id,
      platform: creator.platform,
      handle: creator.handle,
      has_basic_profile: creator.has_basic_profile,
      has_detailed_profile: creator.has_detailed_profile,
      basic_profile_data: creator.basic_profile_data,
      // Explicitly exclude email and detailed_profile_data
    };

    return NextResponse.json({
      success: true,
      creator: basicData,
    });
  } catch (error: any) {
    console.error('Error fetching creator:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

