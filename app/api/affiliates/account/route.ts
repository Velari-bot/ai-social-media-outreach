
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAffiliateAccount, createAffiliateAccount } from '@/lib/database';
// Ensure firebase-admin is initialized
import '@/lib/firebase-admin';

async function verifyAuth(request: NextRequest) {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) return null;

    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Auth verification failed:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const account = await getAffiliateAccount(user.uid);
        return NextResponse.json({ success: true, account });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Use email from token if possible, or body
        const email = user.email || body.email;

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const account = await createAffiliateAccount(user.uid, email);
        return NextResponse.json({ success: true, account });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
