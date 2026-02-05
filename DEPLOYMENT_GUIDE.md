
# ErrandRunners - App Store & Play Store Deployment Guide

## ✅ Store Images Updated

The following store logos have been successfully updated:

1. **Gangbao** - New logo applied
2. **Popeyes (Louisiana Kitchen)** - New logo applied
3. **Golden Pagoda** - New logo applied
4. **KFC** - New logo applied
5. **Fireside Grill and Chill** - New logo applied

All images are now stored in Supabase Storage and will display correctly in the app.

---

## 📱 App Store & Play Store Deployment

### Prerequisites

Before you begin, ensure you have:

- An Apple Developer Account ($99/year) for App Store
- A Google Play Developer Account ($25 one-time fee) for Play Store
- EAS CLI installed: `npm install -g eas-cli`
- Expo account (free at expo.dev)

---

## 🚀 Step 1: Configure EAS Project

1. **Login to EAS:**
   ```bash
   eas login
   ```

2. **Initialize EAS in your project:**
   ```bash
   eas build:configure
   ```

3. **Update the project ID in app.json:**
   - Run `eas project:info` to get your project ID
   - Replace `"your-project-id"` in `app.json` under `extra.eas.projectId`

---

## 🍎 Step 2: iOS App Store Deployment

### A. Prepare App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** ErrandRunners
   - **Primary Language:** English
   - **Bundle ID:** com.errandrunners.app
   - **SKU:** errandrunners-001

### B. Update eas.json with Apple Credentials

Edit `eas.json` and update the iOS submit section:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@email.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCD123456"
    }
  }
}
```

**To find these values:**
- **appleId:** Your Apple ID email
- **ascAppId:** Found in App Store Connect → App Information → Apple ID
- **appleTeamId:** Found in Apple Developer → Membership → Team ID

### C. Build for iOS

```bash
# Build for iOS production
eas build --platform ios --profile production
```

This will:
- Create an optimized production build
- Handle code signing automatically
- Generate an IPA file

### D. Submit to App Store

```bash
# Submit to App Store
eas submit --platform ios --profile production
```

Or manually:
1. Download the IPA from the EAS build page
2. Use Transporter app to upload to App Store Connect
3. Go to App Store Connect and submit for review

### E. App Store Listing Requirements

Prepare the following for App Store Connect:

**Screenshots (Required sizes):**
- iPhone 6.7" (1290 x 2796 px) - 3 screenshots minimum
- iPhone 6.5" (1242 x 2688 px) - 3 screenshots minimum
- iPad Pro 12.9" (2048 x 2732 px) - 3 screenshots minimum

**App Information:**
- **App Name:** ErrandRunners
- **Subtitle:** Fast Food & Errand Delivery
- **Description:** 
  ```
  ErrandRunners is your all-in-one delivery solution for fast food and errands in Guyana.

  🍔 FAST FOOD DELIVERY
  - Order from KFC, Popeyes, Golden Pagoda, and more
  - Real-time order tracking
  - Live chat with your driver
  - Multiple payment options

  📦 ERRAND SERVICES
  - Supermarket shopping
  - Pharmacy pickups
  - Government services
  - Document delivery
  - Custom errands

  ✨ FEATURES
  - Distance-based pricing
  - Real-time driver tracking
  - In-app messaging
  - Order history and receipts
  - Multiple delivery addresses
  - Push notifications

  Download ErrandRunners today and get your orders delivered fast!
  ```

- **Keywords:** delivery, food delivery, errand, courier, fast food, guyana, kfc, popeyes
- **Support URL:** https://errandrunners.com/support
- **Marketing URL:** https://errandrunners.com
- **Privacy Policy URL:** https://errandrunners.com/privacy

**App Review Information:**
- **Demo Account Credentials:**
  - Email: demo@errandrunners.com
  - Password: Demo123!
  - Role: Customer
- **Notes:** Provide test credentials for admin and driver accounts

**Age Rating:**
- 4+ (No objectionable content)

---

## 🤖 Step 3: Google Play Store Deployment

### A. Prepare Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** ErrandRunners
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free

### B. Set Up Google Play Service Account

1. In Google Play Console, go to **Setup → API access**
2. Click **"Create new service account"**
3. Follow the link to Google Cloud Console
4. Create a service account with **"Service Account User"** role
5. Create a JSON key and download it
6. Save it as `google-play-service-account.json` in your project root
7. **⚠️ IMPORTANT:** Add this file to `.gitignore` (already done)

### C. Build for Android

```bash
# Build for Android production (AAB format for Play Store)
eas build --platform android --profile production
```

This will create an Android App Bundle (.aab) file.

### D. Submit to Play Store

```bash
# Submit to Play Store
eas submit --platform android --profile production
```

Or manually:
1. Download the AAB from the EAS build page
2. Go to Google Play Console → Production → Create new release
3. Upload the AAB file
4. Fill in release notes and submit for review

### E. Play Store Listing Requirements

**Store Listing:**

**App name:** ErrandRunners

**Short description (80 chars max):**
```
Fast food & errand delivery in Guyana. Order now!
```

**Full description (4000 chars max):**
```
ErrandRunners is your all-in-one delivery solution for fast food and errands in Guyana.

🍔 FAST FOOD DELIVERY
Order from your favorite restaurants including KFC, Popeyes, Louisiana Kitchen, Golden Pagoda, Fireside Grill, and more. Get hot, fresh food delivered right to your door.

📦 ERRAND SERVICES
Need something picked up? We've got you covered:
• Supermarket shopping
• Pharmacy pickups
• Government services
• Document delivery
• Custom errands

✨ KEY FEATURES
• Real-time order tracking - Watch your driver's location live
• In-app messaging - Chat directly with your driver
• Distance-based pricing - Fair and transparent delivery fees
• Multiple payment options - Cash on delivery available
• Order history - View all your past orders and receipts
• Multiple addresses - Save your favorite delivery locations
• Push notifications - Stay updated on your order status

💳 PAYMENT OPTIONS
• Cash on Delivery (COD)
• Credit/Debit Cards (Coming Soon)

🚗 FOR DRIVERS
Drivers can sign up to deliver orders and earn money on their own schedule.

👨‍💼 FOR BUSINESSES
Restaurant and store owners can manage their listings through the admin panel.

📱 EASY TO USE
1. Browse stores and services
2. Add items to your cart
3. Choose your delivery address
4. Place your order
5. Track your delivery in real-time
6. Enjoy!

Download ErrandRunners today and experience the fastest delivery service in Guyana!

Support: 592-7219769
Email: support@errandrunners.com
```

**Screenshots:**
- Phone: At least 2 screenshots (1080 x 1920 px or higher)
- 7-inch tablet: At least 2 screenshots (1920 x 1200 px)
- 10-inch tablet: At least 2 screenshots (2560 x 1600 px)

**Graphic Assets:**
- **App icon:** 512 x 512 px (PNG, 32-bit)
- **Feature graphic:** 1024 x 500 px (JPG or PNG)
- **Promo video:** YouTube URL (optional but recommended)

**Categorization:**
- **App category:** Food & Drink
- **Tags:** delivery, food delivery, courier

**Contact details:**
- **Email:** support@errandrunners.com
- **Phone:** +592-7219769
- **Website:** https://errandrunners.com

**Privacy Policy:**
- URL: https://errandrunners.com/privacy

**Content rating:**
- Complete the content rating questionnaire
- Expected rating: Everyone

---

## 🎨 Step 4: Create App Icons & Screenshots

### App Icon Requirements

**iOS:**
- 1024 x 1024 px (PNG, no transparency)

**Android:**
- 512 x 512 px (PNG, 32-bit with transparency)

**Current icon:** `./assets/images/natively-dark.png`

⚠️ **Action Required:** Replace the current icon with an ErrandRunners branded icon.

### Screenshot Recommendations

Take screenshots of:
1. **Home screen** - Showing store categories
2. **Store listing** - Showing available restaurants
3. **Store detail** - Showing menu items
4. **Cart screen** - Showing checkout process
5. **Order tracking** - Showing live driver location
6. **Chat screen** - Showing driver communication
7. **Errand services** - Showing errand categories

---

## 📋 Step 5: Pre-Launch Checklist

### Technical Checklist

- [x] App.json configured with proper bundle identifiers
- [x] EAS.json configured for production builds
- [x] Store images updated in database
- [x] Permissions properly configured (location, camera, notifications)
- [ ] App icon created and added
- [ ] Splash screen configured
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted
- [ ] Support email set up (support@errandrunners.com)
- [ ] Test all payment flows (COD)
- [ ] Test order placement and tracking
- [ ] Test driver assignment and tracking
- [ ] Test chat functionality
- [ ] Test errand creation and completion
- [ ] Test on both iOS and Android devices

### Content Checklist

- [ ] App Store screenshots prepared (iOS)
- [ ] Play Store screenshots prepared (Android)
- [ ] App description written
- [ ] Keywords researched
- [ ] Feature graphic created (Android)
- [ ] Promo video created (optional)
- [ ] Demo accounts created for review

### Legal Checklist

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Age rating completed
- [ ] Content rating completed (Android)
- [ ] Export compliance confirmed (iOS)

---

## 🔧 Step 6: Build Commands Reference

### Development Build
```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

### Preview Build (Internal Testing)
```bash
# iOS (TestFlight)
eas build --platform ios --profile preview

# Android (APK for testing)
eas build --platform android --profile preview
```

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Both platforms
eas build --platform all --profile production
```

### Submit to Stores
```bash
# iOS
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production

# Both platforms
eas submit --platform all --profile production
```

---

## 🧪 Step 7: Testing Before Submission

### iOS Testing (TestFlight)

1. Build with preview profile:
   ```bash
   eas build --platform ios --profile preview
   ```

2. Submit to TestFlight:
   ```bash
   eas submit --platform ios --profile production
   ```

3. In App Store Connect:
   - Go to TestFlight tab
   - Add internal testers
   - Share the TestFlight link

### Android Testing (Internal Testing Track)

1. Build with preview profile:
   ```bash
   eas build --platform android --profile preview
   ```

2. In Google Play Console:
   - Go to Testing → Internal testing
   - Create a new release
   - Upload the APK/AAB
   - Add testers via email

---

## 📊 Step 8: Post-Submission

### App Store Review (iOS)

- **Review time:** 1-3 days typically
- **Status tracking:** App Store Connect → My Apps → App Store → iOS App
- **Common rejection reasons:**
  - Missing demo account
  - Broken functionality
  - Privacy policy issues
  - Misleading screenshots

### Play Store Review (Android)

- **Review time:** Few hours to 7 days
- **Status tracking:** Google Play Console → Dashboard
- **Common rejection reasons:**
  - Content policy violations
  - Broken functionality
  - Missing privacy policy
  - Incorrect content rating

---

## 🔄 Step 9: Updates & Maintenance

### Releasing Updates

1. **Update version numbers:**
   - iOS: Increment `buildNumber` in app.json
   - Android: Increment `versionCode` in app.json
   - Both: Update `version` (e.g., 1.0.0 → 1.0.1)

2. **Build new version:**
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit update:**
   ```bash
   eas submit --platform all --profile production
   ```

### Monitoring

- **Crashlytics:** Set up Firebase Crashlytics for crash reporting
- **Analytics:** Monitor user behavior and app performance
- **Reviews:** Respond to user reviews promptly
- **Updates:** Release updates regularly with bug fixes and features

---

## 🆘 Troubleshooting

### Build Failures

**iOS Code Signing Issues:**
```bash
# Clear credentials and re-authenticate
eas credentials
```

**Android Build Errors:**
```bash
# Clear build cache
eas build:clear-cache --platform android
```

### Submission Failures

**iOS:**
- Check App Store Connect for rejection reasons
- Ensure all required metadata is filled
- Verify demo account works

**Android:**
- Check Google Play Console for policy violations
- Ensure content rating is complete
- Verify privacy policy is accessible

---

## 📞 Support & Resources

### Official Documentation

- **Expo EAS Build:** https://docs.expo.dev/build/introduction/
- **Expo EAS Submit:** https://docs.expo.dev/submit/introduction/
- **App Store Connect:** https://developer.apple.com/app-store-connect/
- **Google Play Console:** https://support.google.com/googleplay/android-developer

### ErrandRunners Support

- **Email:** support@errandrunners.com
- **Phone:** 592-7219769

---

## ✅ Quick Start Commands

```bash
# 1. Login to EAS
eas login

# 2. Configure project
eas build:configure

# 3. Build for both platforms
eas build --platform all --profile production

# 4. Submit to both stores
eas submit --platform all --profile production
```

---

## 🎉 Congratulations!

Your ErrandRunners app is now ready for deployment! Follow the steps above to submit to both the App Store and Play Store.

**Next Steps:**
1. Create app icons and screenshots
2. Write privacy policy and terms of service
3. Set up demo accounts for review
4. Build and test the app
5. Submit for review
6. Monitor and respond to feedback

Good luck with your launch! 🚀
