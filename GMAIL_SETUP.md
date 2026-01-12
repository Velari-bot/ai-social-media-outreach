# Gmail Integration Setup Guide

If you see an **Error 400: redirect_uri_mismatch**, it means Google doesn't recognize the callback URL your app is sending. You need to whitelist it in the Google Cloud Console.

## How to Fix "redirect_uri_mismatch"

1. Go to the [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials).
2. Find the **OAuth 2.0 Client ID** you created for this project (it matches your `NEXT_PUBLIC_GMAIL_CLIENT_ID`).
3. Click the **Edit** (pencil) icon.
4. Scroll down to **Authorized redirect URIs**.
5. Click **ADD URI** and paste the following:

   **For Local Development:**
   ```
   http://localhost:3000/admin/google-callback
   ```

   **For Production (Live Site):**
   ```
   https://verality.io/admin/google-callback
   ```
   *(Replace `verality.io` with your actual domain)*

6. Click **SAVE**.
7. Wait a few minutes (it can take up to 5 minutes to propagate).
8. Try "Connect Gmail" again in your Admin Panel.
