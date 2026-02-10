
# Database Migration Guide - Service Fee & Order Numbers

## Overview
This migration adds the `service_fee` column to the orders table and fixes order/errand number generation to start from 1.

## What This Migration Does

### 1. Adds Service Fee Column
- Adds `service_fee` column to `orders` table (default: GYD$200)
- Updates existing orders to have service_fee = 200
- All future orders will automatically include the service fee

### 2. Fixes Order Number Generation
- Order numbers now start from 1: ORD-000001, ORD-000002, etc.
- Errand numbers now start from 1: ER-000001, ER-000002, etc.
- Sequential numbering is guaranteed even with concurrent inserts

### 3. Receipt Display
- Order numbers display as #1, #2, #3 (extracts numeric part)
- Service fee is now shown in the receipt breakdown
- Total calculation is now correct: Subtotal + Service Fee + Delivery Fee + Tax - Discount

## How to Run the Migration

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **MaceyRunners**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **New Query**
2. Copy the entire contents of `supabase/migrations/004_add_service_fee_to_orders.sql`
3. Paste into the SQL Editor
4. Click **Run** button

### Step 3: Verify the Migration
Run this query to verify:
```sql
-- Check if service_fee column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'service_fee';

-- Check order number generation
SELECT order_number, service_fee, total, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see:
- `service_fee` column exists with type `numeric` and default `200`
- All orders have `service_fee = 200`
- Order numbers follow the pattern: ORD-000001, ORD-000002, etc.

## What Changed in the App

### Frontend Changes
1. **ReceiptModal.tsx**: 
   - Displays order numbers as #1, #2, #3 (extracts numeric part)
   - Shows service fee in breakdown
   - Calculates total correctly

2. **CartScreen.tsx**: 
   - Passes service_fee (200) when creating orders

3. **DriverDashboardScreen.tsx**: 
   - Added profile button in header for easy access to profile/logout

4. **app/driver/profile.tsx**: 
   - Created route for driver profile screen

5. **app.json**: 
   - Configured background notifications for iOS and Android
   - Added necessary permissions for notifications when app is closed

### Database Changes
- `orders.service_fee` column added (DECIMAL(10, 2), default 200)
- Order number trigger updated to start from 1
- Errand number trigger updated to start from 1

## Testing

### Test Order Numbers
1. Place a new order as a customer
2. Check the receipt - order number should display as #1, #2, etc.
3. Verify the database shows ORD-000001, ORD-000002, etc.

### Test Service Fee
1. Place an order
2. Check the receipt breakdown
3. Verify you see:
   - Subtotal: (sum of items)
   - Service Fee: GYD$200
   - Delivery Fee: (calculated)
   - Total: (correct sum)

### Test Driver Profile
1. Login as a driver
2. Go to Driver Dashboard
3. Tap the 👤 profile icon in the top right
4. Verify you can:
   - View/edit profile information
   - See TIN number field
   - Logout

### Test Background Notifications
1. Login as a driver
2. Close the app or turn off screen
3. Have a customer place an order
4. Driver should receive notification even when app is closed

## Troubleshooting

### Service Fee Not Showing
- Run the migration SQL in Supabase
- Restart the app
- Place a new order

### Order Numbers Not Starting from 1
- The migration fixes the trigger
- New orders will use the correct numbering
- Existing orders keep their old numbers

### Driver Profile Not Accessible
- Make sure you're logged in as a driver (not customer/admin)
- The profile button is in the top right of the Driver Dashboard
- If missing, restart the app

### Background Notifications Not Working
- Check notification permissions in device settings
- For iOS: Settings → MaceyRunners → Notifications → Allow Notifications
- For Android: Settings → Apps → MaceyRunners → Notifications → Allow
- Make sure the app has been opened at least once to register for notifications

## Support
For issues, contact: 592-721-9769
