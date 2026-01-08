# Gmail Integration Setup

To enable Gmail features, you need to set up a Google Cloud Project and add the credentials to your `.env.local` file.

## Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select your existing one).
3. Enable the **Gmail API**:
   - Go to "APIs & Services" > "Library".
   - Search for "Gmail API".
   - Click "Enable".

## Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen".
2. Select "External" User Type and click "Create".
3. Fill in the required app information (App name, support email, etc.).
4. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
5. Add your email as a Test User (important while the app is in "Testing" mode).

## Step 3: Create Credentials
1. Go to "APIs & Services" > "Credentials".
2. Click "Create Credentials" > "OAuth client ID".
3. Application type: **Web application**.
4. Name: `Modash Clone` (or similar).
5. **Authorized redirect URIs** (add exactly this URL):
   - `http://localhost:3000/api/gmail/callback`
   *(If you deploy to Vercel later, you will need to add that URL too)*
6. Click "Create".

## Step 4: Add to .env.local
Copy the **Client ID** and **Client Secret** and add them to your `.env.local` file in the root of the project:

```env
# Gmail OAuth
NEXT_PUBLIC_GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
```

## Step 5: Restart Server
Stop your running server (Ctrl+C) and run `npm run dev` again to load the new credentials.
