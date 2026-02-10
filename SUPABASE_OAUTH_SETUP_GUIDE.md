
# Supabase OAuth Setup Guide - Apple & Google Sign-In

This guide will walk you through configuring Apple and Google OAuth authentication in your ErrandRunners app using Supabase.

---

## 📋 Prerequisites

Before starting, ensure you have:
- A Supabase project created (https://supabase.com)
- An Apple Developer Account ($99/year) for Apple Sign-In
- A Google Cloud Console account (free) for Google Sign-In
- Your app's bundle identifier (e.g., `com.yourcompany.errandrunners`)

---

## 🍎 Part 1: Apple Sign-In Setup

### Step 1: Configure Apple Developer Console

1. **Go to Apple Developer Console**
   - Visit: https://developer.apple.com/account
   - Sign in with your Apple Developer account

2. **Create an App ID**
   - Navigate to: Certificates, Identifiers & Profiles → Identifiers
   - Click the **+** button to create a new identifier
   - Select **App IDs** → Continue
   - Select **App** → Continue
   - Fill in the details:
     - **Description**: ErrandRunners
     - **Bundle ID**: `com.yourcompany.errandrunners` (use your actual bundle ID)
     - **Capabilities**: Check **Sign In with Apple**
   - Click **Continue** → **Register**

3. **Create a Services ID** (for web/redirect)
   - Go back to Identifiers → Click **+** button
   - Select **Services IDs** → Continue
   - Fill in:
     - **Description**: ErrandRunners Auth Service
     - **Identifier**: `com.yourcompany.errandrunners.auth` (must be different from App ID)
   - Click **Continue** → **Register**

4. **Configure the Services ID**
   - Click on the Services ID you just created
   - Check **Sign In with Apple**
   - Click **Configure** next to Sign In with Apple
   - **Primary App ID**: Select your App ID from Step 2
   - **Domains and Subdomains**: Add your Supabase project domain:
     ```
     <YOUR_PROJECT_REF>.supabase.co
     ```
     (Find this in your Supabase project settings → API → Project URL)
   
   - **Return URLs**: Add your Supabase callback URL:
     ```
     https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
   - Click **Next** → **Done** → **Continue** → **Save**

5. **Create a Key for Apple Sign-In**
   - Navigate to: Keys → Click **+** button
   - **Key Name**: ErrandRunners Apple Auth Key
   - Check **Sign In with Apple**
   - Click **Configure** next to Sign In with Apple
   - **Primary App ID**: Select your App ID
   - Click **Save** → **Continue** → **Register**
   - **IMPORTANT**: Download the key file (.p8) - you can only download it once!
   - Note down:
     - **Key ID** (shown after creation, e.g., `ABC123XYZ`)
     - **Team ID** (top right of Apple Developer page, e.g., `DEF456GHI`)

### Step 2: Configure Supabase for Apple Sign-In

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your ErrandRunners project

2. **Enable Apple Provider**
   - Navigate to: Authentication → Providers
   - Find **Apple** in the list
   - Toggle **Enable Sign in with Apple** to ON

3. **Enter Apple Credentials**
   - **Services ID**: `com.yourcompany.errandrunners.auth` (from Step 1.3)
   - **Team ID**: Your 10-character Team ID (from Step 1.5)
   - **Key ID**: Your Key ID (from Step 1.5)
   - **Secret Key**: Open the .p8 file you downloaded in a text editor and copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Click **Save**

4. **Configure Redirect URLs**
   - In the same Apple provider settings, add your app's deep link:
     ```
     exp://192.168.1.100:8081/--/auth-callback
     ```
     (Replace with your actual Expo development URL)
   
   - For production, add:
     ```
     errandrunners://auth-callback
     ```
     (Replace `errandrunners` with your app's custom scheme)

---

## 🔵 Part 2: Google Sign-In Setup

### Step 1: Configure Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account

2. **Create a New Project** (if you don't have one)
   - Click the project dropdown at the top
   - Click **New Project**
   - **Project Name**: ErrandRunners
   - Click **Create**

3. **Enable Google+ API**
   - In the left sidebar, go to: APIs & Services → Library
   - Search for "Google+ API"
   - Click on it → Click **Enable**

4. **Configure OAuth Consent Screen**
   - Go to: APIs & Services → OAuth consent screen
   - Select **External** (unless you have a Google Workspace)
   - Click **Create**
   - Fill in:
     - **App name**: ErrandRunners
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click **Save and Continue**
   - **Scopes**: Click **Add or Remove Scopes**
     - Add: `email`, `profile`, `openid`
   - Click **Save and Continue**
   - **Test users**: Add your email for testing
   - Click **Save and Continue** → **Back to Dashboard**

5. **Create OAuth 2.0 Credentials**
   - Go to: APIs & Services → Credentials
   - Click **Create Credentials** → **OAuth client ID**

   **For iOS:**
   - **Application type**: iOS
   - **Name**: ErrandRunners iOS
   - **Bundle ID**: `com.yourcompany.errandrunners` (your actual bundle ID)
   - Click **Create**
   - **Note down the Client ID** (e.g., `123456789-abc.apps.googleusercontent.com`)

   **For Android:**
   - Click **Create Credentials** → **OAuth client ID** again
   - **Application type**: Android
   - **Name**: ErrandRunners Android
   - **Package name**: `com.yourcompany.errandrunners`
   - **SHA-1 certificate fingerprint**: 
     - For development, run in terminal:
       ```bash
       keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
       ```
       (Password is usually `android`)
     - Copy the SHA-1 fingerprint
   - Click **Create**
   - **Note down the Client ID**

   **For Web (Supabase callback):**
   - Click **Create Credentials** → **OAuth client ID** again
   - **Application type**: Web application
   - **Name**: ErrandRunners Web
   - **Authorized JavaScript origins**: Add:
     ```
     https://<YOUR_PROJECT_REF>.supabase.co
     ```
   - **Authorized redirect URIs**: Add:
     ```
     https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - **Note down the Client ID and Client Secret**

### Step 2: Configure Supabase for Google Sign-In

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your ErrandRunners project

2. **Enable Google Provider**
   - Navigate to: Authentication → Providers
   - Find **Google** in the list
   - Toggle **Enable Sign in with Google** to ON

3. **Enter Google Credentials**
   - **Client ID (for OAuth)**: Use the **Web** Client ID from Step 1.5 (the one with Client Secret)
   - **Client Secret (for OAuth)**: The Client Secret from the Web OAuth client
   - Click **Save**

4. **Configure Redirect URLs**
   - In the same Google provider settings, the redirect URL is automatically set to:
     ```
     https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
     ```
   - This should match what you entered in Google Cloud Console

---

## 📱 Part 3: Configure Your React Native App

### Step 1: Update app.json

Add your custom URL scheme for deep linking:

```json
{
  "expo": {
    "scheme": "errandrunners",
    "ios": {
      "bundleIdentifier": "com.yourcompany.errandrunners",
      "usesAppleSignIn": true
    },
    "android": {
      "package": "com.yourcompany.errandrunners"
    }
  }
}
```

### Step 2: Update Supabase Configuration

Your `src/config/supabase.ts` should already be configured, but verify it has:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'https://<YOUR_PROJECT_REF>.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';

// Custom storage for auth tokens
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

**Replace:**
- `<YOUR_PROJECT_REF>` with your actual Supabase project reference (found in Project Settings → API)
- `your-anon-key-here` with your actual anon/public key (found in Project Settings → API)

### Step 3: Verify AuthContext Implementation

Your `src/contexts/AuthContext.tsx` should have these functions (already implemented):

```typescript
// Apple Sign-In
const signInWithApple = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: Linking.createURL('/auth-callback'),
        scopes: 'email name',
      },
    });
    if (error) throw error;
  } catch (error) {
    console.error('Apple Sign-In Error:', error);
    Alert.alert('Sign-In Error', 'Could not sign in with Apple. Please try again.');
  }
};

// Google Sign-In
const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Linking.createURL('/auth-callback'),
        scopes: 'email profile',
      },
    });
    if (error) throw error;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    Alert.alert('Sign-In Error', 'Could not sign in with Google. Please try again.');
  }
};
```

---

## 🧪 Part 4: Testing

### Test Apple Sign-In

1. **On iOS Device/Simulator:**
   - Open the app
   - Go to the Registration screen
   - Tap "Continue with Apple"
   - You should see the Apple Sign-In sheet
   - Sign in with your Apple ID
   - The app should redirect back and create your user account

2. **Troubleshooting:**
   - If you see "Invalid client" → Check your Services ID in Apple Developer Console
   - If redirect fails → Verify the Return URLs in Apple Developer Console match Supabase
   - If nothing happens → Check Xcode console for error messages

### Test Google Sign-In

1. **On iOS/Android Device:**
   - Open the app
   - Go to the Registration screen
   - Tap "Continue with Google"
   - You should see the Google Sign-In browser window
   - Sign in with your Google account
   - The app should redirect back and create your user account

2. **Troubleshooting:**
   - If you see "Invalid client" → Check your OAuth Client IDs in Google Cloud Console
   - If redirect fails → Verify the Authorized redirect URIs match Supabase callback URL
   - If "Access blocked" → Make sure you added your email as a test user in OAuth consent screen
   - Check the Expo console for error messages

---

## 🔍 Common Issues & Solutions

### Issue 1: "Invalid redirect URI"
**Solution:** 
- Verify the redirect URL in Supabase matches exactly what you configured in Apple/Google
- Format: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
- No trailing slashes, must be HTTPS

### Issue 2: Apple Sign-In shows "Invalid client"
**Solution:**
- Double-check your Services ID matches what you entered in Supabase
- Verify the Services ID is configured with Sign In with Apple enabled
- Ensure the Return URLs include your Supabase callback URL

### Issue 3: Google Sign-In shows "Access blocked: This app's request is invalid"
**Solution:**
- Make sure you're using the **Web** OAuth Client ID and Secret in Supabase (not iOS or Android)
- Verify the Authorized redirect URIs in Google Cloud Console include the Supabase callback URL
- Check that Google+ API is enabled in your Google Cloud project

### Issue 4: App doesn't redirect back after OAuth
**Solution:**
- Verify your app.json has the correct `scheme` configured
- Check that `expo-linking` is installed: `npx expo install expo-linking`
- Ensure `expo-web-browser` is installed: `npx expo install expo-web-browser`
- Test the deep link manually: `npx uri-scheme open errandrunners://auth-callback --ios`

### Issue 5: "User already registered" error
**Solution:**
- This is expected if the email is already in your database
- Supabase will link the OAuth account to the existing user
- If you want to prevent this, you need to handle it in your app logic

### Issue 6: No user profile created after OAuth sign-in
**Solution:**
- Check your Supabase database triggers
- You may need to create a trigger that automatically creates a user profile when a new auth user is created:

```sql
-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'customer',
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔐 Part 5: Security Best Practices

1. **Never commit credentials to Git:**
   - Keep your Supabase keys in `.env` file
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use Row Level Security (RLS):**
   - Enable RLS on all tables in Supabase
   - Create policies to ensure users can only access their own data

3. **Validate OAuth tokens:**
   - Supabase handles this automatically
   - Never trust client-side data without server-side verification

4. **Test with real devices:**
   - OAuth flows behave differently on simulators vs real devices
   - Always test on physical iOS and Android devices before release

---

## 📝 Part 6: Verification Checklist

Before going live, verify:

- [ ] Apple Sign-In works on iOS device (not just simulator)
- [ ] Google Sign-In works on iOS device
- [ ] Google Sign-In works on Android device
- [ ] User profile is created in database after OAuth sign-in
- [ ] User can sign out and sign back in with OAuth
- [ ] Deep linking redirects work correctly
- [ ] Error messages are user-friendly
- [ ] OAuth buttons are only shown on Registration screen (not Landing screen)
- [ ] Account deletion works for OAuth users

---

## 🚀 Part 7: Production Deployment

### For Apple Sign-In:

1. **Update Xcode Project:**
   - Open your iOS project in Xcode
   - Select your target → Signing & Capabilities
   - Click **+ Capability** → Add **Sign In with Apple**
   - Ensure your Team and Bundle Identifier are correct

2. **Update Production Redirect URLs:**
   - In Apple Developer Console, update your Services ID Return URLs to include:
     ```
     https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
     errandrunners://auth-callback
     ```

### For Google Sign-In:

1. **Create Production OAuth Clients:**
   - In Google Cloud Console, create new OAuth clients for production
   - Use your production SHA-1 certificate fingerprint (not debug)
   - To get production SHA-1:
     ```bash
     keytool -list -v -keystore /path/to/your/production.keystore -alias your-key-alias
     ```

2. **Update OAuth Consent Screen:**
   - Change from "Testing" to "In Production"
   - This requires verification if you're requesting sensitive scopes

3. **Update Supabase:**
   - Use the production Web OAuth Client ID and Secret in Supabase

---

## 📞 Support & Troubleshooting

If you encounter issues:

1. **Check Supabase Logs:**
   - Go to: Supabase Dashboard → Logs → Auth Logs
   - Look for failed authentication attempts and error messages

2. **Check Expo Logs:**
   - Run: `npx expo start`
   - Watch the terminal for error messages during OAuth flow

3. **Test the Callback URL:**
   - Manually visit: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
   - You should see a Supabase page (not a 404)

4. **Verify Provider Status:**
   - In Supabase Dashboard → Authentication → Providers
   - Ensure Apple and Google show as "Enabled" with green checkmarks

---

## 🎉 Success!

Once configured correctly, users will be able to:
- Sign up with Apple on iOS devices
- Sign up with Google on iOS and Android devices
- Sign in with their OAuth accounts
- Have their profile automatically created in your database
- Use all app features with their OAuth account

The OAuth buttons are now available on your Registration screen (`src/screens/auth/RegisterScreen.tsx`), and users can seamlessly authenticate with their preferred provider.

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [Expo Web Browser Documentation](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

---

**Last Updated:** January 2025
**App Version:** ErrandRunners v1.0
**Supabase SDK:** @supabase/supabase-js v2.90.1
