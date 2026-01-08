# How to Set Up Admin Gmail for Booking Notifications

This guide explains how to configure the application to send booking confirmations and admin notifications using the Gmail API (instead of SMTP).

## Prerequisites

1.  Access to the **Google Cloud Console** (https://console.cloud.google.com/).
2.  Access to the **Gmail account** you want to send emails FROM (e.g., `admin@verality.io` or `cory@beyondvisionltd.org`).

## Step 1: Create Google Cloud Project & Credentials

1.  Go to **Google Cloud Console**.
2.  Select or Create a project.
3.  Go to **APIs & Services > Library**.
4.  Search for **Gmail API** and click **Enable**.
5.  Go to **APIs & Services > Credentials**.
6.  Click **Create Credentials** -> **OAuth client ID**.
    *   **Application type**: Web application.
    *   **Name**: "Verality Admin Mailer" (or similar).
    *   **Authorized redirect URIs**: Add `https://developers.google.com/oauthplayground`
        *   *Note: This specific URL is required to generate the initial Refresh Token manually.*
7.  Click **Create**.
8.  Copy the **Client ID** and **Client Secret**.

## Step 2: Generate the Refresh Token

We need a one-time "Refresh Token" that allows the server to send emails on behalf of the admin indefinitely.

1.  Go to **[Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)**.
2.  Click the **Gear Icon** (Settings) in the top right.
    *   Check **Use your own OAuth credentials**.
    *   Paste your **OAuth Client ID** and **OAuth Client secret** from Step 1.
    *   Close the settings.
3.  In the "Select & authorize APIs" box on the left:
    *   Find **Gmail API v1**.
    *   Select `https://mail.google.com/` (or strictly `https://www.googleapis.com/auth/gmail.send`).
    *   Click **Authorize APIs**.
4.  **Login with the Admin Gmail Account** (the one that should send the emails).
5.  Allow access when prompted.
6.  You will be redirected back to the Playground.
7.  Click **Exchange authorization code for tokens**.
8.  Copy the **Refresh Token** (it usually starts with `1//...`).

## Step 3: Configure Environment Variables

Open your `.env.local` file in the project root and set the following variables:

```env
# Google OAuth Credentials
NEXT_PUBLIC_GMAIL_CLIENT_ID=your_client_id_from_step_1
GMAIL_CLIENT_SECRET=your_client_secret_from_step_1

# Admin Email Configuration
GMAIL_ADMIN_REFRESH_TOKEN=your_refresh_token_from_step_2
SMTP_USER=email_address_you_logged_in_with@example.com
```

*Note: `SMTP_USER` is used to define the "From" address and must match the account used to generate the refresh token.*

## Step 4: Verification

1.  Restart your development server (`npm run dev`) to load the new environment variables.
2.  Go to `http://localhost:3000/book` and make a test booking.
3.  Check the server console logs. You should see:
    ```
    Confirmation email sent to ...
    ```
    *If you see "Gmail API credentials missing. Falling back to SMTP", double-check your .env.local file.*
