---
description: Guide for setting up Stripe Webhooks for Production
---

# Stripe Production Webhook Setup Guide

This guide details how to configure Stripe webhooks for your production environment to handle subscriptions and payments automatically.

## 1. Get Your Production URL
Ensure you know your deployed application's domain.
Example: `https://app.verality.ai` or `https://your-project.vercel.app`

## 2. Configure Stripe Dashboard
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle the "Test mode" switch to **Live** (top right) if you are ready for real payments, or keep it in **Test** for final validation.
3. Go to **Developers** > **Webhooks**.
4. Click **Add endpoint**.

## 3. Add Endpoint Details
- **Endpoint URL**: `https://<YOUR_DOMAIN>/api/webhooks/stripe`
  - *Example*: `https://app.verality.ai/api/webhooks/stripe`
- **Description**: "Production Webhook"
- **Events to send**: Search for and select the following events:
  - `checkout.session.completed` (Critical: Handles new subscriptions)
  - `customer.subscription.deleted` (Critical: Handles cancellations)
  - `customer.subscription.updated` (Optional: Handles plan changes)
  - `invoice.payment_succeeded` (Optional: Good for tracking recurring renewals)

5. Click **Add endpoint**.

## 4. Get Webhook Secret
Once created, you will see the webhook details page.
1. Look for **Signing secret** (it starts with `whsec_...`).
2. Click **Reveal**.
3. Copy this secret.

## 5. Update Environment Variables
You need to update your production environment variables (e.g., in Vercel Project Settings) with the Live keys.

| Variable Name | Value Format | Source |
| :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Developers > Webhooks (From Step 4) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Developers > API keys |

> **Important**: Do not put these in your `.env.local` if you are deploying. Add them to your hosting provider's environment variable settings.

## 6. Verify Code Logic
Your webhook handler is located at `app/api/webhooks/stripe/route.ts`.
It currently handles:
- **`checkout.session.completed`**: Provisions the subscription and updates the user's quota in Firebase.
  - *Note*: It expects `metadata.userId` and `metadata.planName` to be passed during checkout session creation.
- **`customer.subscription.deleted`**: Downgrades the user to the 'free' plan and resets quota.

## 7. Testing Locally (Optional)
If you want to test with real Stripe events locally before deploying:
1. Install Stripe CLI.
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. It will give you a temporary `whsec_...` for testing. Put this in your `.env.local` as `STRIPE_WEBHOOK_SECRET`.
