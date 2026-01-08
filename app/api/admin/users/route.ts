
import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase-admin';

export async function GET() {
    try {
        // 1. List users from Firebase Auth
        const listUsersResult = await auth.listUsers(100);
        const authUsers = listUsersResult.users;

        // 2. Fetch profiles from Firestore 'user_accounts' (where ID matches Auth UID)
        // Since we can't easily query "where ID in [...]" for many IDs, and we want all relevant profiles,
        // we can fetch all user_accounts or just individual reads for the 100 users. 
        // Individual reads for 100 users is slow. Fetching all might be okay for small app.
        // Better: Fetch all `user_accounts` (assuming < 1000 active users for now) or parallel fetch.
        // Let's just fetch all user_accounts for now as the app is small.
        const profilesSnapshot = await db.collection('user_accounts').get();
        const profilesMap = new Map();
        profilesSnapshot.forEach(doc => {
            profilesMap.set(doc.id, doc.data());
        });

        // 3. Merge Data
        const users = authUsers.map(user => {
            const profile = profilesMap.get(user.uid) || {};

            return {
                id: user.uid,
                email: user.email || profile.email || 'No Email',
                displayName: user.displayName || profile.name || 'No Name',
                photoURL: user.photoURL,
                // Auth metadata
                lastSignInTime: user.metadata.lastSignInTime,
                creationTime: user.metadata.creationTime,
                // Firestore profile data
                role: profile.role || 'user',
                plan: profile.plan || 'free', // Defaults might change if we want 'pro'
                status: user.disabled ? 'disabled' : (profile.status || 'active'),
                emailQuota: profile.email_quota_daily || 0,
                emailsUsed: profile.email_used_today || 0,
                createdAt: user.metadata.creationTime, // Use Auth creation time as primary
            };
        });

        return NextResponse.json({ success: true, users });

    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch users: ' + error.message }, { status: 500 });
    }
}
