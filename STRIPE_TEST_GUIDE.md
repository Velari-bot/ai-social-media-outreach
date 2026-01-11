# Stripe Testing Guide

## ✅ You're Already in Test Mode!

Your Stripe keys should be **test keys** (starting with `pk_test_` and `sk_test_`), which means:
- **No real charges** - All payments are simulated
- **Free to test** - Test as many times as you want
- **Use test card numbers** - Stripe provides special test cards

## 🧪 Option 1: Use Test Cards (100% Free)

You can test your entire payment flow **for free** using Stripe's test card numbers:

### Test Card Numbers

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | ✅ Successful payment |
| `4000 0025 0000 3155` | ✅ Requires 3D Secure authentication |
| `4000 0000 0000 9995` | ❌ Declined - insufficient funds |
| `4000 0000 0000 0002` | ❌ Declined - generic decline |

**For all test cards:**
- Expiration: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any ZIP code (e.g., `12345`)

### How to Test

1. Go to your pricing page: http://localhost:3000/pricing
2. Click "Get Started" on any plan
3. Use test card: `4242 4242 4242 4242`
4. Fill in any future expiration, any CVC, any ZIP
5. Complete checkout
6. Verify the webhook fires and updates your database

## 💰 Option 2: Create a $1 Test Product

If you want to test with a cheaper price point, create a special test product:

### Steps to Create $1 Test Product

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click **"Add product"**
3. Fill in:
   - **Name**: "Test Plan - $1"
   - **Description**: "For testing checkout flow"
   - **Pricing**: 
     - Model: Recurring
     - Price: $1.00
     - Billing period: Monthly
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_test_...`)
6. Add to your `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PRICE_TEST=price_test_xxxxx
   ```

### Add Test Plan to Your App

Add this to your `tiers` array in `app/pricing/page.tsx`:

```typescript
{
    name: "Test",
    price: 1,
    dailyLimit: 5,
    monthlyVolume: "150",
    costPerCreator: "0.01",
    description: "For testing checkout flow",
    bestFor: "development and testing",
    features: [
        "5 creators per day (≈ 150 / month)",
        "Test all features",
        "Verify webhook integration",
        "Check database updates"
    ]
}
```

## 🔍 Verify Test Mode

Check your `.env.local` file to confirm you're using test keys:

```bash
# Should start with pk_test_ and sk_test_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 📊 Monitor Test Payments

1. Go to [Stripe Dashboard - Payments](https://dashboard.stripe.com/test/payments)
2. You'll see all test transactions here
3. Check [Webhooks](https://dashboard.stripe.com/test/webhooks) to verify events are firing

## ⚠️ Important Notes

- **Test mode data is separate** from production
- **Test payments don't cost money** - they're simulated
- **Webhooks still fire** in test mode (use Stripe CLI for local testing)
- **You can delete test data** anytime without affecting production

## 🚀 Testing Checklist

- [ ] Verify using test API keys (pk_test_, sk_test_)
- [ ] Test successful payment with 4242 4242 4242 4242
- [ ] Verify webhook fires (check Stripe Dashboard > Webhooks)
- [ ] Confirm user plan updates in your database
- [ ] Test 3D Secure with 4000 0025 0000 3155
- [ ] Test declined card with 4000 0000 0000 9995
- [ ] Verify cancel flow works
- [ ] Check success redirect to dashboard

## 🔄 Switch to Production

When ready to go live:

1. Get production API keys from Stripe Dashboard
2. Update `.env.local` with `pk_live_` and `sk_live_` keys
3. Create production products and get their price IDs
4. Set up production webhook endpoint
5. Test with real card (or use $1 product first!)
