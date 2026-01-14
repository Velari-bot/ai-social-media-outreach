# Automated Outreach System

## Overview
This system provides 24/7 automated email outreach to creators using each user's connected Gmail account. It intelligently distributes emails throughout the day and automatically responds to replies using AI.

## Architecture

### 1. Outreach Queue (`outreach_queue` collection)
- Stores creators to be contacted
- Tracks email status (pending, scheduled, sent, replied, failed)
- Schedules send times distributed throughout the day
- Prevents duplicate contacts

### 2. Email Sender (Cron: Every 5 minutes)
- **Endpoint**: `/api/cron/outreach/send`
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Function**: Processes scheduled emails from the queue
- **Features**:
  - Uses each user's Gmail OAuth connection
  - Respects daily sending limits (default: 100/day)
  - Distributes emails throughout business hours (9 AM - 5 PM)
  - Minimum 10 minutes between emails per user
  - AI-generated personalized emails using "Cory from Beyond Vision" persona
  - Automatic retry logic for failures

### 3. Reply Monitor (Cron: Every 5 minutes)
- **Endpoint**: `/api/cron/outreach/monitor`
- **Schedule**: `*/5 * * * *` (every 5 minutes)
- **Function**: Checks all users' Gmail inboxes for creator replies
- **Features**:
  - Monitors threads with `VERALITY_AI` label
  - Generates contextual AI responses
  - Extracts data (phone numbers, rates) from replies
  - Knows when to stop replying (if creator seems uninterested)
  - Updates thread tracking and creator data

### 4. User Email Settings (`user_email_settings` collection)
Per-user configuration:
```typescript
{
  gmail_connected: boolean,
  max_emails_per_day: number,        // Default: 100
  min_minutes_between_emails: number, // Default: 10
  sending_hours_start: number,        // Default: 9 (9 AM)
  sending_hours_end: number,          // Default: 17 (5 PM)
  ai_auto_reply_enabled: boolean,     // Default: true
  ai_persona: string                  // Default: "Cory from Beyond Vision"
}
```

## Usage Flow

### 1. Creator Discovery
When creators with emails are found:
```typescript
// Call from your creator discovery code
await fetch('/api/outreach/queue', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    creators: [
      {
        id: 'creator_123',
        email: 'creator@example.com',
        handle: 'creator_handle',
        platform: 'instagram',
        name: 'Creator Name'
      }
    ],
    requestId: 'request_id',
    campaignId: 'campaign_id' // optional
  })
});
```

### 2. Automatic Scheduling
The system automatically:
- Checks if creator was already contacted
- Calculates optimal send time based on user's settings
- Distributes emails throughout the day
- Adds to queue with status `scheduled`

### 3. Automated Sending
Every 5 minutes, the cron job:
- Finds emails scheduled for now or earlier
- Groups by user
- Checks daily limits
- Generates AI-personalized emails
- Sends via user's Gmail
- Tracks in `email_threads` collection
- Updates queue status to `sent`

### 4. Reply Monitoring
Every 5 minutes, the cron job:
- Checks all users' Gmail inboxes
- Finds unread threads with `VERALITY_AI` label
- Generates AI responses based on conversation context
- Extracts creator data (phone, rates)
- Sends replies
- Updates tracking

## Email Distribution Example

For 100 creators with default settings (10 min between emails, 9 AM - 5 PM):
- Day 1: ~48 emails (8 hours × 6 per hour)
- Day 2: ~48 emails
- Day 3: ~4 emails
- Total: Distributed over ~2-3 days

## AI Persona

The system uses the "Cory from Beyond Vision" persona:
- Friendly, professional, upbeat tone
- Asks for flat USD rates for TikTok posts and Sound Promos
- Always requests phone number with international code
- Knows when to stop replying if creator seems uninterested
- Signs off as "Best, Cory" or "Best, Cory Hodkinson"

## Database Collections

### `outreach_queue`
```typescript
{
  user_id: string,
  creator_id: string,
  creator_email: string,
  status: 'pending' | 'scheduled' | 'sent' | 'replied' | 'failed',
  scheduled_send_time: Timestamp,
  sent_at?: Timestamp,
  gmail_thread_id?: string,
  retry_count: number
}
```

### `email_threads`
```typescript
{
  id: string, // Gmail thread ID
  user_id: string,
  creator_id: string,
  status: 'active' | 'replied' | 'closed',
  last_message_from: 'user' | 'creator',
  ai_enabled: boolean,
  ai_reply_count: number,
  phone_number?: string,
  tiktok_rate?: number,
  sound_promo_rate?: number
}
```

### `user_email_settings`
```typescript
{
  user_id: string,
  gmail_connected: boolean,
  max_emails_per_day: number,
  emails_sent_today: number,
  min_minutes_between_emails: number,
  sending_hours_start: number,
  sending_hours_end: number,
  ai_auto_reply_enabled: boolean,
  total_emails_sent: number,
  total_replies_received: number
}
```

## Monitoring & Stats

Track outreach performance:
```typescript
// Get user's email settings (includes stats)
const settings = await getUserEmailSettings(userId);

console.log({
  totalSent: settings.total_emails_sent,
  totalReplies: settings.total_replies_received,
  replyRate: (settings.total_replies_received / settings.total_emails_sent) * 100
});
```

## Rate Limiting

The system automatically prevents spam:
- **Per User**: Max 100 emails/day (configurable)
- **Pacing**: Minimum 10 minutes between emails
- **Business Hours**: Only sends 9 AM - 5 PM (configurable)
- **Duplicate Prevention**: Won't contact same creator twice
- **Retry Logic**: Failed emails retry up to 3 times

## Gmail Setup Required

Each user must:
1. Connect their Gmail account via OAuth
2. System creates `VERALITY_AI` label automatically
3. All outreach emails get this label
4. Reply monitor only checks threads with this label

## Cron Job Setup (Vercel)

The `vercel.json` file configures:
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

## Security

- Cron endpoints protected by `CRON_SECRET`
- User endpoints require authentication
- Gmail OAuth tokens encrypted in Firestore
- Each user's emails sent from their own account

## Scaling

The system can handle:
- **Hundreds of users** simultaneously
- **Thousands of creators** per user
- **24/7 operation** with no manual intervention
- **Distributed sending** to avoid spam filters

## Future Enhancements

- [ ] A/B testing different email templates
- [ ] Custom AI personas per user
- [ ] Timezone-aware sending
- [ ] Email performance analytics dashboard
- [ ] Webhook notifications for replies
- [ ] Integration with CRM systems
