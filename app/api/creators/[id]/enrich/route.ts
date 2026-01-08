import { NextRequest, NextResponse } from 'next/server';
import { enrichCreatorWithClay } from '@/lib/services/creator-service';

/**
 * POST /api/creators/[id]/enrich
 * Enrich creator with Clay - Step 4 of the flow
 * Only called after detailed profile is available
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

    // Call Clay enrichment service
    const creator = await enrichCreatorWithClay({
      creatorId,
      userId,
    });

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        platform: creator.platform,
        handle: creator.handle,
        email_found: creator.email_found,
        email: creator.email,
        clay_enriched_at: creator.clay_enriched_at,
      },
    });
  } catch (error: any) {
    console.error('Error enriching creator:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

