
# OAuth Troubleshooting Guide

## Current Issue: "Access blocked: This app's request is invalid"

This error occurs when Google OAuth cannot validate your authentication request. Here's how to fix it:

## Quick Fix (Most Common Solution)

### Step 1: Update Google Cloud Console Redirect URI

The most common cause is an incorrect redirect URI. You MUST add this exact URI to your Google Cloud Console:

```
https://sytixskkgfvjjjemmoav.supabase.co/auth/v1/callback
```

**How to add it:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", click "ADD URI"
4. Paste: `https://sytixskkgfvjjjemmoav.supabase.co/auth/v1/callback`
5. Click "SAVE"

### Step 2: Verify Supabase Configuration

1. Go to: https://supabase.com/dashboard/project/sytixskkgfvjjjemmoav/auth/providers
2. Click on "Google"
3. Make sure it's enabled
4. Verify your Client ID: `<REDACTED_CLIENT_ID>`
5. Verify your Client Secret: `<REDACTED_CLIENT_SECRET>`
6. Click "Save"

### Step 3: Clear Cache and Test

```bash
# Stop the Expo server
# Then restart with cache cleared
expo start -c
```

## Detailed Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in your request doesn't match any authorized redirect URIs in Google Cloud Console.

**Solution**:
1. Check the error message for the redirect URI being used
2. Add that exact URI to Google Cloud Console
3. Make sure there are no trailing slashes or extra characters

### Error: "invalid_client"

**Cause**: The Client ID or Client Secret is incorrect.

**Solution**:
1. Verify the credentials in Google Cloud Console
2. Copy them again and update in Supabase Dashboard
3. Make sure there are no extra spaces

### Error: "access_denied"

**Cause**: User denied permission or the app is not verified.

**Solution**:
1. If in development, add yourself as a test user in OAuth consent screen
2. Make sure the app is published (at least to testing)
3. Check that required scopes are configured

### Error: "unauthorized_client"

**Cause**: The OAuth client is not authorized for this grant type.

**Solution**:
1. In Google Cloud Console, check the OAuth client type
2. Make sure it's set to "Web application" for Supabase OAuth
3. Verify the application type matches your use case

## Testing Checklist

Before testing, verify:

- [ ] Google Cloud Console has the correct redirect URI
- [ ] Supabase has Google provider enabled
- [ ] Client ID and Secret are correct in Supabase
- [ ] OAuth consent screen is configured
- [ ] Required scopes are added (openid, email, profile)
- [ ] You're added as a test user (if app is in testing)
- [ ] App cache is cleared
- [ ] Development server is restarted

## Debug Mode

To see detailed OAuth flow information:

1. Open the app in a browser (Expo web)
2. Open browser DevTools (F12)
3. Go to Network tab
4. Try signing in with Google
5. Look for the OAuth request and response
6. Check for error messages in the response

## Alternative: Use Native Google Sign-In

If web-based OAuth continues to have issues, consider using native Google Sign-In:

```bash
npx expo install @react-native-google-signin/google-signin
```

This provides a better user experience and is more reliable on mobile devices.

## Still Having Issues?

1. **Check Supabase Auth Logs**:
   - Go to: https://supabase.com/dashboard/project/sytixskkgfvjjjemmoav/logs/auth-logs
   - Look for failed authentication attempts
   - Check the error messages

2. **Verify Google Cloud Project**:
   - Make sure the project is active
   - Check that OAuth consent screen is published
   - Verify that necessary APIs are enabled

3. **Test with Different Account**:
   - Try signing in with a different Google account
   - This helps identify if it's a user-specific issue

4. **Check Network**:
   - Make sure you have a stable internet connection
   - Try disabling VPN if you're using one
   - Check if your network blocks OAuth requests

## Contact Support

If none of these solutions work:

1. **Supabase Support**: https://supabase.com/dashboard/support
2. **Google Cloud Support**: https://cloud.google.com/support
3. **Expo Forums**: https://forums.expo.dev/

Include the following information:
- Error message (exact text)
- Steps to reproduce
- Screenshots of your configuration
- Logs from Supabase and browser console
