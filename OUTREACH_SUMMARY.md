# Automated Outreach System - Summary

## ✅ What's Been Built

### 1. Credit-Based Email System
- **1 Credit = 1 Email**
- If user has 200 credits/day, system will send up to 200 emails/day
- Credits are reserved when creators are queued
- Credits reset daily automatically
- Only creators WITH emails are queued (creators without emails don't consume credits)

### 2. Smart Email Filtering
**Example:** User finds 200 creators
- 150 have emails ✅
- 50 don't have emails ❌

**Result:** Only the 150 with emails are queued for outreach
- Uses 150 credits
- 50 remaining credits available for more searches

### 3. Distributed Sending
Emails are spread throughout the day:
- **Default hours:** 9 AM - 5 PM
- **Minimum spacing:** 10 minutes between emails
- **Example:** 200 emails = ~2-3 days of distributed sending

### 4. User's Gmail Account
✅ **Every email is sent from the user's connected Gmail account**
- Not from admin's email
- Each user connects their own Gmail via OAuth
- System uses their refresh token to send on their behalf

### 5. 24/7 Reply Monitoring
- Checks all users' inboxes every 5 minutes
- AI responds automatically using "Cory from Beyond Vision" persona
- Extracts phone numbers and rates from replies
- Tracks conversation state

### 6. All Creators Page
**New page:** `/creators`
- View all creators from all campaigns
- Filter by platform (Instagram, TikTok, YouTube)
- Filter by email status (with/without emails)
- Search by handle or name
- See stats dashboard

## 📁 Key Files Created

### Core Services
1. **`lib/services/outreach-queue.ts`**
   - Manages the outreach queue
   - Distributes emails throughout the day
   - Enforces credit limits

2. **`lib/services/outreach-sender.ts`**
   - Sends scheduled emails
   - Uses user's Gmail OAuth
   - Generates AI-personalized emails

3. **`lib/services/reply-monitor.ts`**
   - Monitors all users' inboxes
   - Sends AI replies
   - Extracts creator data

### API Endpoints
1. **`/api/outreach/queue`** - Queue creators for outreach
2. **`/api/cron/outreach/send`** - Cron job to send emails
3. **`/api/cron/outreach/monitor`** - Cron job to monitor replies
4. **`/api/creators/all`** - Get all creators for user

### Pages
1. **`/creators`** - View all creators from all campaigns

## 🔧 How It Works

### When Creators Are Found:

1. **Discovery** → User searches for creators (e.g., 200 creators)
2. **Email Check** → System filters for creators with emails (e.g., 150 have emails)
3. **Credit Check** → Checks user's available credits (e.g., 200 credits available)
4. **Queue** → Queues 150 creators (uses 150 credits, 50 credits remaining)
5. **Schedule** → Distributes 150 emails across 2-3 days (9 AM - 5 PM, 10 min apart)

### Automated Sending:

1. **Cron Job** → Runs every 5 minutes
2. **Check Queue** → Finds emails scheduled for now
3. **Send** → Uses user's Gmail to send AI-generated email
4. **Track** → Creates thread tracking in database
5. **Label** → Adds "VERALITY_AI" label in Gmail

### Reply Monitoring:

1. **Cron Job** → Runs every 5 minutes
2. **Check Inbox** → Looks for unread threads with "VERALITY_AI" label
3. **AI Response** → Generates contextual reply
4. **Extract Data** → Pulls phone numbers, rates from message
5. **Send Reply** → Responds from user's Gmail
6. **Update** → Marks as read, updates database

## 🚀 Cron Job Setup

### Option 1: Vercel Pro ($20/month) ✅ RECOMMENDED
Already configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/outreach/send",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/outreach/monitor",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: Free External Service
Use Cron-job.org or EasyCron to hit endpoints every 5 minutes
See `CRON_SETUP.md` for details

## 📊 Database Collections

### `outreach_queue`
Stores creators to be contacted:
```typescript
{
  user_id: string,
  creator_email: string,
  status: 'scheduled' | 'sent' | 'replied',
  scheduled_send_time: Timestamp,
  gmail_thread_id?: string
}
```

### `email_threads`
Tracks conversations:
```typescript
{
  id: string, // Gmail thread ID
  user_id: string,
  creator_email: string,
  ai_enabled: boolean,
  phone_number?: string,
  tiktok_rate?: number,
  sound_promo_rate?: number
}
```

### `user_email_settings`
Per-user configuration:
```typescript
{
  gmail_connected: boolean,
  min_minutes_between_emails: 10,
  sending_hours_start: 9,
  sending_hours_end: 17,
  ai_auto_reply_enabled: true,
  ai_persona: "Cory from Beyond Vision"
}
```

## ✅ Fixed Issues

1. ✅ Import errors (`@/lib/auth` → `@/lib/auth-helpers`)
2. ✅ Firebase admin import path
3. ✅ Credits = Emails (200 credits = 200 emails/day)
4. ✅ Only queue creators with emails
5. ✅ Detailed feedback about email filtering
6. ✅ All Creators page to view all campaigns
7. ✅ User's Gmail is used for sending (not admin's)

## 🎯 Next Steps

1. **Set up cron jobs** (choose Vercel Pro or free service)
2. **Test the system** with a small batch of creators
3. **Monitor the queue** to ensure emails are sending
4. **Check Gmail** to see outreach emails being sent
5. **Review replies** to see AI responses

## 📝 Important Notes

- **Credits are consumed when queuing**, not when sending
- **Only creators with emails** are queued
- **Each user's Gmail** is used for their outreach
- **AI persona** is "Cory from Beyond Vision" by default
- **Emails are distributed** throughout the day to avoid spam filters
- **Reply monitoring** runs 24/7 automatically

## 🔗 Related Documentation

- `AUTOMATED_OUTREACH.md` - Full system documentation
- `CRON_SETUP.md` - Cron job setup guide
- `INFLUENCER_CLUB_NICHE_ISSUE.md` - API niche filtering notes
