# 🚨 URGENT: Fix Stripe Webhook Now

## ✅ Code Fix: DONE ✓

The code has been updated and deployed. Now you need to update Stripe settings.

---

## 🎯 ACTION REQUIRED (2 minutes)

### Step 1: Go to Stripe Dashboard
👉 **[Click here to open Stripe Webhooks](https://dashboard.stripe.com/webhooks)**

### Step 2: Update Webhook URL

Find your webhook endpoint and:

1. Click the **"..."** menu
2. Click **"Update details"**
3. Change the URL to **EXACTLY**:
   ```
   https://verality.io/api/webhooks/stripe
   ```
   ⚠️ **CRITICAL**: NO trailing slash at the end!

4. Click **"Save"**

### Step 3: Test It

1. In Stripe Dashboard, click on your webhook
2. Click **"Send test webhook"**
3. Select `checkout.session.completed`
4. Click **"Send test webhook"**
5. ✅ Should see **200 OK** (not 307!)

---

## 🔍 What Was Fixed

### Files Updated:
- ✅ `next.config.js` - Disabled trailing slash redirects
- ✅ `vercel.json` - Added webhook routing rules
- ✅ Pushed to GitHub
- ✅ Vercel will auto-deploy

### The Problem:
```
Stripe → https://verality.io/api/webhooks/stripe
       → 307 Redirect (WRONG!)
       → Webhook fails
```

### The Solution:
```
Stripe → https://verality.io/api/webhooks/stripe
       → 200 OK (CORRECT!)
       → Webhook processes
       → User account updated
```

---

## ⏱️ Timeline

1. **Now**: Vercel is deploying the fix (takes ~2 minutes)
2. **You**: Update webhook URL in Stripe (takes 30 seconds)
3. **Test**: Send test webhook (takes 10 seconds)
4. **Done**: Webhooks working! ✅

---

## 🧪 How to Verify It's Fixed

### Before Fix:
- ❌ 307 Temporary Redirect
- ❌ Webhook retries fail
- ❌ User accounts not updated

### After Fix:
- ✅ 200 OK response
- ✅ Webhook processes successfully
- ✅ User accounts updated in Firestore
- ✅ Plans and quotas set correctly

---

## 📞 If Still Having Issues

1. **Wait 2-3 minutes** for Vercel deployment to complete
2. **Check deployment**: [Vercel Dashboard](https://vercel.com/dashboard)
3. **Verify URL has NO trailing slash**
4. **Try deleting and recreating the webhook** in Stripe

---

## 🎯 Quick Checklist

- [ ] Wait for Vercel deployment to finish (~2 min)
- [ ] Go to Stripe Webhooks dashboard
- [ ] Update webhook URL (remove trailing slash)
- [ ] Send test webhook
- [ ] Verify 200 OK response
- [ ] Done! ✅

---

**Next**: Update the webhook URL in Stripe Dashboard now!

👉 **[Open Stripe Webhooks](https://dashboard.stripe.com/webhooks)**
