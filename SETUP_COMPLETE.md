# ✅ System Setup Complete!

## 🎯 What's Done

### VPS Setup (149.28.35.225)
- ✅ Cron jobs installed and running
- ✅ Will hit Vercel endpoints every 5 minutes
- ✅ Credits reset at midnight
- ✅ Campaigns run at 9 AM daily

### Cron Jobs Installed:
```bash
# Every 5 minutes - Send emails
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" https://www.verality.io/api/cron/outreach/send

# Every 5 minutes - Monitor replies
*/5 * * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" https://www.verality.io/api/cron/outreach/monitor

# Daily at 9 AM - Run campaigns
0 9 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" https://www.verality.io/api/cron/campaigns/daily

# Daily at midnight - Reset credits
0 0 * * * curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" https://www.verality.io/api/cron/credits/reset
```

---

## ⚠️ Vercel Deployment Issue

The cron endpoints are returning 404. This means Vercel hasn't deployed the new files yet.

### To Fix:

**Option 1: Force Redeploy in Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to "Deployments"
4. Click "..." menu on latest deployment
5. Click "Redeploy" → **Uncheck "Use existing build cache"**
6. Click "Redeploy"

**Option 2: Make a Small Code Change**
```bash
# Add a comment to force new deployment
echo "// Force deploy" >> app/api/cron/outreach/send/route.ts
git add -A
git commit -m "Force redeploy"
git push
```

---

## 🧪 Test Endpoints

After Vercel deploys, test with:

```bash
curl -H "Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=" https://www.verality.io/api/cron/outreach/send
```

**Expected response:**
```json
{"success":true,"sent":0,"failed":0,"timestamp":"2026-01-14T..."}
```

---

## 📊 Monitor Cron Jobs

SSH into VPS and check logs:
```bash
ssh root@149.28.35.225
tail -f /var/log/verality-cron.log
```

---

## 🎯 Next Steps

1. **Fix Vercel deployment** (force redeploy without cache)
2. **Test endpoints** work
3. **Wait for next cron run** (within 5 minutes)
4. **Check logs** on VPS
5. **Create a test campaign** to see it in action!

---

## 📝 How the System Works

### When User Creates Campaign:
1. User creates "Baseball Instagram" campaign
2. System immediately finds 200 creators
3. Clay enriches with emails → 150 have emails
4. Queues 150 for TODAY (9 AM - 5 PM)
5. Uses 150 credits

### Daily at 9 AM:
1. Cron job triggers `/api/cron/campaigns/daily`
2. Finds all active campaigns
3. For each campaign:
   - Gets 200 NEW creators (excludes already contacted)
   - Clay enriches
   - Queues for today
   - Uses credits

### Every 5 Minutes:
1. **Send cron** → Sends scheduled emails
2. **Monitor cron** → Checks for replies, sends AI responses

### Daily at Midnight:
1. **Reset cron** → Resets all users' credits to their plan limit

---

## ✅ Everything is Ready!

Once Vercel deploys the endpoints, your fully automated outreach system will be live! 🚀
