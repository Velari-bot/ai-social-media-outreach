import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');

    return NextResponse.json({
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'MISSING',
        allHeaders: Object.fromEntries(req.headers.entries()),
        url: req.url,
        method: req.method
    });
}
