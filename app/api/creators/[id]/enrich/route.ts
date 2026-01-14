import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { discoveryPipeline } from '@/lib/services/discovery-pipeline';

/**
 * POST /api/creators/[id]/enrich
 * Manually trigger or refresh enrichment for a specific creator
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const creatorId = params.id;

    // 1. Get Creator from DB
    const creatorDoc = await db.collection('creators').doc(creatorId).get();
    if (!creatorDoc.exists) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const creatorData = creatorDoc.data();

    // 2. Trigger Clay Enrichment logic
    // We basically re-run the pipe's bulkEnrich but for one person
    const enriched = await (discoveryPipeline as any).bulkEnrichWithClay([
      { id: creatorId, ...creatorData }
    ], userId);

    return NextResponse.json({
      success: true,
      creator: enriched[0]
    });

  } catch (error: any) {
    console.error('Manual enrichment failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
