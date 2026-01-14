# Cron Job Setup Options

## Option 1: Vercel Pro ($20/month) ✅ RECOMMENDED
Vercel's built-in cron jobs are the simplest solution.

**Pros:**
- Fully managed, no external services
- Automatic scaling
- Built into your deployment
- Reliable execution

**Cons:**
- Requires Vercel Pro plan ($20/month)

**Setup:**
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

Just deploy to Vercel Pro and it works automatically.

---

## Option 2: Free External Cron Service (FREE)
Use a free service to hit your API endpoints every 5 minutes.

### Recommended Services:

#### 1. **Cron-job.org** (FREE, unlimited jobs)
- Website: https://cron-job.org
- Free tier: Unlimited jobs, 1-minute intervals
- Setup:
  1. Create account
  2. Add two cron jobs:
     - URL: `https://your-app.vercel.app/api/cron/outreach/send`
     - Schedule: Every 5 minutes
     - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
  3. Repeat for `/api/cron/outreach/monitor`

#### 2. **EasyCron** (FREE, 20 jobs)
- Website: https://www.easycron.com
- Free tier: 20 cron jobs, 1-minute intervals
- Same setup as above

#### 3. **cron-job.io** (FREE)
- Website: https://cron-job.io
- Free tier: Unlimited jobs
- Same setup as above

### Setup Steps for External Service:

1. **Get your CRON_SECRET** from `.env.local`
   ```
   CRON_SECRET=your_secret_here
   ```

2. **Create two cron jobs** in the external service:

   **Job 1: Send Emails**
   - URL: `https://your-app.vercel.app/api/cron/outreach/send`
   - Method: GET
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Headers:
     ```
     Authorization: Bearer your_secret_here
     ```

   **Job 2: Monitor Replies**
   - URL: `https://your-app.vercel.app/api/cron/outreach/monitor`
   - Method: GET
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Headers:
     ```
     Authorization: Bearer your_secret_here
     ```

3. **Test the endpoints** manually first:
   ```bash
   curl -H "Authorization: Bearer your_secret_here" \
     https://your-app.vercel.app/api/cron/outreach/send
   ```

---

## Comparison

| Feature | Vercel Pro | External Service |
|---------|-----------|------------------|
| Cost | $20/month | FREE |
| Setup | Automatic | Manual |
| Reliability | Very High | High |
| Maintenance | None | Minimal |
| Scaling | Automatic | N/A |

---

## Recommendation

**For Production:** Use Vercel Pro
- More reliable
- No external dependencies
- Automatic scaling
- Worth the $20/month for a business app

**For Testing/Development:** Use free external service
- Test the system before committing to Vercel Pro
- Switch to Vercel Pro when ready for production

---

## Current Status

Your cron endpoints are ready and protected:
- ✅ `/api/cron/outreach/send` - Sends scheduled emails
- ✅ `/api/cron/outreach/monitor` - Monitors replies
- ✅ Both require `Authorization: Bearer ${CRON_SECRET}` header

Choose one of the options above to activate the 24/7 automated outreach system!
