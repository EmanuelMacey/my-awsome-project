
# Stripe Payment Integration Guide

This guide explains how to set up and use Stripe payment processing in test mode for the ErrandRunners app.

## Overview

The app now supports Stripe payment processing for card payments. The integration uses:

- **@stripe/stripe-react-native** - Client-side Stripe SDK for React Native
- **Supabase Edge Function** - Server-side payment intent creation using STRIPE_SECRET_KEY
- **Test Mode** - All payments are processed in Stripe test mode

## Setup Instructions

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 2. Configure Environment Variables

#### Client-Side (.env file)

Add your Stripe publishable key to the `.env` file:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

#### Server-Side (Supabase Edge Function)

The `STRIPE_SECRET_KEY` must be set as a secret in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_test_your_secret_key_here`

**IMPORTANT:** Never commit your secret key to version control!

### 3. Rebuild the App

After adding the Stripe configuration, you need to rebuild the app:

```bash
# For development build
npx expo prebuild --clean

# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

**Note:** Stripe is not supported in Expo Go. You must create a development build.

## How It Works

### Payment Flow

1. **Customer adds items to cart** and proceeds to checkout
2. **Customer selects card payment** method
3. **Customer confirms order** - Order is created in database
4. **Stripe Payment Sheet appears** with card input form
5. **Customer enters card details** (test card: 4242 4242 4242 4242)
6. **Payment is processed** via Stripe
7. **Order status is updated** to completed
8. **Receipt is displayed** to customer

### Architecture

```
┌─────────────────┐
│   CartScreen    │
│  (React Native) │
└────────┬────────┘
         │
         ├─ Create Order (Supabase)
         │
         ├─ Show Stripe Payment Sheet
         │
         ├─ Call Edge Function
         │  (create-payment-intent)
         │
         ├─ Stripe SDK confirms payment
         │
         └─ Update order status
```

### Edge Function: create-payment-intent

Located in Supabase Edge Functions, this function:

- Accepts order details (amount, orderId, customerId)
- Creates a Stripe PaymentIntent using STRIPE_SECRET_KEY
- Returns clientSecret to the client
- Handles errors securely

**Endpoint:** `https://sytixskkgfvjjjemmoav.supabase.co/functions/v1/create-payment-intent`

## Testing

### Test Card Numbers

Use these test cards in Stripe test mode:

| Card Number         | Description                    |
|---------------------|--------------------------------|
| 4242 4242 4242 4242 | Successful payment             |
| 4000 0000 0000 9995 | Declined (insufficient funds)  |
| 4000 0000 0000 0002 | Declined (generic decline)     |
| 4000 0025 0000 3155 | Requires authentication (3DS)  |

**Card Details:**
- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any postal code (if enabled)

### Testing the Integration

1. **Add items to cart**
2. **Proceed to checkout**
3. **Select "Credit/Debit Card" or "Mastercard"** payment method
4. **Pin delivery location**
5. **Confirm order**
6. **Enter test card details** in the Stripe payment sheet
7. **Complete payment**
8. **Verify order status** is updated to "completed"

## Currency Conversion

The app uses Guyanese Dollars (GYD) for pricing, but Stripe processes payments in USD. The conversion is handled automatically:

- Cart total is in GYD (e.g., GYD$5000)
- Stripe payment is in USD cents (e.g., $50.00 = 5000 cents)
- No actual currency conversion is performed (1 GYD = 1 cent USD for testing)

**For production:** Implement proper currency conversion based on current exchange rates.

## Security Considerations

### ✅ Secure Practices

- Secret key is stored in Supabase Edge Function secrets
- Payment intent creation happens server-side
- Client only receives clientSecret (safe to expose)
- JWT authentication required for Edge Function calls

### ❌ Never Do This

- Don't commit STRIPE_SECRET_KEY to version control
- Don't expose secret key in client-side code
- Don't store card details in your database
- Don't process payments client-side only

## Troubleshooting

### "Stripe Not Configured" Error

**Cause:** EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set or invalid

**Solution:**
1. Check `.env` file has the correct publishable key
2. Ensure key starts with `pk_test_`
3. Restart the development server
4. Rebuild the app

### "Failed to create payment intent" Error

**Cause:** STRIPE_SECRET_KEY is not set in Supabase or is invalid

**Solution:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Verify STRIPE_SECRET_KEY is set correctly
3. Ensure key starts with `sk_test_`
4. Redeploy the Edge Function if needed

### Payment Sheet Not Appearing

**Cause:** Running in Expo Go (Stripe not supported)

**Solution:**
1. Create a development build: `npx expo run:ios` or `npx expo run:android`
2. Stripe requires native modules that aren't available in Expo Go

### "No active session" Error

**Cause:** User is not authenticated

**Solution:**
1. Ensure user is logged in
2. Check Supabase auth session is valid
3. Try logging out and back in

## Going to Production

When you're ready to accept real payments:

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get live API keys** (pk_live_... and sk_live_...)
3. **Update environment variables** with live keys
4. **Test thoroughly** with real cards (small amounts)
5. **Enable webhooks** for payment status updates
6. **Implement proper currency conversion**
7. **Add refund functionality**
8. **Set up Stripe Connect** (if needed for marketplace)

## Additional Features to Implement

### Webhooks

Set up Stripe webhooks to handle:
- Payment succeeded
- Payment failed
- Refund processed
- Dispute created

### Refunds

Implement refund functionality:
1. Create Edge Function for refunds
2. Add refund button in admin panel
3. Update order status on refund

### Payment Methods

Add support for:
- Apple Pay (iOS)
- Google Pay (Android)
- Bank transfers
- Local payment methods

## Support

For issues or questions:

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe React Native:** https://github.com/stripe/stripe-react-native
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

## Test Mode Indicator

The app displays "Test Mode" indicators when using Stripe test keys:
- In payment method selector
- In Stripe payment sheet
- In order confirmation

This helps distinguish test transactions from real ones.
