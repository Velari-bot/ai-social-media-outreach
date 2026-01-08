# Deployment to Vercel

This guide explains how to deploy your AI Social Media Outreach tool to Vercel.

## Step 1: Push to GitHub

Ensure your project is in a GitHub repository.

## Step 2: Configure Firebase Admin Service Account

Vercel cannot access your local service account `.json` file. You must provide it as an environment variable.

1.  Open your Firebase Service Account JSON file (`ai-social-media-outreach-4e66c-firebase-adminsdk-fbsvc-00b1d928b3.json`).
2.  Copy the **entire contents** of the file (the whole JSON object).
3.  You will use this in the next step.

## Step 3: Deploy to Vercel

1.  Go to the [Vercel Dashboard](https://vercel.com/) and click **New Project**.
2.  Import your GitHub repository.
3.  In the **Environment Variables** section, add the following variables:

### **Required Firebase Client Variables**
| Key | Value (from your .env.local) |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g., `project-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your App ID |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `ai-social-media-outreach-4e66c` |

### **Required Firebase Admin Variables**
| Key | Value |
| :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT` | **Paste the whole JSON content from Step 2 here** |

### **Optional (but recommended) Gmail API Variables**
If you want the production app to send emails, you must add these:
- `NEXT_PUBLIC_GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_ADMIN_REFRESH_TOKEN`
- `SMTP_USER` (The admin email)
- `MEETING_LOCATION` (e.g., Google Meet)
- `MEETING_LINK` (Your static meeting link)

### **Other Service Variables**
- `MODASH_API_KEY` (For creator searches)
- `CLAY_API_KEY` (For email enrichment)
- `NEXT_PUBLIC_SITE_URL` (Set this to your vercel domain, e.g., `https://your-app.vercel.app`)

## Step 4: Finalize

1.  Click **Deploy**.
2.  Once deployed, copy your production URL (e.g., `https://your-app.vercel.app`).
3.  Go to **Firebase Console > Project Settings > General > Your apps > Web app**.
4.  Add your Vercel URL to the **Authorized domains** list in Firebase Authentication.
5.  If using Gmail OAuth, go to **Google Cloud Console > Credentials** and add your Vercel URL + `/api/gmail/callback` to the **Authorized redirect URIs**.

## Troubleshooting Build Errors

If you see an error like `Cannot find module '../ai-social-media-outreach-...'`:
I have updated `lib/firebase-admin.ts` to prioritize the `FIREBASE_SERVICE_ACCOUNT` environment variable. Ensure that variable is set exactly as a JSON string in Vercel.
