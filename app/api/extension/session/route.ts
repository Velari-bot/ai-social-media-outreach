import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { signExtensionToken } from '@/lib/extension-auth';

export async function GET(req: NextRequest) {
    try {
        // Check if user is logged in via cookies (same as website)
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json({
                error: 'Not authenticated',
                details: 'Please log in to verality.io first'
            }, { status: 401 });
        }

        // Generate extension JWT for this user
        const token = await signExtensionToken({
            userId: user.uid,
            email: user.email || 'unknown@verality.io'
        });

        return NextResponse.json({
            token,
            user: {
                email: user.email,
                userId: user.uid
            }
        });
    } catch (error) {
        console.error('[Extension Session] Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error'
        }, { status: 500 });
    }
}
