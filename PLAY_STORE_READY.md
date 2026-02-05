
# 🚀 ErrandRunners - Play Store Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. App Configuration (COMPLETED ✅)
- ✅ App name: ErrandRunners
- ✅ Package name: com.errandrunners.app
- ✅ Version: 1.0.0
- ✅ Version code: 1
- ✅ App icon: ErrandRunners logo configured
- ✅ Splash screen: ErrandRunners logo configured
- ✅ Adaptive icon: Configured with white background

### 2. Permissions (COMPLETED ✅)
All necessary permissions are configured in app.json:
- ✅ Location (Fine, Coarse, Background)
- ✅ Camera
- ✅ Storage (Read/Write)
- ✅ Notifications
- ✅ Foreground Service for location tracking

### 3. Build Configuration (COMPLETED ✅)
- ✅ EAS Build configured for production
- ✅ Preview build configured for APK testing
- ✅ Production build configured for App Bundle (Play Store)

### 4. Crash Prevention (COMPLETED ✅)
- ✅ Removed missing notification sound reference
- ✅ Added proper error handling in AuthContext
- ✅ Added proper error handling in Supabase config
- ✅ Added proper error handling in notifications
- ✅ All console.log statements for debugging

## 📱 Building the App

### Option 1: Build APK for Testing
```bash
# Build a standalone APK for testing
eas build --platform android --profile preview

# This will create an APK file you can install directly on Android devices
```

### Option 2: Build App Bundle for Play Store
```bash
# Build an App Bundle for Play Store submission
eas build --platform android --profile production

# This will create an .aab file optimized for Play Store
```

## 🔧 Before Building

### 1. Set up EAS Account
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure
```

### 2. Update EAS Project ID
Edit `app.json` and replace `"your-project-id-here"` with your actual EAS project ID:
```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  }
}
```

### 3. Configure Google Services (Optional)
If you want to use Firebase services:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add an Android app with package name: `com.errandrunners.app`
4. Download `google-services.json`
5. Replace the placeholder `google-services.json` file in the root directory

## 🎨 Play Store Assets Needed

### Required Graphics
1. **App Icon** (COMPLETED ✅)
   - Already configured: ErrandRunners logo
   - Size: 512x512 px (will be auto-generated from your logo)

2. **Feature Graphic** (NEEDED ⚠️)
   - Size: 1024x500 px
   - Create a banner with ErrandRunners branding

3. **Screenshots** (NEEDED ⚠️)
   - Minimum 2 screenshots required
   - Recommended: 4-8 screenshots
   - Size: 1080x1920 px (portrait) or 1920x1080 px (landscape)
   - Show key features:
     - Store browsing
     - Cart and checkout
     - Order tracking
     - Driver dashboard
     - Errands creation

### Store Listing Information

**App Title:**
ErrandRunners - Delivery Service

**Short Description (80 characters max):**
Fast delivery from local stores. Order food, groceries, and run errands easily.

**Full Description:**
ErrandRunners is your all-in-one delivery solution in Guyana. Browse local stores, order food and groceries, track your delivery in real-time, and even request custom errands.

**Key Features:**
🛒 Browse Local Stores - Discover restaurants, grocery stores, and more
🍕 Order Food & Groceries - Easy ordering with real-time tracking
📦 Custom Errands - Need something delivered? We'll run the errand for you
💳 Multiple Payment Options - Cash on Delivery and more
🚗 Real-Time Tracking - Track your driver's location live
💬 In-App Chat - Communicate directly with your driver
👤 Driver Mode - Earn money by delivering orders

**Perfect for:**
- Busy professionals who need quick deliveries
- Families ordering groceries and meals
- Anyone who needs errands run
- Drivers looking to earn extra income

**Contact & Support:**
📧 Email: errandrunners592@gmail.com
📞 Phone: 592-721-9769

**Category:** Food & Drink (or Shopping)

**Content Rating:** Everyone

**Privacy Policy URL:** (You'll need to create one)

**Target Audience:**
- Primary: 18-65 years old
- Location: Guyana

## 🔐 App Signing

### For First-Time Build:
EAS will automatically generate signing credentials for you.

### For Existing App:
If you already have a keystore:
```bash
eas credentials
```

## 🚀 Deployment Steps

### Step 1: Test with APK
```bash
# Build preview APK
eas build --platform android --profile preview

# Download and test on physical device
# Make sure everything works correctly
```

### Step 2: Build for Production
```bash
# Build production App Bundle
eas build --platform android --profile production

# This creates an .aab file for Play Store
```

### Step 3: Submit to Play Store
```bash
# Option A: Manual submission
# 1. Download the .aab file from EAS
# 2. Go to Google Play Console
# 3. Create a new app or select existing
# 4. Upload the .aab file
# 5. Fill in store listing information
# 6. Submit for review

# Option B: Automated submission (requires setup)
eas submit --platform android
```

## 📋 Play Store Console Setup

1. **Create App in Play Console**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Fill in app details

2. **App Content**
   - Privacy Policy (required)
   - App Access (all features accessible)
   - Ads (declare if you have ads)
   - Content Rating (complete questionnaire)
   - Target Audience
   - News Apps (not applicable)
   - COVID-19 Contact Tracing (not applicable)
   - Data Safety (declare data collection)

3. **Store Listing**
   - Upload all graphics
   - Fill in descriptions
   - Add screenshots
   - Set category and tags

4. **Pricing & Distribution**
   - Free or Paid
   - Countries (select Guyana and others)
   - Content Guidelines compliance

5. **Release**
   - Internal Testing (optional)
   - Closed Testing (optional)
   - Open Testing (optional)
   - Production Release

## 🐛 Troubleshooting

### Build Fails
```bash
# Clear cache and retry
eas build:clear-cache
eas build --platform android --profile preview
```

### App Crashes on Start
- Check logs: `npx expo start --android` and view device logs
- Ensure all environment variables are set
- Verify Supabase credentials are correct

### Missing Dependencies
```bash
# Install all dependencies
npm install

# Clear cache
rm -rf node_modules
npm install
```

## 📞 Support

If you encounter any issues:
- Email: errandrunners592@gmail.com
- Phone: 592-721-9769

## 🎉 Post-Launch

After your app is live:
1. Monitor crash reports in Play Console
2. Respond to user reviews
3. Plan updates and new features
4. Monitor app performance metrics

---

**Current Status:** ✅ Ready for APK testing
**Next Step:** Build preview APK and test on physical device
