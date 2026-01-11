import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { priceId, planName, userId, userEmail } = await req.json();

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        // Determine success/cancel URLs based on current origin
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const sessionConfig: any = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing`,
            metadata: {
                planName: planName,
                userId: userId || '',
            },
            allow_promotion_codes: true,
            billing_address_collection: 'required',
        };

        // If we have a user email, pre-fill it in the checkout
        if (userEmail) {
            sessionConfig.customer_email = userEmail;
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
