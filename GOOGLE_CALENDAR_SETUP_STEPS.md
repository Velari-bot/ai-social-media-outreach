# 🚀 Google Calendar API Setup - Step-by-Step Guide

## ⏱️ Time Required: ~5 minutes

Follow these exact steps to enable Google Meet auto-scheduling.

---

## 📋 Part 1: Google Cloud Console Setup (3 minutes)

### Step 1: Go to Google Cloud Console

1. Open: **https://console.cloud.google.com/**
2. Sign in with your Google account (the one you want to use for bookings)

### Step 2: Create or Select Project

**Option A: If you already have a project**
- Click the project dropdown at the top
- Select your existing project

**Option B: Create a new project**
- Click the project dropdown at the top
- Click **"New Project"**
- Name: `Verality Booking System`
- Click **"Create"**
- Wait for it to be created (~10 seconds)
- Select the new project

### Step 3: Enable Google Calendar API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - Or go directly to: https://console.cloud.google.com/apis/library

2. In the search box, type: **`Google Calendar API`**

3. Click on **"Google Calendar API"** (should be the first result)

4. Click the blue **"Enable"** button

5. Wait for it to enable (~5 seconds)

### Step 4: Create OAuth Credentials

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
   - Or go to: https://console.cloud.google.com/apis/credentials

2. Click **"+ Create Credentials"** at the top

3. Select **"OAuth client ID"**

4. **If you see "Configure Consent Screen":**
   - Click **"Configure Consent Screen"**
   - Select **"External"** (unless you have a Google Workspace)
   - Click **"Create"**
   - Fill in:
     - App name: `Verality Booking`
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"**
   - Click **"Save and Continue"** (skip scopes for now)
   - Click **"Save and Continue"** (skip test users)
   - Click **"Back to Dashboard"**
   - Go back to **"Credentials"** tab

5. Click **"+ Create Credentials"** → **"OAuth client ID"** again

6. Application type: Select **"Web application"**

7. Name: `Verality Booking OAuth`

8. Under **"Authorized redirect URIs"**, click **"+ Add URI"**
   - Add: `https://developers.google.com/oauthplayground`
   - Add: `http://localhost:3000/api/gmail/callback`

9. Click **"Create"**

10. **IMPORTANT**: A popup will show your credentials
    - Copy **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
    - Copy **Client secret** (looks like: `GOCSPX-xxxxx`)
    - Click **"OK"**

11. **Save these values** - you'll need them in the next step!

---

## 🎮 Part 2: OAuth Playground - Get Refresh Token (2 minutes)

### Step 1: Open OAuth Playground

1. Go to: **https://developers.google.com/oauthplayground**

### Step 2: Configure with Your Credentials

1. Click the **⚙️ gear icon** in the top-right corner

2. Check the box: **☑️ Use your own OAuth credentials**

3. Paste your credentials:
   - **OAuth Client ID**: Paste the Client ID from Step 1
   - **OAuth Client secret**: Paste the Client Secret from Step 1

4. Click **"Close"** (the gear icon again)

### Step 3: Select Calendar Scopes

1. On the left side, find **"Google Calendar API v3"**

2. Expand it (click the arrow)

3. Check these two boxes:
   - ☑️ `https://www.googleapis.com/auth/calendar`
   - ☑️ `https://www.googleapis.com/auth/calendar.events`

### Step 4: Authorize

1. Click the blue **"Authorize APIs"** button

2. **Sign in** with your Google account (the one you want to use for bookings)

3. You'll see a warning: **"Google hasn't verified this app"**
   - Click **"Advanced"**
   - Click **"Go to Verality Booking (unsafe)"**
   - This is safe - it's YOUR app!

4. Click **"Allow"** to grant calendar access

5. Click **"Allow"** again if prompted

### Step 5: Get Refresh Token

1. You'll be redirected back to OAuth Playground

2. Click the blue **"Exchange authorization code for tokens"** button

3. You'll see a JSON response on the right side

4. **Copy the `refresh_token`** value
   - It looks like: `1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - This is a LONG string - make sure you copy ALL of it!

---

## 📝 Part 3: Add to Your Project (1 minute)

### Step 1: Open .env.local

Open the file: `c:\Users\bende\OneDrive\Desktop\Verality\ai-social-media-outreach\.env.local`

### Step 2: Add These Lines

Add or update these variables:

```env
# Google Calendar/Meet Integration
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GMAIL_ADMIN_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
```

**Replace**:
- `YOUR_CLIENT_ID_HERE` with your Client ID from Part 1, Step 10
- `YOUR_CLIENT_SECRET_HERE` with your Client Secret from Part 1, Step 10
- `YOUR_REFRESH_TOKEN_HERE` with your Refresh Token from Part 2, Step 5

### Step 3: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## ✅ Test It!

### Step 1: Book a Test Call

1. Go to: `http://localhost:3000/book`
2. Select a time slot
3. Fill in your email (use your real email to test!)
4. Submit the booking

### Step 2: Check Results

**Check your email:**
- [ ] You should receive a confirmation email
- [ ] Email should have a Google Meet link
- [ ] Calendar invite (.ics) should be attached

**Check your Google Calendar:**
- [ ] Event should appear in your calendar
- [ ] Event should have a Google Meet link
- [ ] Event should show the customer as an attendee

**Check server logs:**
- [ ] Look for: `✅ Google Calendar event created:`
- [ ] Look for: `📹 Google Meet link:`

---

## 🎯 Quick Reference

### What You Need:

| Variable | Where to Get It | Looks Like |
|----------|----------------|------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | `GOCSPX-abc123xyz` |
| `GMAIL_ADMIN_REFRESH_TOKEN` | OAuth Playground → Exchange tokens | `1//0gXXXXXXXXXXXXXXX` |

### Important URLs:

- **Google Cloud Console**: https://console.cloud.google.com/
- **OAuth Playground**: https://developers.google.com/oauthplayground
- **Calendar API Library**: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

---

## 🚨 Troubleshooting

### "Access blocked: This app's request is invalid"

**Solution**: Make sure you added the redirect URI in Google Cloud Console:
- Go to Credentials → Edit your OAuth client
- Add: `https://developers.google.com/oauthplayground`

### "Google hasn't verified this app"

**Solution**: This is normal! Click "Advanced" → "Go to [App Name] (unsafe)"
- It's YOUR app, so it's safe
- You're just authorizing yourself

### "Invalid grant" error

**Solution**: Your refresh token expired or is invalid
- Go back to OAuth Playground
- Revoke access (gear icon → Revoke token)
- Repeat Part 2 to get a new refresh token

### No calendar event created

**Check**:
1. Calendar API is enabled in Google Cloud Console
2. All 3 environment variables are set correctly
3. Refresh token includes the full string (it's very long!)
4. Server was restarted after adding variables

### Meet link not in email

**Check**:
1. Server logs for errors
2. Firestore - does booking have `meetLink` field?
3. Try booking again with your own email

---

## 📸 Visual Checklist

### Google Cloud Console
```
✅ Project created/selected
✅ Calendar API enabled (shows "API enabled")
✅ OAuth credentials created
✅ Client ID copied
✅ Client Secret copied
✅ Redirect URIs added
```

### OAuth Playground
```
✅ Gear icon clicked
✅ "Use your own OAuth credentials" checked
✅ Client ID pasted
✅ Client Secret pasted
✅ Calendar scopes selected
✅ APIs authorized
✅ Tokens exchanged
✅ Refresh token copied
```

### .env.local
```
✅ GOOGLE_CLIENT_ID added
✅ GOOGLE_CLIENT_SECRET added
✅ GMAIL_ADMIN_REFRESH_TOKEN added
✅ Server restarted
```

---

## 🎉 You're Done!

Once you complete all steps:
- ✅ Google Calendar API is enabled
- ✅ OAuth credentials are configured
- ✅ Refresh token is generated
- ✅ Environment variables are set
- ✅ Server is restarted

**Your booking system will now automatically create Google Meet links!** 🚀

---

## 💡 Pro Tips

1. **Save your credentials**: Keep your Client ID, Client Secret, and Refresh Token in a safe place

2. **Test with your own email first**: Book a test call using your email to verify everything works

3. **Check spam folder**: Sometimes confirmation emails go to spam initially

4. **Refresh token doesn't expire**: Once you have it, you can use it indefinitely (unless you revoke access)

5. **Multiple calendars**: If you want to use a different calendar, you can specify it in the code

---

**Need help?** Check the server logs for detailed error messages!
