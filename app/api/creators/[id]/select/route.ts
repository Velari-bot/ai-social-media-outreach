import { NextRequest, NextResponse } from 'next/server';
import { selectCreatorForOutreach } from '@/lib/services/creator-service';

/**
 * POST /api/creators/[id]/select
 * Handle creator selection for outreach - Step 3 of the flow
 * Fetches detailed profile if not already cached
 */
export async function POST(
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

    // Get user ID from session
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (authHeader) {
      // Extract user from token (implement your auth logic)
      userId = 'user-id-placeholder';
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call selection service (this will fetch detailed profile if needed)
    const creator = await selectCreatorForOutreach({
      creatorId,
      userId,
    });

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        platform: creator.platform,
        handle: creator.handle,
        has_detailed_profile: creator.has_detailed_profile,
        detailed_profile_fetched_at: creator.detailed_profile_fetched_at,
        detailed_profile_data: creator.detailed_profile_data,
        email_found: creator.email_found,
        email: creator.email, // Now available after detailed profile fetch
      },
    });
  } catch (error: any) {
    console.error('Error selecting creator for outreach:', error);
    
    // Handle quota exceeded errors
    if (error.message?.includes('quota exceeded')) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

