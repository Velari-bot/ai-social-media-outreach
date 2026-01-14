
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        console.log("Starting fix-price-bug script...");

        // 1. Get all users with 'pro' plan
        const usersRef = db.collection('user_accounts');
        const snapshot = await usersRef.where('plan', '==', 'pro').get();

        if (snapshot.empty) {
            return NextResponse.json({ success: true, message: 'No pro users found to check.' });
        }

        let fixedCount = 0;
        const batch = db.batch();

        snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Check if they have a Stripe Subscription ID
            // Ideally, real paid users MUST have this field populated by the webhook.
            // Users created by the bug (signup default) won't have it.
            // We also check for 'stripeCustomerId' just in case.
            const hasStripe = data.stripeSubscriptionId || data.stripeCustomerId;

            // If no stripe info, and they are PRO, they are likely bugged.
            // EXCEPTION: Admins or manually granted users? 
            // - Admins usually don't have 'pro', they have 'enterprise' or implicit 'admin' role.
            // - Manual grants via Admin panel: Did they get stripeId? 
            //   In AdminUsers.tsx, handleUpdateUser doesn't add stripeId. 
            //   So if the Admin manually set them to Pro, they will be downgraded here!
            //   We should check if they were updated recently? Or if they are 'admin' role?

            if (!hasStripe && data.role !== 'admin') {
                // Determine if this looks like a bugged user.
                // The bug was "new signups get pro".
                // We can downgrade them to 'free'.
                const ref = usersRef.doc(doc.id);
                batch.update(ref, {
                    plan: 'free',
                    email_quota_daily: 0,
                    fix_downgraded_at: new Date().toISOString()
                });
                fixedCount++;
            }
        });

        if (fixedCount > 0) {
            await batch.commit();
        }

        console.log(`Downgraded ${fixedCount} users from Pro to Free.`);

        return NextResponse.json({
            success: true,
            message: `Fixed ${fixedCount} users.`,
            count: fixedCount
        });

    } catch (error: any) {
        console.error('Error fixing price bug:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
