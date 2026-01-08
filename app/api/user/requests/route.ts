import { NextRequest, NextResponse } from 'next/server';
import { getRecentRequests, createCreatorRequest } from '@/lib/database';
import { auth } from '@/lib/firebase-admin';

/**
 * GET /api/user/requests
 * Get user's recent creator requests
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;

    const requests = await getRecentRequests(userId, limit);

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/requests
 * Create a new creator request
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { name, platforms, criteria } = body;

    if (!name || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Create request in DB
    const newRequest = await createCreatorRequest(userId, {
      name,
      platforms,
      criteria: criteria || {},
    });

    if (!newRequest) {
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }

    // Trigger search for the first platform (primary support)
    if (platforms.length > 0) {
      // Don't await the search to keep UI responsive, or await?
      // User wants "Verify data flows correctly", so maybe synchronous is better for debugging/reliability initially.
      // But for production, async is better.
      // Let's do it synchronously for now to ensure we catch errors.
      try {
        const { searchCreators } = await import('@/lib/services/creator-service');
        await searchCreators({
          userId,
          platform: platforms[0].toLowerCase() as any, // Cast to Platform type
          filters: criteria,
          requestedCount: 10, // Default batch size
        });

        // Update request status to in_progress or delivered?
        // Ideally searchCreators would update the request status, or we do it here.
        // But searchCreators returns creators.

        // We can update the request status here
        // await db.collection('creator_requests').doc(newRequest.id).update({ status: 'delivered', results_count: results.length });

        // For now, just logging
        console.log(`Search triggered for request ${newRequest.id}`);
      } catch (searchError) {
        console.error('Error triggering creator search:', searchError);
        // Don't fail the request creation itself, just log error
      }
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
    });
  } catch (error: any) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

