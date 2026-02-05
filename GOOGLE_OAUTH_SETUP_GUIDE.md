
# Google OAuth Setup Guide for ErrandRunners

This guide will help you fix the "access blocked: invalid request" error when using Google OAuth authentication.

## Problem

The error occurs because the redirect URI in your app doesn't match what's configured in Google Cloud Console.

## Solution Steps

### 1. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (or create a new one)

### 2. Add Authorized Redirect URIs

You need to add the following redirect URIs to your Google OAuth client:

#### For Supabase (REQUIRED):
```
https://sytixskkgfvjjjemmoav.supabase.co/auth/v1/callback
```

#### For Development (Optional):
```
http://localhost:8081
http://localhost:19006
```

#### For Mobile Deep Links (Optional):
```
errandrunners://auth/callback
com.errandrunners.guyana://auth/callback
```

### 3. Configure Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sytixskkgfvjjjemmoav`
3. Navigate to **Authentication** > **Providers**
4. Find **Google** and click to configure
5. Enable the Google provider
6. Add your Google OAuth credentials:
   - **Client ID**: `<REDACTED_CLIENT_ID>`
   - **Client Secret**: `<REDACTED_CLIENT_SECRET>`

### 4. Configure Site URL in Supabase

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set the **Site URL** to: `https://natively.dev`
3. Add **Redirect URLs**:
   - `https://natively.dev/email-confirmed`
   - `errandrunners://auth/callback`
   - `com.errandrunners.guyana://auth/callback`

### 5. Verify OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Make sure the following scopes are added:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Add test users if your app is in testing mode
4. Save changes

### 6. Test the Integration

1. Restart your Expo development server
2. Clear the app cache: `expo start -c`
3. Try signing in with Google again

## Common Issues and Solutions

### Issue 1: "Access blocked: This app's request is invalid"

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
https://sytixskkgfvjjjemmoav.supabase.co/auth/v1/callback
```

### Issue 2: "redirect_uri_mismatch"

**Solution**: Double-check that you've added ALL the redirect URIs listed in Step 2 to your Google OAuth client.

### Issue 3: OAuth consent screen shows "Unverified app"

**Solution**: This is normal for apps in development. Add yourself as a test user in the OAuth consent screen settings.

### Issue 4: "Invalid client" error

**Solution**: Verify that:
- The Client ID and Secret are correctly entered in Supabase Dashboard
- The credentials haven't been regenerated in Google Cloud Console
- There are no extra spaces or characters in the credentials

## For Native Mobile Apps (Android/iOS)

If you want to use native Google Sign-In (recommended for better UX):

### Android Setup:

1. Get your SHA-1 certificate fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. In Google Cloud Console:
   - Create a new OAuth client ID for Android
   - Add your package name: `com.errandrunners.guyana`
   - Add your SHA-1 fingerprint

3. Install the Google Sign-In library:
   ```bash
   npx expo install @react-native-google-signin/google-signin
   ```

### iOS Setup:

1. In Google Cloud Console:
   - Create a new OAuth client ID for iOS
   - Add your bundle ID: `com.errandrunners.guyana`

2. Install the Google Sign-In library (same as Android)

## Verification Checklist

- [ ] Redirect URI added to Google Cloud Console
- [ ] Google provider enabled in Supabase Dashboard
- [ ] Client ID and Secret configured in Supabase
- [ ] Site URL configured in Supabase
- [ ] OAuth consent screen configured with correct scopes
- [ ] Test users added (if app is in testing mode)
- [ ] App restarted with cleared cache

## Need Help?

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Check Supabase logs in the Dashboard under **Logs** > **Auth**
3. Verify that your Google Cloud project has the necessary APIs enabled:
   - Google+ API
   - People API

## Security Notes

- Never commit your Client Secret to version control
- Use environment variables for sensitive credentials
- Regularly rotate your OAuth credentials
- Monitor your OAuth usage in Google Cloud Console
