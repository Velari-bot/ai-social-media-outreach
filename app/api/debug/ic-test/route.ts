import { NextRequest, NextResponse } from 'next/server';
import { influencerClubClient } from '@/lib/services/influencer-club-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || 'instagram';
    const niche = searchParams.get('niche') || 'fitness';
    const keyword = searchParams.get('keyword') || niche;

    const results = {
        config: { platform, niche, keyword },
        tests: [] as any[]
    };

    // TEST 1: Current Client Implementation
    try {
        console.log("--- TEST 1: Client Implementation ---");
        const creators = await influencerClubClient.discoverCreators({
            platform: platform as any,
            filters: {
                niche: niche,
                min_followers: 10000,
                max_followers: 500000
            },
            limit: 5
        });
        results.tests.push({
            name: "Current Client Code",
            status: "success",
            count: creators.length,
            sample: creators[0] || null
        });
    } catch (e: any) {
        results.tests.push({
            name: "Current Client Code",
            status: "error",
            error: e.toString()
        });
    }

    // TEST 2: Raw Fetch - Flat Structure (What we currently assume)
    try {
        console.log("--- TEST 2: Raw Fetch Flat ---");
        const body = {
            platform: platform,
            limit: 5,
            min_followers: 10000,
            niche: niche,
            keyword: keyword,
            sort_by: "relevancy",
            sort_order: "desc"
        };

        const res = await fetch('https://api-dashboard.influencers.club/public/v1/discovery/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.INFLUENCER_CLUB_API_KEY || ''
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        results.tests.push({
            name: "Raw Flat Payload",
            sentBody: body,
            status: res.status,
            total: data.total,
            accountsCount: data?.accounts?.length,
            sample: data?.accounts?.[0]?.profile?.username
        });
    } catch (e: any) {
        results.tests.push({
            name: "Raw Flat Payload",
            status: "error",
            error: e.toString()
        });
    }

    // TEST 3: Raw Fetch - Nested 'filters' (Alternative hypothesis)
    try {
        console.log("--- TEST 3: Raw Fetch Nested ---");
        const body = {
            paging: { limit: 5, offset: 0 },
            filters: {
                platform: platform,
                niche: niche,
                keywords: [keyword],
                followers: { min: 10000 }
            },
            sort: { field: "relevancy", order: "desc" }
        };

        const res = await fetch('https://api-dashboard.influencers.club/public/v1/discovery/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.INFLUENCER_CLUB_API_KEY || ''
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        results.tests.push({
            name: "Raw Nested Payload",
            sentBody: body,
            status: res.status,
            total: data.total,
            accountsCount: data?.accounts?.length,
        });
    } catch (e: any) {
        results.tests.push({
            name: "Raw Nested Payload",
            status: "error",
            error: e.toString()
        });
    }

    // TEST 4: Raw Fetch - 'category' instead of niche
    try {
        console.log("--- TEST 4: Category Payload ---");
        const body = {
            platform: platform,
            limit: 5,
            min_followers: 10000,
            category: niche,
            sort_by: "relevancy",
            sort_order: "desc"
        };

        const res = await fetch('https://api-dashboard.influencers.club/public/v1/discovery/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.INFLUENCER_CLUB_API_KEY || ''
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        results.tests.push({
            name: "Category Payload",
            sentBody: body,
            status: res.status,
            total: data.total,
            accountsCount: data?.accounts?.length,
        });
    } catch (e: any) {
        results.tests.push({
            name: "Category Payload",
            status: "error",
            error: e.toString()
        });
    }

    // TEST 5: Broad Search (Empty Niche)
    try {
        console.log("--- TEST 5: Broad Search (Empty Niche) ---");
        const body = {
            platform: platform,
            limit: 5,
            offset: 0,
            filters: {
                min_followers: 10000,
                max_followers: 500000
            }
        };

        const res = await fetch('https://api-dashboard.influencers.club/public/v1/discovery/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.INFLUENCER_CLUB_API_KEY || ''
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        results.tests.push({
            name: "Broad Search (Empty Niche)",
            sentBody: body,
            status: res.status,
            total: data.total,
            accountsCount: data?.accounts?.length,
            sample: data?.accounts?.[0]?.profile?.username
        });
    } catch (e: any) {
        results.tests.push({
            name: "Broad Search (Empty Niche)",
            status: "error",
            error: e.toString()
        });
    }

    return NextResponse.json(results);
}
