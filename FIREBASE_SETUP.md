# Firebase Setup Guide

## Quick Fix for Black Screen

The black screen is caused by missing Firebase web configuration. Follow these steps:

### 1. Get Firebase Web Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ai-social-media-outreach-4e66c`
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **Your apps** section
5. If you don't have a web app, click **Add app** → **Web** (</> icon)
6. Copy the config values

### 2. Create `.env.local` File

Create a file named `.env.local` in the root directory with:

```env
# Firebase Web Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-social-media-outreach-4e66c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-social-media-outreach-4e66c.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Optional: Modash & Clay API Keys (for production)
MODASH_API_KEY=your_modash_key_here
CLAY_API_KEY=your_clay_key_here
```

### 3. Enable Firebase Authentication

1. In Firebase Console → **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Enable **Google** provider
5. Add authorized domains:
   - `localhost` (for development)
   - Your production domain

### 4. Create Firestore Database

1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll add security rules later)
4. Select a location (choose closest to your users)

### 5. Restart Dev Server

After adding `.env.local`:

```bash
npm run dev
```

The app should now load without the black screen!

## What Changed

The app now:
- ✅ Handles missing Firebase config gracefully
- ✅ Won't crash if Firebase isn't configured
- ✅ Shows proper error messages instead of black screen
- ✅ Has error boundaries to catch React errors

## Troubleshooting

**Still seeing black screen?**
- Make sure `.env.local` exists in the root directory
- Restart the dev server after creating `.env.local`
- Check browser console for specific error messages
- Verify Firebase config values are correct

**Firebase auth errors?**
- Make sure Authentication is enabled in Firebase Console
- Check that Email/Password and Google providers are enabled
- Verify authorized domains include `localhost`

