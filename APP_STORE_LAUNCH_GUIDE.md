
# 📱 App Store Launch Guide for MaceyRunners

This guide will walk you through the complete process of launching your MaceyRunners app to both the Apple App Store and Google Play Store.

---

## 🍎 **PART 1: Apple App Store Submission**

### Prerequisites
1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Wait for approval (usually 24-48 hours)

2. **App Store Connect Access**
   - Go to: https://appstoreconnect.apple.com/
   - Sign in with your Apple Developer account

### Step 1: Prepare Your App Information

Before building, gather these materials:

**Required Assets:**
- App Icon (1024x1024 PNG, no transparency)
- Screenshots (iPhone 6.7", 6.5", 5.5" displays)
  - At least 3 screenshots per device size
  - Recommended: 5-8 screenshots showing key features
- App Preview Video (optional but recommended)
  - 15-30 seconds
  - Shows app in action

**Required Information:**
- App Name: "MaceyRunners"
- Subtitle: (e.g., "Fast Delivery & Errands")
- Description: (200-4000 characters)
- Keywords: (100 characters max, comma-separated)
- Support URL: Your website or support page
- Marketing URL: (optional)
- Privacy Policy URL: **REQUIRED** - must be publicly accessible
- Category: Primary (Food & Drink or Shopping) + Secondary

### Step 2: Create App Store Connect Listing

1. **Log into App Store Connect**
   - Go to: https://appstoreconnect.apple.com/
   - Click "My Apps" → "+" → "New App"

2. **Fill in App Information:**
   - Platform: iOS
   - Name: MaceyRunners
   - Primary Language: English
   - Bundle ID: `com.maceyrunners.app` (must match app.json)
   - SKU: `maceyrunners-001` (unique identifier for your records)

3. **Set Pricing:**
   - Price: Free (or set your price)
   - Availability: All countries or select specific ones

4. **Upload Screenshots:**
   - Go to "App Store" tab
   - Upload screenshots for each required device size
   - Add captions (optional)

5. **Write App Description:**
   ```
   MaceyRunners - Your Trusted Delivery Partner in Guyana

   Get anything delivered fast! From restaurant meals to grocery shopping, 
   pharmacy items to custom errands - we've got you covered.

   🍔 FOOD DELIVERY
   Order from your favorite restaurants including KFC, Church's Chicken, 
   Kamboat, and more. Hot, fresh meals delivered to your door.

   🛒 GROCERY & SHOPPING
   Browse stores, add items to cart, and get them delivered. No need to 
   leave your home.

   📦 CUSTOM ERRANDS
   Need something picked up or dropped off? Create a custom errand and 
   our runners will handle it.

   📍 REAL-TIME TRACKING
   Track your order in real-time. Know exactly when your delivery will arrive.

   💬 IN-APP CHAT
   Communicate directly with your runner for special instructions.

   💳 FLEXIBLE PAYMENT
   Cash on Delivery (COD) available. Pay the way that works for you.

   Download MaceyRunners today and experience the fastest delivery service 
   in Guyana!
   ```

6. **Add Keywords:**
   ```
   delivery,food,restaurant,grocery,shopping,errands,guyana,fast,tracking,kfc
   ```

### Step 3: Build Your iOS App with EAS

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS Build:**
   ```bash
   eas build:configure
   ```

4. **Build for iOS (Production):**
   ```bash
   eas build --platform ios --profile production
   ```

   This will:
   - Create a production build
   - Generate an `.ipa` file
   - Upload to EAS servers
   - Take 15-30 minutes

5. **Download the Build:**
   - Once complete, EAS will provide a download link
   - Or download from: https://expo.dev/accounts/[your-account]/projects/MaceyRunners/builds

### Step 4: Upload to App Store Connect

**Option A: Using Transporter (Recommended)**
1. Download Apple Transporter from Mac App Store
2. Open Transporter
3. Sign in with your Apple ID
4. Click "+" and select your `.ipa` file
5. Click "Deliver"
6. Wait for upload to complete (5-15 minutes)

**Option B: Using EAS Submit**
```bash
eas submit --platform ios
```
- Follow the prompts
- EAS will automatically upload to App Store Connect

### Step 5: Complete App Store Connect Submission

1. **Go to App Store Connect**
   - Select your app
   - Go to "App Store" tab

2. **Select Build:**
   - Under "Build" section, click "+"
   - Select the build you just uploaded
   - Wait for processing (can take 30-60 minutes)

3. **Fill in Additional Information:**
   - **Age Rating:** Complete the questionnaire
     - Likely 4+ or 9+ depending on content
   - **App Review Information:**
     - Contact Email: your-email@example.com
     - Contact Phone: +592-XXX-XXXX
     - Demo Account (if login required):
       - Username: demo@maceyrunners.com
       - Password: [provide test account]
     - Notes: "This is a delivery app for Guyana. Test account provided for review."

4. **Export Compliance:**
   - Select "No" for encryption (already set in app.json)

5. **Advertising Identifier:**
   - Select "No" if you don't use advertising

6. **Submit for Review:**
   - Click "Add for Review"
   - Click "Submit to App Review"

### Step 6: Wait for Review

- **Review Time:** 24-48 hours (sometimes up to 7 days)
- **Status Updates:** You'll receive emails at each stage
- **Check Status:** App Store Connect → My Apps → MaceyRunners

**Possible Outcomes:**
- ✅ **Approved:** App goes live automatically (or on your release date)
- ❌ **Rejected:** Review feedback provided, fix issues and resubmit
- ⚠️ **Metadata Rejected:** Fix app description/screenshots, no new build needed

### Common Rejection Reasons & Fixes:

1. **Missing Privacy Policy**
   - Fix: Add a publicly accessible privacy policy URL
   - Host on your website or use a free service

2. **Incomplete Information**
   - Fix: Ensure all required fields are filled in App Store Connect

3. **App Crashes**
   - Fix: Test thoroughly before submitting
   - Use TestFlight for beta testing

4. **Misleading Screenshots**
   - Fix: Ensure screenshots accurately represent the app

5. **Login Required Without Demo Account**
   - Fix: Provide working demo credentials in App Review Information

---

## 🤖 **PART 2: Google Play Store Submission**

### Prerequisites
1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/signup
   - Complete registration and payment

### Step 1: Prepare Your App Information

**Required Assets:**
- App Icon (512x512 PNG)
- Feature Graphic (1024x500 PNG) - banner image
- Screenshots (Phone: 16:9 or 9:16 aspect ratio)
  - Minimum 2, maximum 8
  - Recommended size: 1080x1920 or 1080x2340
- Promo Video (optional): YouTube link

**Required Information:**
- App Name: "MaceyRunners"
- Short Description: (80 characters max)
- Full Description: (4000 characters max)
- Category: Food & Drink or Shopping
- Content Rating: Complete questionnaire
- Privacy Policy URL: **REQUIRED**

### Step 2: Create Google Play Console Listing

1. **Log into Google Play Console**
   - Go to: https://play.google.com/console/
   - Click "Create app"

2. **Fill in App Details:**
   - App name: MaceyRunners
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Accept declarations

3. **Set Up Store Listing:**
   - Go to "Store presence" → "Main store listing"
   - Upload app icon and feature graphic
   - Add screenshots (at least 2)
   - Write short description (80 chars):
     ```
     Fast delivery & errands in Guyana. Food, groceries, and custom errands.
     ```
   - Write full description (use similar to iOS description above)

4. **Content Rating:**
   - Go to "Policy" → "App content"
   - Complete the questionnaire
   - Likely rating: Everyone or Teen

5. **Target Audience:**
   - Select age groups: 18+ (or appropriate for your app)

6. **Privacy Policy:**
   - Add your privacy policy URL
   - Must be publicly accessible

7. **App Category:**
   - Category: Food & Drink
   - Tags: delivery, food, shopping, errands

### Step 3: Build Your Android App with EAS

1. **Build for Android (Production):**
   ```bash
   eas build --platform android --profile production
   ```

   This will:
   - Create a production build
   - Generate an `.aab` (Android App Bundle) file
   - Upload to EAS servers
   - Take 15-30 minutes

2. **Download the Build:**
   - Once complete, download the `.aab` file
   - Or download from: https://expo.dev/accounts/[your-account]/projects/MaceyRunners/builds

### Step 4: Upload to Google Play Console

1. **Create a Release:**
   - Go to "Release" → "Production"
   - Click "Create new release"

2. **Upload App Bundle:**
   - Click "Upload" and select your `.aab` file
   - Wait for upload and processing (5-10 minutes)

3. **Release Name:**
   - Use version number: "1.0.9" (matches app.json)

4. **Release Notes:**
   ```
   Initial release of MaceyRunners!

   Features:
   - Order food from local restaurants
   - Shop for groceries and essentials
   - Create custom errands
   - Real-time order tracking
   - In-app chat with runners
   - Cash on Delivery payment
   ```

5. **Review Release:**
   - Check that all information is correct
   - Click "Save" then "Review release"

### Step 5: Complete Pre-Launch Checklist

Before submitting, ensure:
- [ ] Store listing is complete
- [ ] Content rating is complete
- [ ] Privacy policy is added
- [ ] App content declarations are complete
- [ ] Pricing & distribution is set
- [ ] Data safety form is complete

**Data Safety Form:**
- Go to "Policy" → "Data safety"
- Answer questions about data collection:
  - Do you collect user data? Yes
  - Types: Name, Email, Phone, Location
  - Purpose: App functionality, Account management
  - Is data encrypted? Yes
  - Can users request deletion? Yes

### Step 6: Submit for Review

1. **Start Rollout:**
   - Click "Start rollout to Production"
   - Confirm submission

2. **Review Process:**
   - **Initial Review:** 1-3 days
   - **Status Updates:** Check Play Console dashboard
   - **Emails:** You'll receive notifications

**Possible Outcomes:**
- ✅ **Approved:** App goes live within hours
- ❌ **Rejected:** Review feedback provided, fix and resubmit
- ⚠️ **Policy Violation:** Address specific policy issues

### Common Rejection Reasons & Fixes:

1. **Missing Privacy Policy**
   - Fix: Add a valid, publicly accessible privacy policy URL

2. **Incomplete Data Safety Form**
   - Fix: Complete all sections of the data safety form

3. **Misleading Store Listing**
   - Fix: Ensure description and screenshots match app functionality

4. **Permissions Not Justified**
   - Fix: Explain why each permission is needed in the app description

5. **App Crashes**
   - Fix: Test thoroughly on multiple Android devices/versions

---

## 📋 **PART 3: Post-Launch Checklist**

### After iOS Approval:
- [ ] App is live on App Store
- [ ] Test download and installation
- [ ] Monitor crash reports in App Store Connect
- [ ] Respond to user reviews
- [ ] Set up App Store Optimization (ASO)

### After Android Approval:
- [ ] App is live on Google Play
- [ ] Test download and installation
- [ ] Monitor crash reports in Play Console
- [ ] Respond to user reviews
- [ ] Set up Google Play Optimization

### Marketing:
- [ ] Announce launch on social media
- [ ] Update website with app store links
- [ ] Create app store badges for website
- [ ] Send email to existing users
- [ ] Consider paid advertising (Google Ads, Facebook Ads)

### Monitoring:
- [ ] Set up analytics (Firebase, Mixpanel, etc.)
- [ ] Monitor daily active users (DAU)
- [ ] Track retention rates
- [ ] Monitor crash-free rate (should be >99%)
- [ ] Respond to user feedback within 24-48 hours

---

## 🔄 **PART 4: Updating Your App**

When you need to release an update:

### iOS Update:
1. Increment version in `app.json`: `"version": "1.0.10"`
2. Build new version: `eas build --platform ios --profile production`
3. Upload to App Store Connect (via Transporter or EAS Submit)
4. Update "What's New" section with release notes
5. Submit for review (usually faster than initial review)

### Android Update:
1. Increment version in `app.json`: `"version": "1.0.10"`
2. Build new version: `eas build --platform android --profile production`
3. Upload to Google Play Console
4. Add release notes
5. Start rollout (can do staged rollout: 10% → 50% → 100%)

---

## 🆘 **PART 5: Troubleshooting**

### Build Fails:
- Check EAS build logs for errors
- Ensure all dependencies are compatible
- Verify `app.json` configuration is correct
- Try: `eas build --platform [ios/android] --profile production --clear-cache`

### App Rejected:
- Read rejection reason carefully
- Fix the specific issue mentioned
- Respond to reviewer if clarification needed
- Resubmit with detailed notes about fixes

### App Crashes After Launch:
- Check crash reports in App Store Connect / Play Console
- Use Sentry or Bugsnag for detailed crash reporting
- Release hotfix update ASAP
- Communicate with users via in-app message or social media

### Low Downloads:
- Improve app store listing (better screenshots, description)
- Add keywords for better discoverability
- Encourage users to rate and review
- Run promotional campaigns
- Consider app store ads

---

## 📞 **Support Resources**

**Apple:**
- App Store Connect: https://appstoreconnect.apple.com/
- Developer Forums: https://developer.apple.com/forums/
- Support: https://developer.apple.com/support/

**Google:**
- Play Console: https://play.google.com/console/
- Developer Forums: https://support.google.com/googleplay/android-developer/
- Support: https://support.google.com/googleplay/android-developer/answer/7218994

**Expo:**
- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Submit Docs: https://docs.expo.dev/submit/introduction/
- Expo Forums: https://forums.expo.dev/

---

## ✅ **Quick Launch Checklist**

### Before Building:
- [ ] App is fully tested (iOS, Android, Web)
- [ ] All features work correctly
- [ ] No critical bugs
- [ ] Privacy policy is ready and hosted
- [ ] App store assets are prepared (icons, screenshots, descriptions)
- [ ] Version number is correct in app.json

### iOS Submission:
- [ ] Apple Developer account is active
- [ ] App Store Connect listing is complete
- [ ] Build uploaded via Transporter or EAS Submit
- [ ] Demo account provided (if needed)
- [ ] Submitted for review

### Android Submission:
- [ ] Google Play Developer account is active
- [ ] Play Console listing is complete
- [ ] Data safety form is complete
- [ ] Build uploaded
- [ ] Submitted for review

### Post-Launch:
- [ ] Monitor for crashes
- [ ] Respond to reviews
- [ ] Track analytics
- [ ] Plan next update

---

**Good luck with your launch! 🚀**

If you encounter any issues during the submission process, refer to the troubleshooting section or reach out to Apple/Google support.
