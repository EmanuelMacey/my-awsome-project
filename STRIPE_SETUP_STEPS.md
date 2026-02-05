
# Stripe Setup - Action Items

## 🎯 What You Need to Do

Follow these steps to complete the Stripe payment integration:

### Step 1: Get Your Stripe API Keys (5 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Make sure you're in **Test Mode** (toggle in top right corner)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### Step 2: Add Publishable Key to .env File (1 minute)

Open your `.env` file and add this line:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

Replace `pk_test_YOUR_KEY_HERE` with your actual publishable key from Step 1.

### Step 3: Add Secret Key to Supabase (2 minutes)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/sytixskkgfvjjjemmoav
2. Click on **Edge Functions** in the left sidebar
3. Click on **Secrets** tab
4. Click **Add Secret**
5. Enter:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Your secret key from Step 1 (starts with `sk_test_`)
6. Click **Save**

### Step 4: Rebuild the App (5 minutes)

Since Stripe requires native modules, you need to rebuild the app:

```bash
# Clean and rebuild
npx expo prebuild --clean

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

**Important:** Stripe does NOT work in Expo Go. You must use a development build.

### Step 5: Test the Payment Flow (2 minutes)

1. Open the app on your device/simulator
2. Log in as a customer
3. Add items to cart
4. Proceed to checkout
5. Select **"Credit/Debit Card"** or **"Mastercard"**
6. Pin your delivery location
7. Confirm order
8. When the payment sheet appears, enter:
   - **Card Number:** 4242 4242 4242 4242
   - **Expiry:** Any future date (e.g., 12/34)
   - **CVC:** Any 3 digits (e.g., 123)
9. Click **Pay**
10. Verify payment succeeds and receipt is shown

## ✅ Verification Checklist

- [ ] Stripe publishable key added to `.env`
- [ ] Stripe secret key added to Supabase Edge Function secrets
- [ ] App rebuilt with `npx expo prebuild --clean`
- [ ] App running on device/simulator (not Expo Go)
- [ ] Test payment completed successfully
- [ ] Order status updated to "completed"
- [ ] Receipt displayed after payment

## 🧪 Test Cards

Use these cards for testing different scenarios:

| Card Number         | Result                          |
|---------------------|---------------------------------|
| 4242 4242 4242 4242 | ✅ Successful payment           |
| 4000 0000 0000 9995 | ❌ Declined (insufficient funds)|
| 4000 0000 0000 0002 | ❌ Declined (generic)           |
| 4000 0025 0000 3155 | 🔐 Requires 3D Secure auth      |

## 🐛 Common Issues

### "Stripe Not Configured" Error

**Problem:** Publishable key not found

**Solution:**
1. Check `.env` file has `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Restart development server
3. Rebuild app

### "Failed to create payment intent" Error

**Problem:** Secret key not set in Supabase

**Solution:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Verify `STRIPE_SECRET_KEY` is set
3. Make sure it starts with `sk_test_`

### Payment Sheet Not Appearing

**Problem:** Running in Expo Go

**Solution:**
1. Stripe requires native modules
2. Must use development build
3. Run `npx expo run:ios` or `npx expo run:android`

### "No active session" Error

**Problem:** User not authenticated

**Solution:**
1. Make sure user is logged in
2. Try logging out and back in
3. Check Supabase auth is working

## 📞 Need Help?

If you encounter any issues:

1. Check the detailed guide: `STRIPE_INTEGRATION_GUIDE.md`
2. Review the quick start: `STRIPE_QUICK_START.md`
3. Check Stripe logs: https://dashboard.stripe.com/test/logs
4. Check Supabase logs: Edge Functions → Logs

## 🎉 You're Done!

Once you complete these steps, your app will have fully functional Stripe payment processing in test mode. Customers can now pay with credit/debit cards securely!

## 🚀 Going Live

When you're ready to accept real payments:

1. Switch to **Live Mode** in Stripe Dashboard
2. Get your live API keys (pk_live_... and sk_live_...)
3. Update `.env` with live publishable key
4. Update Supabase secrets with live secret key
5. Test thoroughly with small amounts
6. Enable webhooks for production
7. Implement proper currency conversion (GYD to USD)

---

**Current Status:** ✅ Integration Complete - Ready for Testing

**Test Mode:** ✅ Enabled (No real charges)

**Next Action:** Follow Step 1 above to get your Stripe API keys
