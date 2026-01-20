import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';
import { signExtensionToken } from '@/lib/extension-auth';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
    try {
        // We need to verify the user session. 
        // In Next.js with Firebase, we usually use cookies or an Authorization header.
        // If the user just logged in, they should have a session cookie or we can check the ID token if passed.

        // For simplicity, if this is called from the frontend page, 
        // we might need to rely on the Firebase Admin SDK checking the session.

        // Attempt to get token from header or cookie
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Firebase ID Token
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;
        const email = decodedToken.email || '';

        // Generate extension JWT
        const extensionToken = await signExtensionToken({ userId, email });

        return NextResponse.json({ token: extensionToken });
    } catch (error: any) {
        console.error('Error generating extension token:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
