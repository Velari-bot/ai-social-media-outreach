# Stripe Setup Guide
## 1. Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/).
2. Click **Developers** -> **API keys**.
3. Copy **Publishable key** and **Secret key**.

## 2. Update .env.local
Add these keys to your `.env.local`:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 3. Create Products & Prices
You need to create the Products in Stripe to match your Pricing Page.
For each plan (Basic, Pro, Growth, Scale), do the following:

1. Go to **Product Catalog** -> **Add product**.
2. **Name**: e.g., "Basic Plan"
3. **Price**: $400 / month (Recurring)
4. Save the product.
5. Copy the **Price ID** (starts with `price_...`).

## 4. Add Price IDs to .env.local
Map the Price IDs to the environment variables expected by the code:

```env
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_GROWTH=price_...
NEXT_PUBLIC_STRIPE_PRICE_SCALE=price_...
```

## 5. Setting up Webhooks (MANDATORY for syncing plans)
To make sure your users' plans actually update in the database after they pay, you MUST set up a webhook.

### Testing Locally
1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Run `stripe login`.
3. Start forwarding webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the **webhook signing secret** (it starts with `whsec_...`).
5. Add it to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Production Setup
1. Go to **Developers** -> **Webhooks** in Stripe Dashboard.
2. Click **Add an endpoint**.
3. **Endpoint URL**: `https://your-domain.com/api/webhooks/stripe`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the Signing Secret and add it to your production environment variables.
