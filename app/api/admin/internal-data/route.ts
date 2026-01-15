import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = db.collection('internal_creators')
            .orderBy('created_at', 'desc')
            .limit(limit);

        if (source) {
            query = query.where('source_file', '==', source);
        }

        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure fields exist for display
            handle: doc.data().handle || 'N/A',
            name: doc.data().name || 'N/A',
            email: doc.data().email || 'N/A',
            followers: doc.data().followers || 'N/A',
            platform: doc.data().platform || 'TikTok',
            region: doc.data().region || 'N/A'
        }));

        return NextResponse.json({
            success: true,
            count: data.length,
            data
        });
    } catch (error: any) {
        console.error("Error fetching internal data:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
