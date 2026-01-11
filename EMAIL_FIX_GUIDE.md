# Email Not Working - Booking Confirmation Fix

## Problem
Emails are not being sent when a call is booked. The user (benderaiden826@gmail.com) is not receiving confirmation emails.

## Root Causes

### 1. **Missing or Invalid SMTP Credentials**
The email service requires specific environment variables that may not be configured:
- `SMTP_USER` - Gmail address to send from
- `SMTP_PASS` - Gmail app password (NOT regular password)
- `GMAIL_CLIENT_ID` - For Gmail API OAuth (optional but recommended)
- `GMAIL_CLIENT_SECRET` - For Gmail API OAuth
- `GMAIL_ADMIN_REFRESH_TOKEN` - For Gmail API OAuth

### 2. **Gmail Security Settings**
Gmail requires an "App Password" for SMTP access, not your regular password. Regular passwords won't work due to 2FA and security restrictions.

### 3. **Missing Error Logging**
The current code catches errors but doesn't expose them to the user, making it hard to diagnose.

## Solution

### Step 1: Configure Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to Security → 2-Step Verification (enable if not already)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 2: Update Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration (SMTP Method)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=benderaiden826@gmail.com
SMTP_PASS=your_16_character_app_password_here
SMTP_FROM=benderaiden826@gmail.com

# Meeting Configuration
MEETING_LINK=https://meet.google.com/your-meeting-code
MEETING_LOCATION=Google Meet
```

### Step 3: Enhanced Error Logging

I'll update the email service to provide better error messages.

## Code Changes

### File: `lib/email-service.ts`

**Changes Made:**
1. Added detailed error logging with specific error messages
2. Added validation for required environment variables
3. Added fallback error handling that returns error details
4. Improved console warnings for missing credentials

## Testing

### Test 1: Check Environment Variables
Run this in your terminal to verify variables are set:
```bash
node -e "console.log('SMTP_USER:', process.env.SMTP_USER); console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');"
```

### Test 2: Book a Test Call
1. Go to the booking page
2. Book a call with your email
3. Check the server console for error messages
4. Look for these log messages:
   - ✅ `Confirmation email sent to [email]`
   - ❌ `Error sending user confirmation email: [error details]`

### Test 3: Check Gmail Sent Folder
If using Gmail SMTP, check the "Sent" folder of the SMTP_USER account to see if emails are being sent.

## Common Issues & Fixes

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Fix**: You're using your regular Gmail password. Use an App Password instead.

### Issue: "Missing credentials for PLAIN"
**Fix**: SMTP_USER or SMTP_PASS environment variables are not set.

### Issue: No error messages at all
**Fix**: Check that the booking API is actually being called. Check browser network tab.

### Issue: "self signed certificate in certificate chain"
**Fix**: Set `SMTP_SECURE=false` and use port 587 (not 465).

## Alternative: Use Gmail API (Recommended)

For better reliability, use Gmail API with OAuth2:

1. Set up OAuth2 credentials in Google Cloud Console
2. Get a refresh token using OAuth Playground
3. Set these environment variables:
```env
NEXT_PUBLIC_GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_ADMIN_REFRESH_TOKEN=your_refresh_token
```

The code already supports this method and will automatically use it if these variables are set.

## Verification Checklist

- [ ] Gmail App Password generated
- [ ] Environment variables added to `.env.local`
- [ ] Server restarted after adding env vars
- [ ] Test booking created
- [ ] Console logs checked for errors
- [ ] Email received in inbox (check spam folder too)
- [ ] Calendar invite attached to email
- [ ] Google Meet link included in email

## Next Steps

1. **Immediate**: Set up SMTP with App Password (5 minutes)
2. **Short-term**: Test booking flow end-to-end
3. **Long-term**: Migrate to Gmail API OAuth for better reliability
