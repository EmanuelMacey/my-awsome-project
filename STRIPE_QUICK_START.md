
# Stripe Integration - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Stripe Keys

Visit: https://dashboard.stripe.com/test/apikeys

Copy:
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

### 2. Add to .env

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. Add to Supabase

1. Go to Supabase Dashboard
2. Edge Functions → Secrets
3. Add: `STRIPE_SECRET_KEY` = `sk_test_your_key_here`

### 4. Rebuild App

```bash
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

## 🧪 Test Payment

1. Add items to cart
2. Select "Credit/Debit Card"
3. Use test card: **4242 4242 4242 4242**
4. Any future date + any CVC
5. Complete payment ✅

## 📁 Files Modified

- `app.json` - Added Stripe plugin
- `.env` - Added publishable key
- `src/contexts/StripeContext.tsx` - New Stripe provider
- `src/components/StripePaymentSheet.tsx` - New payment UI
- `src/screens/customer/CartScreen.tsx` - Integrated Stripe
- `src/api/payment.ts` - Updated payment API
- Edge Function: `create-payment-intent` - Server-side payment

## 🔑 Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 9995 | ❌ Declined |
| 4000 0025 0000 3155 | 🔐 Requires 3DS |

## ⚠️ Important

- **Stripe NOT supported in Expo Go** - Must use development build
- **Secret key NEVER in client code** - Only in Supabase Edge Function
- **Test mode only** - Switch to live keys for production

## 🐛 Common Issues

**"Stripe Not Configured"**
→ Check `.env` has correct publishable key

**"Failed to create payment intent"**
→ Check Supabase has correct secret key

**Payment sheet not showing**
→ Must use development build, not Expo Go

## 📚 Full Documentation

See `STRIPE_INTEGRATION_GUIDE.md` for complete details.
