import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

// Files to search specifically
const CSV_FILES = [
    'Cory Creators for Outreach - tiktok_profiles_173e41.csv',
    'CreatorZen x Beyond Vision - Sheet1.csv',
    'SG Medias Creators (real) - Sheet1.csv',
    'tiktok_profiles_c403ff (3).csv',
    'test list - Sheet1.csv'
];

interface CsvCreator {
    handle: string;
    name: string;
    platform: string;
    followers: number;
    picture: string;
}

// Helper to parse individual CSV line handling quotes
function parseCSVLine(text: string): string[] {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell.trim());
    return result;
}

function cleanHandle(raw: string): string {
    if (!raw) return '';
    let handle = raw.trim();
    // Remove URL parts if present
    if (handle.includes('tiktok.com/')) handle = handle.split('tiktok.com/')[1] || '';
    if (handle.includes('instagram.com/')) handle = handle.split('instagram.com/')[1] || '';
    if (handle.includes('youtube.com/')) handle = handle.split('youtube.com/')[1] || '';

    // Remove query params
    if (handle.includes('?')) handle = handle.split('?')[0];

    // Remove trailing slash
    handle = handle.replace(/\/$/, '');

    // Ensure @ prefix
    if (!handle.startsWith('@')) handle = '@' + handle;

    return handle;
}

function parseFollowers(raw: string | undefined): number {
    if (!raw) return 0;
    // Remove quotes, commas
    const clean = raw.replace(/["',]/g, '').toLowerCase().trim();
    if (clean.includes('k')) return parseFloat(clean) * 1000;
    if (clean.includes('m')) return parseFloat(clean) * 1000000;
    return parseInt(clean) || 0;
}

function searchCSVs(query: string): CsvCreator[] {
    const results: CsvCreator[] = [];
    const lowerQuery = query.toLowerCase();

    for (const file of CSV_FILES) {
        try {
            const filePath = path.join(process.cwd(), 'public', file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            if (lines.length < 2) continue;

            // Simple header analysis
            const headerRow = parseCSVLine(lines[0].toLowerCase());

            // Find reliable column indices
            const colHandle = headerRow.findIndex(h => h.includes('username') || h.includes('profile link') || h.includes('creator link') || (h.includes('tiktok') && h.includes('http')));
            // Fallback for SG Medias which has 'Creator' as name but link in 'tiktok'
            const colLink = headerRow.findIndex(h => h === 'tiktok' || h.includes('profile link') || h.includes('creator link'));

            const colName = headerRow.findIndex(h => h.includes('name') || h.includes('nickname') || h === 'creator');
            const colFollowers = headerRow.findIndex(h => h.includes('followers'));

            // Iterate rows
            // Limit strictness to keep it fast, but loop all matches
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = parseCSVLine(lines[i]);

                let handleRaw = '';
                // Try specific column first, then link column
                if (colHandle !== -1) handleRaw = cols[colHandle];
                else if (colLink !== -1) handleRaw = cols[colLink];

                // Special case for SG Medias: 'tiktok' column contains link
                if (file.includes('SG Medias') && colLink !== -1) handleRaw = cols[colLink];

                const handle = cleanHandle(handleRaw);
                const name = colName !== -1 ? cols[colName]?.replace(/^"|"$/g, '') || handle : handle;

                // Match check
                if (handle.toLowerCase().includes(lowerQuery) || name.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        handle,
                        name,
                        platform: handleRaw.includes('instagram') ? 'instagram' : handleRaw.includes('youtube') ? 'youtube' : 'tiktok',
                        followers: colFollowers !== -1 ? parseFollowers(cols[colFollowers]) : 0,
                        picture: '/placeholder-user.jpg' // CSVs don't usually have imgs
                    });
                }

                if (results.length >= 20) break; // Optimization per file
            }
        } catch (e) {
            console.error(`Error reading csv ${file}:`, e);
        }
        if (results.length >= 50) break; // Total limit
    }
    return results;
}

// Public API to search creators from internal DB + CSVs
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q')?.toLowerCase();

        if (!query || query.length < 2) {
            return NextResponse.json({ creators: [] });
        }

        // 1. Search Firebase (as before)
        const creatorsRef = db.collection('creators');
        const snapshot = await creatorsRef
            .where('handle', '>=', query)
            .where('handle', '<=', query + '\uf8ff')
            .limit(5)
            .get();

        const firebaseCreators = snapshot.docs.map(doc => {
            const data = doc.data();
            const basicData = data.basic_profile_data || {};
            return {
                id: doc.id,
                handle: data.handle,
                platform: data.platform,
                name: basicData.fullname || basicData.full_name || data.handle,
                picture: basicData.picture || basicData.profile_pic_url || '/placeholder-user.jpg',
                followers: basicData.followers || basicData.follower_count || 0,
                engagement_rate: basicData.engagement_rate || 0,
                is_verified: basicData.is_verified || false,
                locked_info: true
            };
        });

        // 2. Search CSVs
        const csvCreators = searchCSVs(query).map((c, i) => ({
            id: `csv-${c.handle}-${i}`,
            handle: c.handle,
            platform: c.platform,
            name: c.name,
            picture: c.picture,
            followers: c.followers,
            engagement_rate: 0,
            is_verified: false,
            locked_info: true
        }));

        // 3. Merge and Deduplicate
        // Prioritize Firebase results
        const allCreators = [...firebaseCreators];
        const seenHandles = new Set(firebaseCreators.map(c => c.handle.toLowerCase()));

        for (const c of csvCreators) {
            if (!seenHandles.has(c.handle.toLowerCase())) {
                allCreators.push(c);
                seenHandles.add(c.handle.toLowerCase());
            }
        }

        return NextResponse.json({ creators: allCreators.slice(0, 20) });
    } catch (error) {
        console.error('Error in public creator search:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
