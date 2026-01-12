import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build';

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20' as any,
    typescript: true,
});

export const getStripePriceId = (planName: string) => {
    const key = `STRIPE_PRICE_${planName.toUpperCase().replace(' ', '_')}`;
    return process.env[key];
};
