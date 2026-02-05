
# ErrandRunners - App Store Preparation Guide

## Overview
ErrandRunners is a complete delivery app for Guyana, connecting customers with local stores and drivers for fast, reliable delivery service.

## App Information

### Basic Details
- **App Name:** ErrandRunners
- **Bundle ID (iOS):** com.errandrunners.app
- **Package Name (Android):** com.errandrunners.delivery
- **Version:** 1.0.0
- **Build Number (iOS):** 1
- **Version Code (Android):** 1

### App Description

**Short Description (80 characters):**
Fast delivery from local stores across Guyana. Order groceries, food & more!

**Full Description:**
ErrandRunners is Guyana's premier delivery app, connecting you with local stores for fast, reliable delivery service.

**Features:**
- 🛒 Browse local stores and restaurants
- 🏃 Quick errand services
- 📱 Real-time order tracking
- 💬 In-app messaging with drivers
- 💳 Multiple payment options (Cash, Mobile Money)
- 🔐 Secure Face ID / Fingerprint login
- 📍 Precise location-based delivery

**For Customers:**
- Shop from your favorite local stores
- Get groceries, food, and essentials delivered
- Track your order in real-time
- Chat with your driver
- Rate and review your experience

**For Drivers:**
- Flexible earning opportunities
- Accept orders on your schedule
- Navigate with built-in directions
- Communicate with customers
- Track your earnings

**Serving communities across Guyana 🇬🇾**

### Keywords
delivery, guyana, groceries, food delivery, errand service, local stores, fast delivery, georgetown, mobile money, cash on delivery

### Category
- **Primary:** Food & Drink
- **Secondary:** Shopping

### Age Rating
- **iOS:** 4+ (No objectionable content)
- **Android:** Everyone

## Required Assets

### App Icon
- **Location:** `./assets/images/8d3f7431-61be-4455-ad92-f094917400c4.jpeg`
- **Requirements:**
  - iOS: 1024x1024px PNG (no transparency, no rounded corners)
  - Android: 512x512px PNG

### Screenshots
You'll need to provide screenshots for:

**iOS:**
- 6.7" Display (iPhone 14 Pro Max): 1290 x 2796 pixels
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688 pixels
- 5.5" Display (iPhone 8 Plus): 1242 x 2208 pixels

**Android:**
- Phone: 1080 x 1920 pixels (minimum)
- 7" Tablet: 1200 x 1920 pixels
- 10" Tablet: 1600 x 2560 pixels

**Recommended Screenshots:**
1. Home screen with store listings
2. Store detail page with products
3. Cart and checkout screen
4. Order tracking screen
5. Chat with driver screen
6. Profile screen

### Promotional Graphics (Android)
- Feature Graphic: 1024 x 500 pixels
- Promo Video (optional): YouTube link

## Privacy Policy & Terms

### Privacy Policy URL
You must provide a privacy policy URL. Create a privacy policy that covers:
- Data collection (location, contact info, usage data)
- How data is used
- Data sharing practices
- User rights
- Contact information

**Suggested URL:** https://errandrunners.gy/privacy-policy

### Terms of Service URL
**Suggested URL:** https://errandrunners.gy/terms-of-service

## Permissions Explained

### iOS Permissions
1. **Location (NSLocationWhenInUseUsageDescription)**
   - Why: To show nearby stores and calculate delivery fees
   
2. **Location Always (NSLocationAlwaysAndWhenInUseUsageDescription)**
   - Why: To track deliveries and provide accurate ETAs
   
3. **Camera (NSCameraUsageDescription)**
   - Why: To upload photos for errands
   
4. **Photo Library (NSPhotoLibraryUsageDescription)**
   - Why: To upload images for errands
   
5. **Face ID (NSFaceIDUsageDescription)**
   - Why: For secure and convenient login

### Android Permissions
1. **ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION**
   - Why: Location-based store discovery and delivery tracking
   
2. **CAMERA**
   - Why: Upload photos for errand requests
   
3. **READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE**
   - Why: Access photos for profile pictures and errand uploads
   
4. **POST_NOTIFICATIONS**
   - Why: Order updates and delivery notifications
   
5. **USE_BIOMETRIC / USE_FINGERPRINT**
   - Why: Secure biometric authentication

## Build Instructions

### Prerequisites
1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure project: `eas build:configure`

### Environment Variables
Set these secrets in EAS:
```bash
eas secret:create --scope project --name SUPABASE_URL --value https://sytixskkgfvjjjemmoav.supabase.co
eas secret:create --scope project --name SUPABASE_ANON_KEY --value eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dGl4c2trZ2Z2ampqZW1tb2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjM5ODcsImV4cCI6MjA3OTA5OTk4N30.iKrDcIPF3oJUdmc_ZdInjxynYYxxRNbr96xdVgbhbQ4
```

### Build Commands

**iOS (App Store):**
```bash
eas build --platform ios --profile production
```

**Android (Play Store):**
```bash
eas build --platform android --profile production
```

**Both Platforms:**
```bash
eas build --platform all --profile production
```

### Submit to Stores

**iOS:**
```bash
eas submit --platform ios
```

**Android:**
```bash
eas submit --platform android
```

## Testing Before Submission

### Internal Testing
1. **iOS:** Use TestFlight
   ```bash
   eas build --platform ios --profile preview
   eas submit --platform ios --latest
   ```

2. **Android:** Use Internal Testing track
   ```bash
   eas build --platform android --profile preview
   eas submit --platform android --track internal
   ```

### Test Checklist
- [ ] Login with email and password
- [ ] Login with Face ID / Fingerprint
- [ ] Browse stores as guest
- [ ] Add items to cart
- [ ] Place an order
- [ ] Track order status
- [ ] Chat with driver
- [ ] Upload profile picture
- [ ] Update profile information
- [ ] Password reset flow
- [ ] Push notifications
- [ ] Location permissions
- [ ] Camera permissions
- [ ] Payment flow (Cash on Delivery)
- [ ] Logout functionality

## App Store Listing

### iOS App Store Connect

1. **App Information**
   - Name: ErrandRunners
   - Subtitle: Fast Delivery in Guyana
   - Primary Language: English
   - Category: Food & Drink
   - Secondary Category: Shopping

2. **Pricing**
   - Price: Free
   - Availability: Guyana

3. **App Privacy**
   - Data Types Collected:
     - Contact Info (Name, Email, Phone)
     - Location (Precise Location)
     - User Content (Photos, Messages)
     - Identifiers (User ID)
     - Usage Data (Product Interaction)

4. **Age Rating**
   - 4+ (No objectionable content)

### Google Play Console

1. **Store Listing**
   - App Name: ErrandRunners
   - Short Description: Fast delivery from local stores across Guyana
   - Full Description: (Use full description above)
   - Category: Food & Drink
   - Tags: delivery, groceries, food

2. **Pricing & Distribution**
   - Free
   - Countries: Guyana
   - Content Rating: Everyone

3. **Data Safety**
   - Data Collected:
     - Location (Approximate and Precise)
     - Personal Info (Name, Email, Phone)
     - Photos and Videos
     - Messages
   - Data Usage: App functionality, Analytics
   - Data Sharing: No data shared with third parties

## Support Information

### Contact Details
- **Email:** errandrunners592@gmail.com
- **Phone:** 592-721-9769
- **Website:** https://errandrunners.gy (create this)

### Support URL
Create a support page at: https://errandrunners.gy/support

Include:
- FAQ
- How to place an order
- How to become a driver
- Payment methods
- Contact information

## Post-Launch Checklist

- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Track app analytics
- [ ] Monitor server performance
- [ ] Set up customer support system
- [ ] Create social media presence
- [ ] Plan marketing campaigns
- [ ] Gather user feedback
- [ ] Plan feature updates

## Important Notes

1. **Email Verification:** Currently disabled for faster onboarding. Enable later by updating AuthContext.tsx

2. **Driver Approval:** Only dinelmacey@gmail.com is auto-approved. Other drivers need manual approval.

3. **Admin Access:** 
   - Email: admin@errandrunners.gy
   - Password: Admin1234

4. **Payment:** Currently only Cash on Delivery is supported. Mobile Money integration can be added later.

5. **Google OAuth:** Requires setup in Supabase Dashboard under Authentication > Providers

## Compliance

### GDPR/Privacy Compliance
- Users can delete their account
- Data is stored securely in Supabase
- Users can request data export
- Clear privacy policy

### Accessibility
- Support for screen readers
- Sufficient color contrast
- Touch targets are appropriately sized
- Text is scalable

## Version History

### Version 1.0.0 (Current)
- Initial release
- Store browsing and ordering
- Errand services
- Real-time chat
- Order tracking
- Profile management
- Biometric authentication
- Push notifications

## Future Enhancements

- [ ] Mobile Money payment integration
- [ ] In-app wallet
- [ ] Loyalty program
- [ ] Referral system
- [ ] Advanced search and filters
- [ ] Scheduled deliveries
- [ ] Multiple delivery addresses
- [ ] Order history export
- [ ] Driver earnings dashboard
- [ ] Admin analytics dashboard
