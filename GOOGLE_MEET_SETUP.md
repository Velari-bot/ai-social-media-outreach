# Google Meet Auto-Scheduling Setup Guide

## ✅ What's Implemented

Your booking system now **automatically creates Google Meet links** and sends calendar invites when someone books a call!

---

## 🎯 Features

### Automatic Google Meet Creation
- ✅ Creates Google Calendar event with Google Meet link
- ✅ Sends calendar invite to both parties
- ✅ Includes meeting details and description
- ✅ Sets reminders (1 day before + 30 min before)
- ✅ Stores Meet link in Firestore
- ✅ Includes Meet link in confirmation emails

### Email Notifications
- ✅ Sends confirmation email to customer with Meet link
- ✅ Sends notification email to admin
- ✅ Includes calendar invite (.ics file)
- ✅ Professional HTML email template

---

## 🔧 Setup Required

### Step 1: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** → **Library**
4. Search for **"Google Calendar API"**
5. Click **Enable**

### Step 2: Get OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Verality Booking System"
5. Authorized redirect URIs:
   ```
   https://developers.google.com/oauthplayground
   https://yourdomain.com/api/gmail/callback
   ```
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

### Step 3: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the gear icon (⚙️) in top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In Step 1, select:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
6. Click **"Authorize APIs"**
7. Sign in with the Google account you want to use (admin account)
8. Click **"Exchange authorization code for tokens"**
9. Copy the **Refresh token**

### Step 4: Add Environment Variables

Add these to your `.env.local` file:

```env
# Google Calendar/Meet Integration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GMAIL_ADMIN_REFRESH_TOKEN=your-refresh-token
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground

# Optional: Fallback meeting link (if Google Calendar fails)
MEETING_LINK=https://meet.google.com/your-backup-code
```

### Step 5: Deploy and Test

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Test booking a call
3. Check your Google Calendar - event should appear
4. Check email - should include Google Meet link

---

## 🔍 How It Works

### Booking Flow

```
User Books Call
    ↓
1. Save to Firestore
    ↓
2. Create Google Calendar Event
    ↓
3. Google generates Meet link
    ↓
4. Update Firestore with Meet link
    ↓
5. Send emails with Meet link
    ↓
6. User receives confirmation + calendar invite
```

### What Gets Created

**Google Calendar Event:**
- Title: "Call with [Name] (Verality)"
- Description: Discussion details
- Duration: 30 minutes
- Attendees: Customer + Admin
- Conference: Google Meet (auto-generated)
- Reminders: 1 day + 30 min before

**Emails Sent:**
1. **To Customer:**
   - Confirmation message
   - Google Meet link
   - Calendar invite (.ics)
   - Professional HTML template

2. **To Admin:**
   - New booking notification
   - Customer details
   - Meeting info

---

## 📊 Database Structure

Bookings in Firestore now include:

```typescript
{
  name: string,
  email: string,
  company: string,
  date: string,
  time: string,
  meetLink: string,          // NEW: Google Meet URL
  calendarEventId: string,   // NEW: For updates/cancellations
  status: string,
  createdAt: string,
  updatedAt: string
}
```

---

## 🧪 Testing

### Test with Real Booking

1. Go to `/book` page
2. Select a time slot
3. Fill in details
4. Submit booking

### Verify Success

- [ ] Booking appears in Firestore with `meetLink`
- [ ] Event appears in Google Calendar
- [ ] Google Meet link is generated
- [ ] Customer receives confirmation email with Meet link
- [ ] Admin receives notification email
- [ ] Calendar invite (.ics) is attached to email

### Test Cards

Use these test emails:
- Your personal email (to receive actual invites)
- A test email you control

---

## 🔧 API Endpoints

### Create Booking (with Google Meet)
```
POST /api/book-call
```

**Request:**
```json
{
  "slotId": "slot_123",
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc",
  "selectedTierGuess": "Pro",
  "date": "2026-01-15",
  "time": "14:00"
}
```

**Response:**
```json
{
  "success": true,
  "bookingId": "booking_123",
  "meetLink": "https://meet.google.com/abc-defg-hij"
}
```

---

## 🚨 Troubleshooting

### "Google Calendar API credentials missing"

**Solution**: Add all required environment variables to `.env.local`

### "Error creating Google Meet event"

**Possible causes:**
1. Calendar API not enabled
2. Invalid refresh token
3. Expired credentials
4. Missing scopes

**Solution**: 
1. Check Google Cloud Console - ensure Calendar API is enabled
2. Regenerate refresh token with correct scopes
3. Verify all env vars are set correctly

### Meet link not in email

**Check:**
1. Server logs for Google Calendar errors
2. Firestore - does booking have `meetLink` field?
3. Email service logs

### Calendar event not appearing

**Check:**
1. Correct Google account is used for refresh token
2. Calendar API is enabled
3. OAuth scopes include calendar access

---

## 📝 Files Modified

### New Files
- ✅ `lib/google-calendar-service.ts` - Google Calendar integration
- ✅ `GOOGLE_MEET_SETUP.md` - This guide

### Modified Files
- ✅ `app/api/book-call/route.ts` - Integrated Google Meet creation
- ✅ `lib/email-service.ts` - Updated to use dynamic Meet links

---

## 🎯 Production Checklist

Before going live:

- [ ] Google Calendar API enabled
- [ ] OAuth credentials created
- [ ] Refresh token generated
- [ ] Environment variables set in production
- [ ] Test booking completed successfully
- [ ] Calendar event created
- [ ] Meet link generated
- [ ] Emails sent with correct link
- [ ] Admin receives notifications

---

## 🔄 Future Enhancements

Possible improvements:
- [ ] Cancel/reschedule functionality
- [ ] Custom meeting durations
- [ ] Multiple calendar support
- [ ] Zoom integration option
- [ ] SMS reminders
- [ ] Automated follow-ups

---

## 📞 Support

If you encounter issues:

1. Check server logs for errors
2. Verify all environment variables
3. Test OAuth credentials in Playground
4. Check Google Calendar API quotas
5. Review Firestore for booking data

---

**Status**: ✅ Google Meet auto-scheduling is fully implemented and ready to use!

**Next**: Add your Google OAuth credentials to `.env.local` and test!
