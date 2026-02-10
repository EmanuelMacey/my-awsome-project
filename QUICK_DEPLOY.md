
# Quick Deployment Guide for ErrandRunners

## 🚀 Fast Track to Production

### Step 1: Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Build Your App

**For Android (APK - Easy Testing):**
```bash
eas build --platform android --profile preview
```

**For Android (AAB - Google Play Store):**
```bash
eas build --platform android --profile production
```

**For iOS (App Store):**
```bash
eas build --platform ios --profile production
```

### Step 4: Download and Test

Once the build completes (10-30 minutes), you'll get a download link.

**For Android:**
- Download the APK
- Transfer to your Android device
- Install and test

**For iOS:**
- Download the IPA
- Use TestFlight for testing
- Or submit to App Store

### Step 5: Submit to Stores (Optional)

**Google Play Store:**
```bash
eas submit --platform android
```

**Apple App Store:**
```bash
eas submit --platform ios
```

## 📱 What You Need

### For Android:
- ✅ Nothing! EAS will generate everything for you

### For iOS:
- ✅ Apple Developer Account ($99/year)
- ✅ Apple ID
- ✅ App-specific password

## 💰 Costs

- **Expo EAS:** Free tier available (limited builds)
- **Google Play:** $25 one-time
- **Apple Developer:** $99/year
- **Supabase:** Free tier (current usage)

## ⚡ Quick Commands

```bash
# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Push updates (after initial release)
eas update --branch production --message "Bug fixes"
```

## 🎯 Current Status

Your app is ready to deploy! All the code changes have been made:

- ✅ Login navigation fixed
- ✅ Google login removed
- ✅ App name updated to "ErrandRunners"
- ✅ Supabase integration working
- ✅ Database triggers in place
- ✅ Email verification configured

## 📞 Need Help?

- **Expo Docs:** https://docs.expo.dev/build/introduction/
- **EAS Build:** https://docs.expo.dev/build/setup/
- **Full Guide:** See DEPLOYMENT_GUIDE.md for detailed instructions

---

**Ready to deploy?** Run `eas build --platform android --profile preview` to get started! 🚀
