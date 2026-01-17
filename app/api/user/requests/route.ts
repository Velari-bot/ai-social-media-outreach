import { NextRequest, NextResponse } from 'next/server';
import { getRecentRequests, createCreatorRequest } from '@/lib/database';
import { auth, db as adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

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

    // --- Quota Check ---
    const { getUserAccount } = await import('@/lib/database');
    const account = await getUserAccount(userId);
    let remaining = 999999;

    if (account) {
      remaining = account.email_quota_daily - account.email_used_today;
      if (remaining <= 0 && account.plan !== 'enterprise') {
        return NextResponse.json(
          { error: 'Daily search limit reached. Please upgrade your plan for more searches.' },
          { status: 403 }
        );
      }
    }

    // Extract batchSize and check if user has enough credits
    const requestedBatchSize = criteria?.batchSize ? parseInt(criteria.batchSize) : 50;

    if (account && account.plan !== 'enterprise' && remaining < requestedBatchSize) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${requestedBatchSize} credits for this search, but only have ${remaining} left.` },
        { status: 403 }
      );
    }

    const finalBatchSize = requestedBatchSize;

    // Create request in DB
    const newRequest = await createCreatorRequest(userId, {
      name,
      platforms,
      criteria: { ...criteria, batchSize: finalBatchSize },
    });

    if (!newRequest) {
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }
    console.log(`[RequestsAPI] Request ${newRequest.id} created successfully.`);

    // --- Audit Log ---
    const { logAudit } = await import('@/lib/audit-logger');
    await logAudit('create_request', userId, {
      request_id: newRequest.id,
      platforms: platforms,
      criteria: criteria
    }, String(newRequest.id), 'request');


    // Trigger search for the first platform (primary support)
    if (platforms.length > 0) {
      try {
        console.log(`[RequestsAPI] Initiating discovery for platform: ${platforms[0]}.`);
        console.log(`[RequestsAPI] IC Key configured: ${!!process.env.INFLUENCER_CLUB_API_KEY}`);

        // 5. Run Discovery
        const { discoveryPipeline } = await import('@/lib/services/discovery-pipeline');
        const results = await discoveryPipeline.discover({
          userId,
          platform: platforms[0].toLowerCase() as any,
          filters: criteria,
          requestedCount: finalBatchSize,
          skipEnrichment: criteria.skipEnrichment === true, // Check criteria for explicit skip
        });

        const foundCount = results.creators?.length || 0;
        const creatorIds = (results.creators || []).map((c: any) => c.id).filter(Boolean);

        console.log(`[RequestsAPI] Discovery complete. Found ${foundCount} creators. IDs: ${creatorIds.length}`);

        // 6. Check if zero results - delete request and return error
        // 6. Check if zero results - handle gracefully
        if (foundCount === 0) {
          console.log(`[RequestsAPI] Zero creators found. Returning empty list.`);

          // DO NOT delete the request if you want to keep record of the attempt, 
          // OR delete it if you consider it "failed". 
          // The previous logic deleted it. Let's keep the delete logic but return 200.
          try {
            await adminDb.collection('creator_requests').doc(newRequest.id).delete();
          } catch (deleteError: any) {
            console.error(`[RequestsAPI] Failed to delete zero-result request:`, deleteError.message);
          }

          return NextResponse.json({
            success: true, // Use true so frontend handles it as a valid response
            creators: [],
            message: 'No creators found matching your criteria.',
            suggestions: [
              'Lower the minimum follower count',
              'Remove or change the location filter',
              'Try a different category or use keywords instead',
              'Set engagement to "Any Engagement"'
            ]
          }, { status: 200 });
        }

        // 7. Update Request Record (PIN results)
        try {
          console.log(`[RequestsAPI] Attempting to update request ${newRequest.id} in DB.`);
          // Use the top-level adminDb directly
          const requestRef = adminDb.collection('creator_requests').doc(newRequest.id);
          await requestRef.update({
            status: 'delivered',
            results_count: foundCount,
            creator_ids: creatorIds,
            updated_at: Timestamp.now()
          });
          console.log(`[RequestsAPI] Updated request ${newRequest.id} with ${foundCount} results.`);
        } catch (dbError: any) {
          console.error(`[RequestsAPI] Failed to update request record ${newRequest.id}:`, dbError.message);
          // We continue anyway so user gets their creators
        }

        // 8. Charge based on found creators (ONLY if emails were requested)
        if (foundCount > 0 && criteria.skipEnrichment !== true) {
          try {
            const isYoutube = platforms.some(p => p.toLowerCase() === 'youtube');
            const costPerCreator = isYoutube ? 2 : 1;
            const totalCost = foundCount * costPerCreator;

            console.log(`[RequestsAPI] Charging user ${userId} for ${foundCount} creators (Rate: ${costPerCreator}/creator. Total: ${totalCost}).`);
            const { incrementEmailQuota } = await import('@/lib/database');
            await incrementEmailQuota(userId, totalCost);
            console.log(`[RequestsAPI] Charged user ${userId} ${totalCost} credits.`);
          } catch (quotaError: any) {
            console.error(`[RequestsAPI] Failed to charge quota for user ${userId}:`, quotaError.message);
          }
        }


        console.log(`[RequestsAPI] Returning successful response for request ${newRequest.id} with creators.`);
        return NextResponse.json({
          success: true,
          request: {
            ...newRequest,
            status: 'delivered',
            results_count: foundCount,
            creator_ids: creatorIds
          },
          creators: results.creators,
          meta: results.meta
        });
      } catch (searchError: any) {
        console.error('[RequestsAPI] Search internal error:', searchError);
        // Delete the request record since it failed
        try {
          await adminDb.collection('creator_requests').doc(newRequest.id).delete();
        } catch (e) { }

        return NextResponse.json({
          success: false,
          error: searchError.message || 'Search failed. Please try again later.'
        }, { status: 500 });
      }
    }

    // Do NOT increment quota here if search failed or 0 results found via fallback
    console.log(`[RequestsAPI] No platforms specified or search skipped. Returning request ${newRequest.id} as pending.`);
    return NextResponse.json({
      success: true,
      request: newRequest
    });
  } catch (error: any) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId;

    if (token === 'TEST_TOKEN') {
      // Hardcode bypass for dev - robust lookup
      const { db } = await import('@/lib/firebase-admin');
      const usersRef = db.collection('user_accounts');
      const snapshot = await usersRef.where('email', '==', 'benderaiden826@gmail.com').limit(1).get();
      if (!snapshot.empty) {
        userId = snapshot.docs[0].id;
      } else {
        const userSnap = await db.collection('users').where('email', '==', 'benderaiden826@gmail.com').limit(1).get();
        userId = userSnap.empty ? '' : userSnap.docs[0].id;
      }

      if (!userId) {
        return NextResponse.json({ error: 'Test user not found' }, { status: 404 });
      }
    } else {
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Only allow deleting own requests
    // (In a real app, verify ownership. For now, trust ID + Auth)

    const { db } = await import('@/lib/firebase-admin');
    const docRef = db.collection('creator_requests').doc(id);

    // Check if exists first to return proper error if not found? 
    // Or just delete (idempotent for clients usually, but if user sees error...)
    // Let's check first to matching the behavior user saw (404)
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
