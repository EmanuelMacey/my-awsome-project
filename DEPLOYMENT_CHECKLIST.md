
# ErrandRunners - Pre-Deployment Checklist

## ✅ Store Images
- [x] Gangbao logo updated
- [x] Popeyes (Louisiana Kitchen) logo updated
- [x] Golden Pagoda logo updated
- [x] KFC logo updated
- [x] Fireside Grill and Chill logo updated

## ✅ App Configuration
- [x] app.json configured with bundle identifiers
- [x] iOS bundle identifier: com.errandrunners.app
- [x] Android package: com.errandrunners.app
- [x] Permissions configured (location, camera, notifications)
- [x] eas.json configured for production builds
- [ ] EAS project ID updated in app.json
- [ ] App icon created (512x512 for Android, 1024x1024 for iOS)
- [ ] Splash screen configured

## 📱 iOS App Store
- [ ] Apple Developer Account created ($99/year)
- [ ] App created in App Store Connect
- [ ] Bundle ID registered: com.errandrunners.app
- [ ] Apple Team ID added to eas.json
- [ ] App Store Connect App ID added to eas.json
- [ ] Screenshots prepared (6.7", 6.5", 12.9")
- [ ] App description written
- [ ] Keywords added
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Demo account credentials provided
- [ ] Age rating completed
- [ ] Export compliance confirmed

## 🤖 Google Play Store
- [ ] Google Play Developer Account created ($25 one-time)
- [ ] App created in Google Play Console
- [ ] Service account JSON key created
- [ ] google-play-service-account.json added to project
- [ ] Screenshots prepared (phone, 7", 10" tablet)
- [ ] App icon created (512x512)
- [ ] Feature graphic created (1024x500)
- [ ] App description written
- [ ] Short description written (80 chars)
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] Store listing category set

## 🧪 Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test order placement
- [ ] Test order tracking
- [ ] Test driver assignment
- [ ] Test chat functionality
- [ ] Test errand creation
- [ ] Test payment (COD)
- [ ] Test notifications
- [ ] Test location services
- [ ] Test image uploads
- [ ] Test all store images display correctly

## 📄 Legal & Compliance
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted
- [ ] Support email set up (support@errandrunners.com)
- [ ] Support phone number active (592-7219769)
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Data retention policy defined

## 🔐 Security
- [ ] API keys secured in environment variables
- [ ] Supabase RLS policies enabled
- [ ] Authentication flows tested
- [ ] Password reset flow tested
- [ ] User data encryption verified

## 📊 Analytics & Monitoring
- [ ] Crash reporting set up (optional)
- [ ] Analytics configured (optional)
- [ ] Error logging configured
- [ ] Performance monitoring set up (optional)

## 🚀 Build & Deploy
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] Project configured: `eas build:configure`
- [ ] iOS production build: `eas build --platform ios --profile production`
- [ ] Android production build: `eas build --platform android --profile production`
- [ ] iOS submission: `eas submit --platform ios --profile production`
- [ ] Android submission: `eas submit --platform android --profile production`

## 📝 Post-Submission
- [ ] Monitor App Store Connect for review status
- [ ] Monitor Google Play Console for review status
- [ ] Prepare for potential rejection feedback
- [ ] Set up app store optimization (ASO)
- [ ] Plan marketing strategy
- [ ] Prepare customer support resources

## 🎯 Quick Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for production
eas build --platform all --profile production

# Submit to stores
eas submit --platform all --profile production
```

## 📞 Need Help?

- **Email:** support@errandrunners.com
- **Phone:** 592-7219769
- **Documentation:** See DEPLOYMENT_GUIDE.md

---

**Last Updated:** January 2025
**App Version:** 1.0.0
**Status:** Ready for deployment after completing checklist items
