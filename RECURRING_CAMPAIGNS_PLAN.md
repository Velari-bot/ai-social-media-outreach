# Recurring Campaign System - Implementation Plan

## 🎯 Core Requirements

### 1. Campaign Behavior
- ✅ Campaigns are **recurring** (run daily for 30 days)
- ✅ Each day finds NEW creators (no duplicates)
- ✅ All emails for the day sent SAME DAY (9 AM - 5 PM)
- ✅ Credits reset daily (no rollover)
- ✅ Replies consume credits (1 reply = 1 credit)

### 2. Email Flow
- ✅ Influencer Club → Creators (NO emails)
- ✅ Clay API → Email enrichment
- ✅ System → Send emails same day

### 3. Credit System
- ✅ Daily limit based on plan (e.g., 200/day)
- ✅ Outgoing emails consume credits
- ✅ Incoming replies consume credits
- ✅ Reset at midnight
- ✅ No rollover

---

## 📋 Implementation Steps

### Phase 1: Database Schema Updates
**Files to modify:**
- `lib/database.ts` - Add recurring campaign fields

**Changes:**
```typescript
CreatorRequest {
  is_recurring: true,
  is_active: true,
  last_run_at: Timestamp,
  frequency: 'daily',
  run_count: number,
  max_runs: 30,
  contacted_creator_ids: string[] // Track who we've contacted
}
```

### Phase 2: Clay Integration
**New file:**
- `lib/services/clay-client.ts` - Clay API integration

**Purpose:**
- Enrich creators with emails
- Batch processing
- Error handling

### Phase 3: Credit System Overhaul
**Files to modify:**
- `lib/services/outreach-queue.ts` - Update credit logic
- `lib/services/reply-monitor.ts` - Deduct credits on reply

**Changes:**
- Remove credit reservation on queue
- Deduct on actual send
- Deduct on reply received
- Daily reset cron job

### Phase 4: Recurring Campaign Engine
**New file:**
- `lib/services/campaign-engine.ts` - Daily campaign runner

**Purpose:**
- Run active campaigns daily
- Find new creators (exclude contacted)
- Enrich with Clay
- Queue for same-day sending
- Track run count

### Phase 5: Same-Day Sending
**Files to modify:**
- `lib/services/outreach-queue.ts` - Schedule all for TODAY

**Changes:**
- Calculate intervals for same day (9 AM - 5 PM)
- No multi-day spreading
- All emails scheduled for current day

### Phase 6: Cron Jobs
**New endpoints:**
- `/api/cron/campaigns/daily` - Run recurring campaigns
- `/api/cron/credits/reset` - Reset credits at midnight

**Existing to modify:**
- `/api/cron/outreach/monitor` - Deduct credits on reply

---

## 🔄 New System Flow

### Day 1 - Campaign Created
1. User creates "Baseball Instagram" campaign
2. System sets `is_recurring: true, max_runs: 30`
3. **Immediately runs first iteration:**
   - Influencer Club → 200 creators (no emails)
   - Clay → Enriches all 200 → 150 emails found
   - Queue 150 for TODAY (9 AM - 5 PM, ~3 min intervals)
   - Deduct 150 credits on send
   - Save contacted creator IDs

### Day 2 - Auto-Run
1. **Midnight:** Credits reset to 200
2. **9 AM:** Daily cron runs
3. Campaign engine:
   - Finds campaign (is_active: true)
   - Influencer Club → 200 NEW creators (exclude contacted IDs)
   - Clay → 180 emails
   - Queue 180 for TODAY
   - Track new contacted IDs
4. **Throughout day:**
   - Emails send (deduct credits)
   - Replies come in (deduct credits)

### Day 30 - Final Run
1. Campaign runs for 30th time
2. System sets `is_active: false`
3. User gets email: "Campaign completed"

---

## 🛡️ Safety Measures

### To Avoid Breaking Current System:
1. ✅ Keep existing code intact
2. ✅ Add new features alongside
3. ✅ Use feature flags if needed
4. ✅ Test each phase independently
5. ✅ Gradual rollout

### Backwards Compatibility:
- Old campaigns (is_recurring: false) work as before
- New campaigns (is_recurring: true) use new flow
- Both can coexist

---

## 📊 Database Collections

### New/Modified Collections:

**`creator_requests`** (modified):
```typescript
{
  id: string,
  user_id: string,
  name: string,
  is_recurring: boolean,      // NEW
  is_active: boolean,          // NEW
  last_run_at: Timestamp,      // NEW
  run_count: number,           // NEW
  max_runs: 30,                // NEW
  contacted_creator_ids: [],   // NEW
  criteria: {
    platform: string,
    niche: string,
    min_followers: number,
    max_followers: number
  }
}
```

**`daily_credit_usage`** (new):
```typescript
{
  user_id: string,
  date: string, // "2026-01-14"
  credits_limit: 200,
  credits_used: 0,
  emails_sent: 0,
  replies_received: 0
}
```

**`campaign_runs`** (new):
```typescript
{
  campaign_id: string,
  run_number: number,
  run_date: string,
  creators_found: number,
  emails_found: number,
  emails_sent: number,
  credits_used: number,
  status: 'success' | 'failed'
}
```

---

## 🚀 Execution Order

1. ✅ Phase 1: Database schema (non-breaking)
2. ✅ Phase 2: Clay integration (new service)
3. ✅ Phase 3: Credit system (careful updates)
4. ✅ Phase 4: Campaign engine (new service)
5. ✅ Phase 5: Same-day scheduling (update existing)
6. ✅ Phase 6: Cron jobs (new + updates)

---

## ⚠️ Critical Points

1. **Credit Deduction Timing:**
   - OLD: Reserve on queue
   - NEW: Deduct on send + reply

2. **Email Source:**
   - OLD: Influencer Club (wrong)
   - NEW: Clay API only

3. **Campaign Duration:**
   - OLD: One-time
   - NEW: 30-day recurring

4. **Daily Sending:**
   - OLD: Spread over days
   - NEW: All same day

---

## 🧪 Testing Strategy

1. Create test campaign with 10 creators
2. Verify Clay enrichment
3. Check same-day scheduling
4. Test credit deduction on send
5. Test credit deduction on reply
6. Verify daily reset
7. Test 30-day lifecycle

---

Ready to implement! Starting with Phase 1...
