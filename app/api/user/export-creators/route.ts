
import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // 1. Get all requests for this user
        const requestsSnap = await db.collection('creator_requests')
            .where('user_id', '==', userId)
            .get();

        const allCreatorIds = new Set<string>();
        requestsSnap.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.creator_ids)) {
                data.creator_ids.forEach((id: string) => allCreatorIds.add(String(id)));
            }
        });

        if (allCreatorIds.size === 0) {
            return NextResponse.json({ success: true, csv: '' }); // Or headers to download empty file
        }

        const idsArray = Array.from(allCreatorIds);
        const BATCH_SIZE = 30; // Firestore limit for 'in' queries
        const creators: any[] = [];

        // 2. Batch fetch creators (Firestore 'in' supports max 30)
        for (let i = 0; i < idsArray.length; i += BATCH_SIZE) {
            const chunk = idsArray.slice(i, i + BATCH_SIZE);
            if (chunk.length === 0) continue;

            const creatorsSnap = await db.collection('creators')
                .where('__name__', 'in', chunk) // Check by document ID
                .get();

            creatorsSnap.forEach(doc => {
                creators.push({ id: doc.id, ...doc.data() });
            });
        }

        // 3. Convert to CSV
        const headers = [
            'Name', 'Handle', 'Platform', 'Followers', 'Engagement Rate', 'Email', 'Location', 'Niche', 'Profile Link'
        ];

        const csvRows = [headers.join(',')];

        for (const c of creators) {
            // Helper to clean fields for CSV (escape commas, quotes)
            const clean = (val: any) => {
                if (val === null || val === undefined) return '';
                const str = String(val).replace(/"/g, '""'); // Escape double quotes
                if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                    return `"${str}"`;
                }
                return str;
            };

            const link = `https://www.${c.platform}.com/${c.handle?.replace('@', '')}`;

            const row = [
                clean(c.name || c.full_name),
                clean(c.handle),
                clean(c.platform),
                clean(c.followers),
                clean((c.engagement_rate * 100).toFixed(2) + '%'),
                clean(c.email),
                clean(c.location),
                clean(c.niche),
                clean(link)
            ];
            csvRows.push(row.join(','));
        }

        const csvString = csvRows.join('\n');

        // Return as downloadable file response
        return new NextResponse(csvString, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="verality_creators_export_${new Date().toISOString().split('T')[0]}.csv"`,
            }
        });

    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
