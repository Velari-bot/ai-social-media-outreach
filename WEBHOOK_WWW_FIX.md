# 🚨 CRITICAL: Stripe Webhook www Redirect Issue

## 🔴 The Real Problem

Your webhook is failing because of a **www redirect**:

```
Stripe sends to:     https://verality.io/api/webhooks/stripe
Your server redirects to: https://www.verality.io/api/webhooks/stripe
Result: 307 Temporary Redirect → FAIL
```

---

## ✅ SOLUTION (Choose One)

### Option 1: Update Stripe to Use www (RECOMMENDED)

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Click **"..."** → **"Update details"**
4. Change URL to:
   ```
   https://www.verality.io/api/webhooks/stripe
   ```
   ⚠️ **Note the `www.`**

5. Click **"Save"**
6. Click **"Send test webhook"**
7. Should see **200 OK**

### Option 2: Configure Vercel to Not Redirect

If you want to use the non-www domain:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Find `verality.io`
5. Click **"..."** → **"Edit"**
6. Set as **Primary Domain** (this prevents www redirect)
7. Save changes
8. Redeploy your project

---

## 🎯 Quick Fix (Do This Now!)

**The fastest solution is to update Stripe:**

1. **Open Stripe**: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

2. **Update webhook URL to**:
   ```
   https://www.verality.io/api/webhooks/stripe
   ```

3. **Test it** - Should work immediately!

---

## 🔍 How to Check Which Domain to Use

Run this command to see where your site responds:

```bash
# Test non-www
curl -I https://verality.io/api/webhooks/stripe

# Test www
curl -I https://www.verality.io/api/webhooks/stripe
```

Use whichever one returns **200** or **400** (not 307).

---

## ✅ After Fixing

Once you update the webhook URL, test it:

1. In Stripe Dashboard, click your webhook
2. Click **"Send test webhook"**
3. Select `checkout.session.completed`
4. Click **"Send test webhook"**
5. ✅ Should see **200 OK** response

---

## 📊 Expected vs Actual

### Current (BROKEN):
```
Stripe → https://verality.io/api/webhooks/stripe
       → 307 Redirect to www.verality.io
       → Stripe fails (doesn't follow redirects)
```

### After Fix (WORKING):
```
Stripe → https://www.verality.io/api/webhooks/stripe
       → 200 OK
       → Webhook processes
       → User account updated
```

---

## 🚀 Action Required

**Update your Stripe webhook URL to include `www.` now!**

👉 [Open Stripe Webhooks](https://dashboard.stripe.com/webhooks)

Change from:
```
https://verality.io/api/webhooks/stripe
```

To:
```
https://www.verality.io/api/webhooks/stripe
```

**This will fix the issue immediately!** ✅
