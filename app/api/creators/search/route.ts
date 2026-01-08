import { NextRequest, NextResponse } from 'next/server';
import { searchCreators } from '@/lib/services/creator-service';
import { CreatorSearchFilters, Platform } from '@/lib/types';
// Auth will be handled via Firebase Admin SDK in production

/**
 * POST /api/creators/search
 * Handle creator search - Step 1 of the flow
 * Checks cache first, only calls Modash if needed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, filters, requestedCount } = body;

    // Validate input
    if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be instagram, tiktok, or youtube' },
        { status: 400 }
      );
    }

    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { error: 'Invalid filters. Must be an object' },
        { status: 400 }
      );
    }

    if (!requestedCount || typeof requestedCount !== 'number' || requestedCount < 1) {
      return NextResponse.json(
        { error: 'Invalid requestedCount. Must be a positive number' },
        { status: 400 }
      );
    }

    // Get user ID from session (you'll need to implement auth)
    // For now, we'll get it from headers or session
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (authHeader) {
      // Extract user from token (implement your auth logic)
      // For now, we'll use a placeholder
      userId = 'user-id-placeholder';
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call search service
    const creators = await searchCreators({
      userId,
      platform: platform as Platform,
      filters: filters as CreatorSearchFilters,
      requestedCount,
    });

    return NextResponse.json({
      success: true,
      creators,
      count: creators.length,
    });
  } catch (error: any) {
    console.error('Error in creator search:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

