import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/firebase-admin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    const session = event.data.object as any;

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                // Payment is successful and the subscription is created.
                // You should provision the subscription and save the customer ID to your database.
                const userId = session.metadata?.userId;
                const planName = session.metadata?.planName;
                const customerId = session.customer;
                const subscriptionId = session.subscription;

                if (userId) {
                    // Define quotas based on plan name (matching pricing tiers)
                    const planQuotas: Record<string, number> = {
                        'basic': 50,
                        'pro': 100,
                        'growth': 200,
                        'scale': 400,
                        'custom': 1000 // Placeholder for custom
                    };

                    const normalizedPlan = planName?.toLowerCase() || 'pro';
                    const dailyQuota = planQuotas[normalizedPlan] || 50;

                    // Update user in Firestore
                    await db.collection('user_accounts').doc(userId).set({
                        plan: normalizedPlan,
                        email_quota_daily: dailyQuota,
                        stripeCustomerId: customerId,
                        stripeSubscriptionId: subscriptionId,
                        updatedAt: new Date().toISOString(),
                    }, { merge: true });

                    // Also update Stripe Customer metadata so future webhooks (like deletion) know the userId
                    if (customerId) {
                        await stripe.customers.update(customerId as string, {
                            metadata: { userId }
                        });
                    }

                    // --- AFFILIATE TRACKING ---
                    const referralCode = session.metadata?.referralCode;
                    if (referralCode) {
                        // Amount is in cents, need to convert to dollars
                        const amountPaid = (session.amount_total || 0) / 100;
                        if (amountPaid > 0) {
                            const { trackAffiliateConversion } = await import('@/lib/database');
                            await trackAffiliateConversion(referralCode, amountPaid, session.id);
                        }
                    }

                    console.log(`Updated user ${userId} to plan ${planName} with quota ${dailyQuota}`);
                }
                break;

            case 'customer.subscription.deleted':
                // Handle subscription cancellation
                const subDeleted = event.data.object as Stripe.Subscription;
                const customerDeleted = await stripe.customers.retrieve(subDeleted.customer as string) as Stripe.Customer;
                const userIdDeleted = customerDeleted.metadata?.userId;

                if (userIdDeleted) {
                    await db.collection('user_accounts').doc(userIdDeleted).set({
                        plan: 'free',
                        email_quota_daily: 0,
                        updatedAt: new Date().toISOString(),
                    }, { merge: true });
                    console.log(`User ${userIdDeleted} subscription deleted. Quota reset to 0.`);
                }
                break;

            case 'customer.subscription.updated':
                // Handle plan changes or renewals if needed
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
