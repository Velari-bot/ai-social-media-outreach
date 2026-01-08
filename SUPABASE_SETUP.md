# Supabase Setup Guide

This guide will help you set up your Supabase database for the AI Social Media Outreach app.

## Prerequisites

- Supabase account with a project created
- Your Supabase project URL and anon key (already configured in `lib/supabase.ts`)

## Database Setup Steps

### 1. Run the SQL Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script

This will create:
- `user_accounts` table - Stores user account information and email quotas
- `creator_requests` table - Stores creator search requests
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### 2. Configure Authentication

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable Email provider
3. Enable Google OAuth (optional but recommended)
4. Configure your site URL and redirect URLs:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: `http://localhost:3000/onboarding`, `http://localhost:3000/dashboard`

### 3. Email Templates (Optional)

You can customize email templates in Authentication > Email Templates for:
- Confirm signup
- Magic link
- Change email address
- Reset password

### 4. Environment Variables (Optional - for production)

For production, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://huyhnvklogmrfbctoihf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Note: Currently, the app uses hardcoded values in `lib/supabase.ts`. For production, you should use environment variables.

## Testing the Setup

1. Start your Next.js app: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Try creating an account or logging in
4. After login, you should be able to:
   - View your dashboard
   - Submit creator requests
   - See your recent requests

## Database Schema

### user_accounts
- `id` (UUID, Primary Key) - References auth.users
- `email` (TEXT)
- `name` (TEXT)
- `plan` (TEXT) - 'free', 'pro', or 'enterprise'
- `email_quota_daily` (INTEGER) - Daily email limit
- `email_quota_monthly` (INTEGER) - Monthly email limit
- `email_used_today` (INTEGER) - Emails sent today
- `email_used_this_month` (INTEGER) - Emails sent this month
- `quota_reset_date` (TIMESTAMPTZ) - When quota resets

### creator_requests
- `id` (BIGSERIAL, Primary Key)
- `user_id` (UUID) - References auth.users
- `name` (TEXT) - Request name
- `platforms` (TEXT[]) - Array of platforms
- `status` (TEXT) - 'pending', 'in_progress', 'delivered', or 'failed'
- `date_submitted` (TIMESTAMPTZ)
- `results_count` (INTEGER) - Number of creators found
- `criteria` (JSONB) - Search criteria object

## Security

Row Level Security (RLS) is enabled on all tables. Users can only:
- View their own account data
- View their own creator requests
- Create requests for themselves
- Update their own data

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the SQL schema script
- Check that tables were created in the Table Editor

### Authentication errors
- Verify email provider is enabled
- Check redirect URLs are configured correctly
- Ensure your site URL is set correctly

### RLS policy errors
- Verify RLS policies were created
- Check that `auth.uid()` matches the user_id

## Next Steps

- Add email tracking table for detailed email statistics
- Implement quota reset cron job
- Add analytics and reporting features
- Set up automated creator search processing

