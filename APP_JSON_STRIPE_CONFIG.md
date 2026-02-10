
# app.json Stripe Configuration

## What Was Added

The following Stripe plugin configuration was added to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.errandrunners.app",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

## Configuration Options

### merchantIdentifier (iOS Only)

- **Purpose:** Required for Apple Pay on iOS
- **Current Value:** `"merchant.com.errandrunners.app"`
- **Format:** Must start with `merchant.`

**To enable Apple Pay:**
1. Go to https://developer.apple.com/account
2. Navigate to Certificates, Identifiers & Profiles
3. Create a Merchant ID
4. Update the `merchantIdentifier` in `app.json`
5. Follow Apple Pay setup guide: https://stripe.com/docs/apple-pay

### enableGooglePay (Android Only)

- **Purpose:** Enables Google Pay on Android
- **Current Value:** `true`
- **Options:** `true` or `false`

**To enable Google Pay:**
1. Google Pay is enabled by default with this config
2. Test on a physical Android device (not emulator)
3. Ensure Google Pay is set up on the device
4. Follow Google Pay setup guide: https://stripe.com/docs/google-pay

## Important Notes

### Apple Pay

- **Not available in Expo Go** - Requires development build
- **Requires merchant identifier** from Apple Developer account
- **Test on physical iOS device** - Simulator has limitations
- **Requires iOS 13+**

### Google Pay

- **Not available in Expo Go** - Requires development build
- **Test on physical Android device** - Emulator may not work
- **Requires Google Play Services**
- **User must have Google Pay set up**

## Testing

### Without Apple Pay / Google Pay

The current implementation works with standard card payments without requiring Apple Pay or Google Pay setup. Users can:

- Enter card details manually
- Use test card: 4242 4242 4242 4242
- Complete payments without native payment methods

### With Apple Pay / Google Pay

To enable native payment methods:

1. **Complete merchant setup** (Apple/Google)
2. **Update configuration** in `app.json`
3. **Rebuild the app** with `npx expo prebuild --clean`
4. **Test on physical device**

## Rebuild Required

After modifying `app.json`, you must rebuild the app:

```bash
# Clean previous builds
npx expo prebuild --clean

# Rebuild for iOS
npx expo run:ios

# Rebuild for Android
npx expo run:android
```

## Current Status

✅ **Stripe plugin configured** in `app.json`
✅ **Google Pay enabled** for Android
✅ **Apple Pay configured** with placeholder merchant ID
⚠️ **Apple Pay requires** valid merchant ID from Apple Developer account
✅ **Standard card payments** work without additional setup

## Next Steps

### For Testing (Current Setup)

No additional configuration needed. Standard card payments work out of the box.

### For Production (Apple Pay)

1. Create Apple Merchant ID
2. Update `merchantIdentifier` in `app.json`
3. Configure Apple Pay in Stripe Dashboard
4. Rebuild and test on iOS device

### For Production (Google Pay)

1. Register with Google Pay
2. Configure Google Pay in Stripe Dashboard
3. Test on Android device

## Resources

- [Stripe React Native Setup](https://github.com/stripe/stripe-react-native#installation)
- [Apple Pay Setup](https://stripe.com/docs/apple-pay)
- [Google Pay Setup](https://stripe.com/docs/google-pay)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
