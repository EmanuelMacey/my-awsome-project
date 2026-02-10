
# 🔨 Quick Build Instructions

## 🚀 Build APK for Testing (Recommended First Step)

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Build
```bash
eas build:configure
```

### 4. Build APK
```bash
eas build --platform android --profile preview
```

This will:
- ✅ Build a standalone APK
- ✅ You can download and install directly on Android devices
- ✅ Test all features before Play Store submission

### 5. Download and Test
- EAS will provide a download link
- Install on your Android device
- Test all features thoroughly

## 📦 Build for Play Store (After Testing)

### 1. Build App Bundle
```bash
eas build --platform android --profile production
```

This will:
- ✅ Create an optimized .aab file
- ✅ Ready for Play Store submission
- ✅ Smaller download size for users

### 2. Submit to Play Store
```bash
eas submit --platform android
```

Or manually:
1. Download the .aab file from EAS
2. Go to Google Play Console
3. Upload the .aab file
4. Complete store listing
5. Submit for review

## ⚡ Quick Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]

# Clear build cache
eas build:clear-cache
```

## 🐛 If Build Fails

1. **Check credentials:**
   ```bash
   eas credentials
   ```

2. **Clear cache and retry:**
   ```bash
   eas build:clear-cache
   eas build --platform android --profile preview
   ```

3. **Check logs:**
   - View build logs in EAS dashboard
   - Look for specific error messages

## 📱 Testing Checklist

After installing the APK, test:
- ✅ App launches without crashing
- ✅ Login/Register works
- ✅ Browse stores
- ✅ Add items to cart
- ✅ Place orders
- ✅ Track orders
- ✅ Chat functionality
- ✅ Create errands
- ✅ Driver dashboard (if you're a driver)
- ✅ Admin dashboard (if you're admin)
- ✅ Notifications work
- ✅ Location tracking works
- ✅ Camera/image upload works

## 🎯 Current Configuration

- **App Name:** ErrandRunners
- **Package:** com.errandrunners.app
- **Version:** 1.0.0
- **Logo:** ErrandRunners logo (e960eb8d-de2e-45b3-a0ca-f9be3deec1e3.png)

## 📞 Need Help?

- Email: errandrunners592@gmail.com
- Phone: 592-721-9769
