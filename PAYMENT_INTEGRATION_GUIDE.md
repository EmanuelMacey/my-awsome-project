
# 💳 Payment Integration Guide for ErrandRunners

This guide will help you implement additional payment options (Visa, Mastercard, and Mobile Money Guyana) when you're ready to add them to the app.

---

## 📋 Current Status

✅ **Already Implemented:**
- Cash on Delivery (COD)
- Payment method selector UI
- Basic payment flow structure

🔜 **Ready to Implement:**
- Credit/Debit Cards (Visa, Mastercard) via Stripe
- Mobile Money Guyana (MMG)
- Bank Transfer

---

## 🏗️ Architecture Overview

```
User selects payment → Frontend validates → Backend processes → Payment gateway → Confirmation
```

**Required Components:**
1. **Frontend:** Payment method selector UI (✅ Already done)
2. **Backend:** Payment processing endpoints (🔜 To be implemented)
3. **Payment Gateway Integration:** Stripe for cards, MMG API for mobile money
4. **Database:** Payment records and transaction history

---

## 📊 Database Schema Updates Needed

Run these SQL commands in your Supabase SQL Editor:

```sql
-- 1. Add payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'mobile_money', 'bank_transfer', 'cash')),
  provider TEXT, -- 'visa', 'mastercard', 'mmg', etc.
  last_four TEXT,
  is_default BOOLEAN DEFAULT false,
  metadata JSONB, -- Store encrypted tokens, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  errand_id UUID REFERENCES errands(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  gateway_transaction_id TEXT,
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_errand ON payment_transactions(errand_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- 4. Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (true);
```

---

## 💳 Option 1: Stripe Integration (Visa/Mastercard)

### Step 1: Install Stripe SDK

The Stripe SDK is already installed in your project:
```json
"@stripe/stripe-react-native": "^0.57.2"
```

### Step 2: Get Stripe API Keys

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Create an account
3. Get your **Publishable Key** and **Secret Key** from the Dashboard
4. Add them to your `.env` file:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Step 3: Backend Integration

You'll need to create these backend endpoints (contact your backend developer):

```typescript
// POST /api/payments/create-intent
// Creates a Stripe Payment Intent
{
  "amount": 2000,
  "currency": "gyd",
  "orderId": "uuid",
  "customerId": "uuid"
}

// Response:
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}

// POST /api/payments/confirm
// Confirms the payment after user completes card entry
{
  "paymentIntentId": "pi_xxx"
}

// Response:
{
  "status": "succeeded",
  "transactionId": "txn_xxx"
}
```

### Step 4: Frontend Implementation

The Stripe context is already set up in your project. Here's how to use it:

```typescript
// In your checkout screen (CartScreen.tsx or CreateErrandScreen.tsx)
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

const handleStripePayment = async (amount: number) => {
  try {
    // 1. Create payment intent on backend
    const response = await fetch('YOUR_BACKEND_URL/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        currency: 'gyd',
        orderId: orderId,
        customerId: user.id,
      }),
    });

    const { clientSecret } = await response.json();

    // 2. Initialize payment sheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'ErrandRunners',
      returnURL: 'errandrunners://payment-complete',
    });

    if (initError) {
      Alert.alert('Error', initError.message);
      return;
    }

    // 3. Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      Alert.alert('Payment Cancelled', presentError.message);
      return;
    }

    // 4. Payment successful!
    Alert.alert('Success', 'Payment completed successfully!');
    // Continue with order creation...

  } catch (error) {
    console.error('Payment error:', error);
    Alert.alert('Error', 'Payment failed. Please try again.');
  }
};
```

---

## 📱 Option 2: Mobile Money Guyana (MMG) Integration

### Step 1: Contact MMG for API Access

1. **Contact MMG:**
   - Website: [https://www.mmg.gy](https://www.mmg.gy)
   - Email: support@mmg.gy
   - Phone: +592-XXX-XXXX

2. **Request:**
   - API credentials (API Key, Secret)
   - API documentation
   - Test environment access
   - Webhook URL setup

3. **Typical API Endpoints:**
   - `/api/initiate` - Start payment
   - `/api/verify` - Check payment status
   - `/api/callback` - Webhook for payment updates

### Step 2: Backend Integration

Your backend developer will need to implement:

```typescript
// POST /api/payments/mmg/initiate
{
  "phone": "592-XXX-XXXX",
  "amount": 2000,
  "orderId": "uuid",
  "customerId": "uuid"
}

// Response:
{
  "success": true,
  "transactionId": "mmg_txn_xxx",
  "status": "pending",
  "message": "Please approve payment on your phone"
}

// GET /api/payments/mmg/status/:transactionId
// Response:
{
  "status": "completed" | "pending" | "failed",
  "transactionId": "mmg_txn_xxx"
}
```

### Step 3: Frontend Implementation

```typescript
const handleMobileMoneyPayment = async (phoneNumber: string, amount: number) => {
  try {
    setLoading(true);

    // 1. Initiate payment
    const response = await fetch('YOUR_BACKEND_URL/api/payments/mmg/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        amount: amount,
        orderId: orderId,
        customerId: user.id,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // 2. Show prompt to user
      Alert.alert(
        'Approve Payment',
        `Please approve the payment of $${amount} on your phone (${phoneNumber})`,
        [
          {
            text: 'I\'ve Approved',
            onPress: () => pollPaymentStatus(data.transactionId),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert('Error', data.message || 'Failed to initiate payment');
    }
  } catch (error) {
    console.error('MMG payment error:', error);
    Alert.alert('Error', 'Failed to initiate payment');
  } finally {
    setLoading(false);
  }
};

// Poll payment status
const pollPaymentStatus = async (transactionId: string) => {
  let attempts = 0;
  const maxAttempts = 40; // 2 minutes (40 * 3 seconds)

  const interval = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(
        `YOUR_BACKEND_URL/api/payments/mmg/status/${transactionId}`
      );
      const data = await response.json();

      if (data.status === 'completed') {
        clearInterval(interval);
        Alert.alert('Success', 'Payment completed successfully!');
        // Continue with order creation...
      } else if (data.status === 'failed' || attempts >= maxAttempts) {
        clearInterval(interval);
        Alert.alert('Error', 'Payment failed or timed out');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, 3000); // Check every 3 seconds
};
```

---

## 🏦 Option 3: Bank Transfer

For bank transfers, you'll typically:

1. **Display Bank Details:**
   ```typescript
   const bankDetails = {
     bankName: 'Republic Bank Guyana',
     accountName: 'ErrandRunners Ltd',
     accountNumber: 'XXXX-XXXX-XXXX',
     routingNumber: 'XXXX',
   };
   ```

2. **User Process:**
   - User selects "Bank Transfer"
   - Show bank details
   - User makes transfer manually
   - User uploads proof of payment
   - Admin verifies and approves order

3. **Implementation:**
   ```typescript
   const handleBankTransfer = () => {
     Alert.alert(
       'Bank Transfer Details',
       `Bank: ${bankDetails.bankName}\n` +
       `Account: ${bankDetails.accountName}\n` +
       `Number: ${bankDetails.accountNumber}\n\n` +
       'Please make the transfer and upload proof of payment.',
       [
         {
           text: 'Upload Proof',
           onPress: () => handleUploadProof(),
         },
         {
           text: 'Cancel',
           style: 'cancel',
         },
       ]
     );
   };
   ```

---

## 🔒 Security Best Practices

1. **Never store card details directly** - Use Stripe tokenization
2. **Encrypt sensitive data** in database
3. **Use HTTPS only** for all payment requests
4. **Implement rate limiting** to prevent abuse
5. **Log all transactions** for audit trail
6. **Implement 3D Secure** for card payments (Stripe handles this)
7. **Validate amounts on backend** - Never trust frontend values
8. **Use environment variables** for API keys
9. **Implement webhook verification** for payment callbacks
10. **Add fraud detection** (Stripe Radar for cards)

---

## 🧪 Testing

### Stripe Test Cards

Use these test card numbers in test mode:

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Insufficient Funds:** 4000 0000 0000 9995
- **3D Secure Required:** 4000 0027 6000 3184

**Test Details:**
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any postal code

### MMG Testing

Request sandbox credentials from MMG for testing:
- Test phone numbers
- Test transaction IDs
- Simulated approval/decline flows

---

## 📝 Implementation Checklist

### Phase 1: Database Setup
- [ ] Run SQL migrations for payment tables
- [ ] Set up RLS policies
- [ ] Create indexes

### Phase 2: Stripe Integration
- [ ] Get Stripe API keys
- [ ] Add keys to environment variables
- [ ] Implement backend payment intent endpoint
- [ ] Implement backend confirmation endpoint
- [ ] Test with Stripe test cards
- [ ] Implement frontend payment flow
- [ ] Test end-to-end payment

### Phase 3: MMG Integration
- [ ] Contact MMG for API access
- [ ] Get API credentials
- [ ] Review MMG API documentation
- [ ] Implement backend initiate endpoint
- [ ] Implement backend status check endpoint
- [ ] Set up webhook for payment updates
- [ ] Implement frontend payment flow
- [ ] Test with MMG sandbox

### Phase 4: Bank Transfer
- [ ] Set up bank account details
- [ ] Implement proof of payment upload
- [ ] Create admin verification flow
- [ ] Test manual verification process

### Phase 5: Testing & Launch
- [ ] Test all payment methods
- [ ] Test error scenarios
- [ ] Test refund flows
- [ ] Security audit
- [ ] Load testing
- [ ] Go live with real credentials

---

## 🆘 Support & Resources

### Stripe Resources
- Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- React Native Guide: [https://stripe.com/docs/payments/accept-a-payment?platform=react-native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- Support: [https://support.stripe.com](https://support.stripe.com)

### MMG Resources
- Website: [https://www.mmg.gy](https://www.mmg.gy)
- Support: Contact MMG directly for API documentation

### Supabase Resources
- Storage: [https://supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage)
- RLS: [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 💡 Next Steps

1. **Review this guide** with your backend developer
2. **Choose which payment methods** to implement first (recommend Stripe for cards)
3. **Set up test accounts** with payment providers
4. **Implement backend endpoints** for payment processing
5. **Test thoroughly** in sandbox/test mode
6. **Go live** with real credentials when ready

---

## ⚠️ Important Notes

- **All errands are now priced at $2000 GYD** (fixed pricing implemented)
- **Payment methods are already selectable** in the UI
- **Backend integration is required** before payments will actually process
- **Test mode first** - Don't use real money until fully tested
- **PCI compliance** - Stripe handles this for card payments
- **Webhook security** - Verify webhook signatures from payment providers

---

**Questions?** Contact your development team or refer to the payment provider documentation.

**Ready to implement?** Start with Phase 1 (Database Setup) and work through each phase systematically.
