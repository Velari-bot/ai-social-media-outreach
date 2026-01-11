# Stripe Webhook 307 Redirect Fix

## 🔴 Problem

Stripe webhooks are failing with **307 Temporary Redirect** errors when hitting:
```
https://verality.io/api/webhooks/stripe
```

This happens because:
1. Next.js may be redirecting the URL (trailing slash issues)
2. Vercel may be applying redirects
3. The webhook endpoint needs to respond directly without redirects

---

## ✅ Solution Applied

### 1. Updated `next.config.js`
Added configuration to prevent trailing slash redirects:

```javascript
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,              // Disable trailing slashes
  skipTrailingSlashRedirect: true,   // Skip redirect middleware
};
```

### 2. Created `vercel.json`
Added Vercel configuration to ensure proper routing:

```json
{
  "rewrites": [
    {
      "source": "/api/webhooks/stripe",
      "destination": "/api/webhooks/stripe"
    }
  ],
  "headers": [
    {
      "source": "/api/webhooks/stripe",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## 🔧 Steps to Fix in Stripe Dashboard

### Option 1: Update Webhook URL (Recommended)

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Find your webhook endpoint
3. Click **"..."** → **"Update details"**
4. Change URL to **exactly**:
   ```
   https://verality.io/api/webhooks/stripe
   ```
   ⚠️ **Important**: No trailing slash!

5. Save changes

### Option 2: Delete and Recreate Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Delete the existing webhook
3. Click **"Add endpoint"**
4. Enter URL: `https://verality.io/api/webhooks/stripe`
5. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.updated`
6. Click **"Add endpoint"**
7. Copy the new **Signing secret** (starts with `whsec_`)
8. Update your environment variables:
   - Vercel: Add `STRIPE_WEBHOOK_SECRET` in project settings
   - Local: Update `.env.local`

---

## 🧪 Test the Webhook

### Using Stripe Dashboard

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Click **"Send test webhook"**
6. Should see **200 OK** response (not 307)

### Using Stripe CLI

```bash
# Forward webhooks to production
stripe listen --forward-to https://verality.io/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 🔍 Verify Fix

After deploying the changes:

1. **Check Vercel Deployment**
   - Ensure `next.config.js` and `vercel.json` are deployed
   - Check deployment logs for any errors

2. **Test Webhook Endpoint**
   ```bash
   curl -X POST https://verality.io/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```
   - Should return **400** (signature verification failed) - this is GOOD!
   - Should NOT return **307**

3. **Monitor Stripe Events**
   - Go to [Stripe Events](https://dashboard.stripe.com/events)
   - Watch for new webhook attempts
   - Should see **200 OK** responses

---

## 🚨 Common Issues

### Still Getting 307?

1. **Clear Vercel Cache**
   - Redeploy the project
   - Or use "Redeploy" button in Vercel dashboard

2. **Check URL Exactly**
   - No trailing slash: ✅ `https://verality.io/api/webhooks/stripe`
   - With trailing slash: ❌ `https://verality.io/api/webhooks/stripe/`

3. **Verify Deployment**
   - Check that `next.config.js` changes are live
   - Check that `vercel.json` is in the deployment

### Getting 500 Errors?

1. **Check Webhook Secret**
   - Ensure `STRIPE_WEBHOOK_SECRET` is set in Vercel
   - Must match the signing secret from Stripe Dashboard

2. **Check Logs**
   - Vercel Dashboard → Your Project → Logs
   - Look for webhook errors

### Getting 400 Errors?

This is actually good if you're testing manually! It means:
- ✅ Endpoint is reachable (no 307)
- ✅ Code is running
- ❌ Signature verification failed (expected for manual tests)

Real Stripe webhooks will have valid signatures and work fine.

---

## 📋 Deployment Checklist

Before testing:

- [ ] `next.config.js` updated with redirect prevention
- [ ] `vercel.json` created with webhook routing
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] Webhook URL in Stripe has NO trailing slash
- [ ] `STRIPE_WEBHOOK_SECRET` set in Vercel environment variables
- [ ] Test webhook sent from Stripe Dashboard
- [ ] Response is 200 OK (not 307)

---

## 🎯 Expected Behavior

### Before Fix
```
POST https://verality.io/api/webhooks/stripe
→ 307 Temporary Redirect
→ Stripe retries
→ Still 307
→ Webhook fails
```

### After Fix
```
POST https://verality.io/api/webhooks/stripe
→ 200 OK
→ Webhook processed
→ User account updated in Firestore
```

---

## 🔄 Next Steps

1. **Commit and push** the changes:
   ```bash
   git add next.config.js vercel.json
   git commit -m "Fix Stripe webhook 307 redirect issue"
   git push
   ```

2. **Wait for Vercel deployment** to complete

3. **Update Stripe webhook URL** (remove trailing slash if present)

4. **Test webhook** from Stripe Dashboard

5. **Monitor events** to confirm 200 OK responses

---

## 📞 Support

If still having issues:

1. Check Vercel deployment logs
2. Check Stripe webhook logs
3. Verify environment variables are set
4. Try deleting and recreating the webhook in Stripe

---

**Status**: ✅ Fix applied, ready to deploy and test
