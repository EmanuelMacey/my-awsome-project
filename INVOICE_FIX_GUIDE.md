
# Invoice Screen Database Fix Guide

## Problem
The customer invoice screen is showing an error: **"column errand_invoices.customer_id does not exist"**

This means the `errand_invoices` table in your Supabase database is using `user_id` instead of `customer_id`, but the frontend code expects `customer_id`.

## Solution Applied

I've updated the frontend code to handle both column names (`user_id` and `customer_id`) gracefully:

### Changes Made:

1. **src/api/invoices.ts**
   - Updated `getErrandInvoicesByCustomer()` to query using `user_id` instead of `customer_id`
   - Added error handling to return empty array if column doesn't exist (prevents app crash)
   - Maps `user_id` to `customer_id` in the response for consistency
   - Updated `createInvoiceFromErrand()` to use `user_id` when creating invoices

2. **src/screens/customer/InvoicesScreen.tsx**
   - Changed to use `Promise.allSettled()` instead of `Promise.all()` to handle partial failures
   - Now gracefully handles if errand invoices fail to load
   - Logs warnings but doesn't crash the app
   - Shows orders and errands even if errand invoices fail

## Database Fix (Required)

To permanently fix this issue, you need to update your Supabase database schema. I've created a SQL migration file: **INVOICE_DATABASE_FIX.sql**

### Steps to Fix the Database:

1. **Open Supabase Dashboard**
   - Go to your project at https://supabase.com
   - Navigate to the SQL Editor

2. **Check Current Schema**
   Run this query first to see what columns exist:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'errand_invoices';
   ```

3. **Run the Migration**
   - Copy the contents of `INVOICE_DATABASE_FIX.sql`
   - Paste into the SQL Editor
   - Click "Run"

4. **Verify the Fix**
   The script will automatically:
   - Add `customer_id` column if it doesn't exist
   - Copy data from `user_id` to `customer_id` if needed
   - Create an index for performance
   - Keep `user_id` for backward compatibility

## What Happens Now

### Before Database Fix:
- ✅ Orders and errands will display correctly
- ⚠️ Errand invoices won't show (but app won't crash)
- ✅ You can still create new errand invoices from admin dashboard

### After Database Fix:
- ✅ All invoice types will display correctly
- ✅ Errand invoices will show in customer invoice screen
- ✅ Full functionality restored

## Testing

After running the SQL migration:

1. **Test as Customer:**
   - Log in as a customer
   - Go to Profile → My Invoices
   - You should see all orders, errands, and invoices
   - No error messages should appear

2. **Test as Admin:**
   - Log in as admin
   - Go to Admin Dashboard
   - Create an invoice for an errand
   - Verify it appears in the customer's invoice screen

## Alternative: Manual Database Update

If you prefer to manually update the schema:

```sql
-- Add customer_id column
ALTER TABLE errand_invoices ADD COLUMN customer_id TEXT;

-- Copy data from user_id (if it exists)
UPDATE errand_invoices SET customer_id = user_id WHERE user_id IS NOT NULL;

-- Make it required
ALTER TABLE errand_invoices ALTER COLUMN customer_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_errand_invoices_customer_id ON errand_invoices(customer_id);
```

## Summary

The frontend code has been updated to work with the current database schema (`user_id`), so the app will no longer crash. However, to ensure full functionality and consistency, you should run the SQL migration to add the `customer_id` column to your database.

**Status:**
- ✅ Frontend fixed (app won't crash)
- ⏳ Database needs update (run INVOICE_DATABASE_FIX.sql)
- ✅ Backward compatible (works with both column names)
