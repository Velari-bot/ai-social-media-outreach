import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/link-stripe
 * Attempts to find and link an existing Stripe customer by email
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;
        const userEmail = decodedToken.email;

        if (!userEmail) {
            return NextResponse.json({ error: 'No email found' }, { status: 400 });
        }

        // Check if user already has a Stripe customer ID
        const userDoc = await db.collection('user_accounts').doc(userId).get();
        const userData = userDoc.data();

        if (userData?.stripeCustomerId) {
            return NextResponse.json({
                success: true,
                message: 'User already linked to Stripe',
                customerId: userData.stripeCustomerId
            });
        }

        // Search for existing Stripe customer by email
        const customers = await stripe.customers.list({
            email: userEmail,
            limit: 1
        });

        if (customers.data.length > 0) {
            const customer = customers.data[0];

            // Link the customer to this user
            await db.collection('user_accounts').doc(userId).set({
                stripeCustomerId: customer.id,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // Update Stripe customer metadata with userId
            await stripe.customers.update(customer.id, {
                metadata: { userId }
            });

            // Check if customer has an active subscription
            const subscriptions = await stripe.subscriptions.list({
                customer: customer.id,
                status: 'active',
                limit: 1
            });

            if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0];
                const planName = subscription.metadata?.planName || 'pro';

                // Update user plan based on subscription
                const planQuotas: Record<string, number> = {
                    'basic': 50,
                    'pro': 100,
                    'growth': 200,
                    'scale': 400,
                    'custom': 1000
                };

                const normalizedPlan = planName.toLowerCase();
                const dailyQuota = planQuotas[normalizedPlan] || 100;

                await db.collection('user_accounts').doc(userId).set({
                    plan: normalizedPlan,
                    email_quota_daily: dailyQuota,
                    stripeSubscriptionId: subscription.id,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                return NextResponse.json({
                    success: true,
                    message: 'Stripe customer linked and subscription activated',
                    customerId: customer.id,
                    plan: normalizedPlan,
                    quota: dailyQuota
                });
            }

            return NextResponse.json({
                success: true,
                message: 'Stripe customer linked (no active subscription)',
                customerId: customer.id
            });
        }

        return NextResponse.json({
            success: true,
            message: 'No existing Stripe customer found',
            customerId: null
        });

    } catch (error: any) {
        console.error('Error linking Stripe customer:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
