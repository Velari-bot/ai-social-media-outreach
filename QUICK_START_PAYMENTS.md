# 🚀 Quick Start: Payment Processing Setup

## ✅ What's Already Done

Your payment processing system is **fully coded and ready**. All you need to do is configure your Stripe account and add the API keys.

---

## 🎯 5-Minute Setup

### Step 1: Get Stripe API Keys (2 minutes)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **"Developers"** in the top menu
3. Click **"API keys"** in the left sidebar
4. Make sure you're in **"Test mode"** (toggle in top right)
5. Copy these two keys:
   - **Secret key** (starts with `sk_test_`)
   - **Publishable key** (starts with `pk_test_`)

### Step 2: Create Products (2 minutes)

1. Go to [Products](https://dashboard.stripe.com/test/products)
2. Click **"Add product"** and create these 4 products:

| Product Name | Price | Billing |
|-------------|-------|---------|
| Basic Plan | $400 | Monthly |
| Pro Plan | $600 | Monthly |
| Growth Plan | $900 | Monthly |
| Scale Plan | $1500 | Monthly |

3. After creating each product, **copy the Price ID** (starts with `price_`)

### Step 3: Add to .env.local (1 minute)

Open `.env.local` and add:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Price IDs (from Step 2)
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_YOUR_BASIC_ID
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_YOUR_PRO_ID
NEXT_PUBLIC_STRIPE_PRICE_GROWTH=price_YOUR_GROWTH_ID
NEXT_PUBLIC_STRIPE_PRICE_SCALE=price_YOUR_SCALE_ID
```

### Step 4: Verify Setup

```bash
# Run verification script
node verify-stripe-setup.js
```

You should see: **"🎉 Perfect! Your Stripe integration is fully configured!"**

---

## 🧪 Test Payment (Optional)

### Option A: Use Test Cards (FREE)

1. Start server: `npm run dev`
2. Go to: `http://localhost:3000/pricing`
3. Click **"Get Started"** on any plan
4. Use test card: `4242 4242 4242 4242`
5. Expiration: `12/34`, CVC: `123`, ZIP: `12345`

**Note**: This is 100% free - no real money charged!

### Option B: Create $1 Test Plan

If you want to test with a cheaper amount:

1. Create a new product in Stripe: **"Test Plan - $1"**
2. Price: **$1.00/month**
3. Copy the Price ID
4. Add to `.env.local`: `NEXT_PUBLIC_STRIPE_PRICE_TEST=price_xxxxx`

---

## 🔄 Webhook Setup (For Full Testing)

Webhooks allow Stripe to notify your app when payments succeed.

### Local Development

```bash
# Install Stripe CLI (one-time)
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook secret like `whsec_xxxxx`. Add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Production (When Deploying)

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **"Add endpoint"**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `customer.subscription.deleted`
5. Copy the **Signing secret** and add to `.env.local`

---

## ✅ Verification Checklist

Run through this checklist to ensure everything is working:

- [ ] Stripe API keys are in `.env.local`
- [ ] All 4 price IDs are in `.env.local`
- [ ] Verification script passes: `node verify-stripe-setup.js`
- [ ] Dev server is running: `npm run dev`
- [ ] Can access pricing page: `http://localhost:3000/pricing`
- [ ] Test payment completes successfully
- [ ] Redirected to dashboard after payment
- [ ] Credits show correct quota in dashboard

---

## 📚 Documentation Files

- **`PAYMENT_SETUP_COMPLETE.md`** - Comprehensive setup guide
- **`STRIPE_EMAIL_FIX_GUIDE.md`** - Email linking documentation
- **`STRIPE_TEST_GUIDE.md`** - Testing instructions
- **`.env.example`** - All required environment variables

---

## 🆘 Troubleshooting

### "Price ID not found" error
- Make sure all price IDs are in `.env.local`
- Restart dev server after adding variables

### Webhook not firing
- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Add webhook secret to `.env.local`
- Restart dev server

### Payment succeeds but plan not updating
- Check webhook is configured correctly
- Check server logs for errors
- Verify Firestore rules allow writes to `user_accounts`

---

## 🎉 You're Ready!

Your payment processing is fully set up. Just add your Stripe keys and you're good to go!

**Next Steps:**
1. Add Stripe keys to `.env.local`
2. Run `node verify-stripe-setup.js`
3. Test a payment with test card `4242 4242 4242 4242`
4. Deploy and switch to live mode when ready!

---

**Need help?** Check `PAYMENT_SETUP_COMPLETE.md` for detailed instructions.
