
# Email Configuration Guide

If you are seeing "535-5.7.8 Invalid login" or "BadCredentials", it usually means one of two things:

1. The Refresh Token is invalid or expired.
2. The `GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` in your environment do not match the ones used to generate the token.

## Required Environment Variables

Ensure these are set on Vercel:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GMAIL_CLIENT_ID` | From Google Cloud Console -> APIs & Services -> Credentials |
| `GMAIL_CLIENT_SECRET` | From Google Cloud Console -> APIs & Services -> Credentials |
| `NEXT_PUBLIC_GMAIL_API_KEY` | (Optional) API Key restricted to Gmail API |

## How to Fix "Invalid Login"

1. **Disconnect**: Go to Admin Settings and click "Disconnect" to clear the old credentials.
2. **Verify Env**: Check Vercel Settings -> Environment Variables. Ensure `NEXT_PUBLIC_GMAIL_CLIENT_ID` and `GMAIL_CLIENT_SECRET` match your Google Cloud project EXACTLY.
   - *Tip*: Sometimes whitespace gets copied by accident.
3. **Re-Connect**: Click "Connect Gmail" in Admin Settings. This will generate a FRESH token using the current Environment Variables.
4. **Test**: Use the new "Test Config" button in Admin Settings.

## Debugging

If the Test button returns an error, look at the error message:
- `invalid_grant` / `Bad Request`: Your Refresh Token is bad. Disconnect and Reconnect.
- `unauthorized_client`: Your Client ID/Secret are wrong. Check Env Vars.
- `Invalid login`: The access token was generated, but Google rejected it for SMTP. This is rare but implies the "From" address doesn't match the authenticated user.
