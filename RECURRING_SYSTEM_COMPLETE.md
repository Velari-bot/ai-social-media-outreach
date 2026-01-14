# ✅ Recurring Campaign System - Implementation Complete

## 🎯 What Was Implemented

### 1. **Recurring Daily Campaigns** ✅
- Campaigns now run automatically for 30 days
- Each day finds NEW creators (no duplicates)
- Tracks contacted creator IDs to avoid re-contacting
- Auto-deactivates after 30 runs

### 2. **Same-Day Email Sending** ✅
- ALL emails sent on the SAME DAY (9 AM - 5 PM)
- No multi-day spreading
- 200 emails = distributed across 8 hours (~2.4 min intervals)
- Smart scheduling based on current time

### 3. **Daily Credit Reset** ✅
- Credits reset at midnight every day
- NO rollover - unused credits are lost
- Fresh start each day

### 4. **Replies Consume Credits** ✅
- Each incoming reply = 1 credit deducted
- Tracked in `email_used_today`
- Prevents unlimited replies

### 5. **Clay Integration** ✅
- Influencer Club returns creators (NO emails)
- Clay enriches ALL creators with emails
- Only creators with emails get queued

---

## 📋 New System Flow

### **Day 1 - User Creates Campaign**

1. User creates "Baseball Instagram" campaign
2. System sets:
   ```javascript
   {
     is_recurring: true,
     is_active: true,
     run_count: 0,
     max_runs: 30,
     contacted_creator_ids: []
   }
   ```

3. **Immediately runs first iteration:**
   - Influencer Club → 200 creators (no emails)
   - Clay → Enriches all 200 → 150 emails found
   - Queue 150 for TODAY (9 AM - 5 PM)
   - Deduct 150 credits on send
   - Save 200 creator IDs to `contacted_creator_ids`

### **Day 2 - Auto-Run at 9 AM**

1. **Midnight:** Credits reset to 200
2. **9 AM:** Cron job runs `/api/cron/campaigns/daily`
3. Campaign engine:
   - Finds campaign (is_active: true)
   - Influencer Club → 200 NEW creators (excludes contacted IDs)
   - Clay → 180 emails
   - Queue 180 for TODAY
   - Add 200 new IDs to `contacted_creator_ids`
   - Increment `run_count` to 2

4. **Throughout day:**
   - Emails send (deduct credits on send)
   - 10 replies come in (deduct 10 credits)
   - Total credits used: 180 + 10 = 190

### **Day 30 - Final Run**

1. Campaign runs for 30th time
2. System sets `is_active: false`
3. Campaign stops running
4. User gets email: "Campaign completed"

---

## 🗄️ Database Changes

### **`creator_requests` (Modified)**
```typescript
{
  is_recurring: boolean,      // NEW
  is_active: boolean,          // NEW
  run_count: number,           // NEW
  max_runs: 30,                // NEW
  contacted_creator_ids: [],   // NEW - prevents duplicates
  last_run_at: Timestamp
}
```

### **`campaign_runs` (New Collection)**
```typescript
{
  campaign_id: string,
  run_number: number,
  run_date: "2026-01-14",
  creators_found: 200,
  emails_found: 150,
  emails_queued: 150,
  credits_used: 150,
  status: 'success'
}
```

---

## 🔄 New Cron Jobs

### **1. Credit Reset (Midnight)**
```
Schedule: 0 0 * * * (every day at midnight)
Endpoint: /api/cron/credits/reset
Purpose: Reset all users' email_used_today to 0
```

### **2. Daily Campaigns (9 AM)**
```
Schedule: 0 9 * * * (every day at 9 AM)
Endpoint: /api/cron/campaigns/daily
Purpose: Run all active recurring campaigns
```

### **3. Send Emails (Every 5 min)**
```
Schedule: */5 * * * * (every 5 minutes)
Endpoint: /api/cron/outreach/send
Purpose: Send scheduled emails
```

### **4. Monitor Replies (Every 5 min)**
```
Schedule: */5 * * * * (every 5 minutes)
Endpoint: /api/cron/outreach/monitor
Purpose: Check for replies, send AI responses, deduct credits
```

---

## 📊 Credit System

### **How Credits Work:**

1. **Daily Limit:** Based on plan (e.g., 200/day)
2. **Outgoing Emails:** 1 credit per email sent
3. **Incoming Replies:** 1 credit per reply received
4. **Reset:** Midnight every day
5. **No Rollover:** Unused credits are lost

### **Example Day:**
- User has 200 credits
- Sends 150 emails → 150 credits used
- Receives 30 replies → 30 credits used
- Total: 180 credits used, 20 remaining
- **Midnight:** Resets to 200 (20 lost)

---

## 🔧 Key Files Modified

1. **`lib/database.ts`** - Added recurring campaign fields
2. **`lib/services/campaign-engine.ts`** - NEW - Runs campaigns daily
3. **`lib/services/outreach-queue.ts`** - Same-day scheduling
4. **`lib/services/reply-monitor.ts`** - Credit deduction on reply
5. **`app/api/cron/campaigns/daily/route.ts`** - NEW - Daily cron
6. **`app/api/cron/credits/reset/route.ts`** - NEW - Midnight reset
7. **`vercel.json`** - Updated cron schedules

---

## ✅ Requirements Met

- [x] Influencer Club = No emails (Clay only)
- [x] Credits reset daily (no rollover)
- [x] Campaigns run automatically for 30 days
- [x] All emails sent same day (9 AM - 5 PM)
- [x] Replies consume credits
- [x] No duplicate creators contacted
- [x] User notified when search gets stale

---

## 🚀 Next Steps

### **For cron-job.org Setup:**

Add these two new jobs:

**1. Credit Reset (Midnight)**
- URL: `https://www.verality.io/api/cron/credits/reset`
- Schedule: `0 0 * * *` (midnight)
- Header: `Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=`

**2. Daily Campaigns (9 AM)**
- URL: `https://www.verality.io/api/cron/campaigns/daily`
- Schedule: `0 9 * * *` (9 AM)
- Header: `Authorization: Bearer lOdZjqZL5ZjRww/QL+RKARq9P5PnhgcxSGXqMvkIXoI=`

---

## 🎯 System is Ready!

The recurring campaign system is now fully implemented. Once deployed and cron jobs are set up, campaigns will:

1. Run automatically every day at 9 AM
2. Find new creators (no duplicates)
3. Enrich with Clay for emails
4. Send all emails same day (9 AM - 5 PM)
5. Monitor replies and deduct credits
6. Reset credits at midnight
7. Continue for 30 days automatically

**No manual intervention needed!** 🚀
