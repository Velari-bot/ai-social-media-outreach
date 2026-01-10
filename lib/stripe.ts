import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as any, // Use the latest API version you're comfortable with
    typescript: true,
});

export const getStripePriceId = (planName: string) => {
    const key = `STRIPE_PRICE_${planName.toUpperCase().replace(' ', '_')}`;
    return process.env[key];
};
