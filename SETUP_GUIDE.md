
# ErrandRunners - Complete Setup Guide

This guide will walk you through setting up the ErrandRunners app from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier is fine)
- Expo CLI installed globally: `npm install -g expo-cli`
- A mobile device or emulator for testing

## Step 1: Clone and Install

```bash
# Navigate to your project directory
cd ErrandRunners

# Install dependencies
npm install
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: ErrandRunners
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (takes ~2 minutes)

## Step 3: Configure Environment Variables

1. In your Supabase project, go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **anon public key**

3. Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace the values with your actual Supabase credentials!

## Step 4: Set Up Database

1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase_setup.sql`
4. Paste into the SQL Editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. Wait for the script to complete
7. You should see a success message in the results panel

### Verify Database Setup

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- users
- stores
- store_items
- orders
- order_items
- messages

## Step 5: Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - ✅ orders
   - ✅ messages

3. Go to **Project Settings** → **Realtime**
4. **IMPORTANT**: Enable **"Private channels only"**
   - This ensures better security
   - All channels will require authentication

## Step 6: Set Up Storage

1. Go to **Storage** in your Supabase dashboard
2. Click "Create a new bucket"
3. Bucket details:
   - **Name**: `images`
   - **Public bucket**: ✅ Yes (for easier access)
   - **File size limit**: 5MB (or as needed)
4. Click "Create bucket"

### Upload Sample Images (Optional)

You can upload store logos and item images:

1. Click on the `images` bucket
2. Create folders: `stores/` and `items/`
3. Upload images to respective folders
4. Copy the public URLs for use in your database

## Step 7: Add Sample Data

### Add Sample Stores

The `supabase_setup.sql` script already added 5 sample stores. To verify:

```sql
SELECT id, name, category FROM stores;
```

### Add Sample Items

1. Get a store ID from the query above
2. Run this query (replace `store-id-here` with actual UUID):

```sql
INSERT INTO store_items (store_id, name, price, image) VALUES
('store-id-here', 'Apples (1kg)', 2.99, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6'),
('store-id-here', 'Bread', 3.49, 'https://images.unsplash.com/photo-1509440159596-0249088772ff'),
('store-id-here', 'Milk (1L)', 4.99, 'https://images.unsplash.com/photo-1563636619-e9143da7973b'),
('store-id-here', 'Eggs (12)', 5.99, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f'),
('store-id-here', 'Cheese', 6.99, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d');
```

Repeat for other stores with different items.

## Step 8: Test Authentication

### Create Test Users

1. Go to **Authentication** → **Users** in Supabase
2. Click "Add user" → "Create new user"
3. Create two test users:

**Customer User**:
- Email: `customer@test.com`
- Password: `test123456`
- Auto Confirm User: ✅ Yes

**Driver User**:
- Email: `driver@test.com`
- Password: `test123456`
- Auto Confirm User: ✅ Yes

### Add User Profiles

After creating users, add their profiles to the `users` table:

```sql
-- Get the user IDs from auth.users
SELECT id, email FROM auth.users;

-- Insert customer profile (replace user-id-here)
INSERT INTO users (id, name, phone, email, role) VALUES
('customer-user-id-here', 'Test Customer', '+592 123 4567', 'customer@test.com', 'customer');

-- Insert driver profile (replace user-id-here)
INSERT INTO users (id, name, phone, email, role) VALUES
('driver-user-id-here', 'Test Driver', '+592 987 6543', 'driver@test.com', 'driver');
```

## Step 9: Run the App

### Start Development Server

```bash
npm run dev
```

This will start the Expo development server.

### Test on Device

**Option 1: Physical Device**
1. Install "Expo Go" app from App Store or Google Play
2. Scan the QR code shown in terminal
3. App will load on your device

**Option 2: iOS Simulator (Mac only)**
```bash
npm run ios
```

**Option 3: Android Emulator**
```bash
npm run android
```

**Option 4: Web Browser**
```bash
npm run web
```

## Step 10: Test the App

### Test Customer Flow

1. **Login**:
   - Email: `customer@test.com`
   - Password: `test123456`

2. **Browse Stores**:
   - You should see the 5 sample stores
   - Tap on a store to view items

3. **Add to Cart**:
   - Tap on items to add to cart
   - Adjust quantities
   - View cart

4. **Place Order**:
   - Tap "Place Order" in cart
   - Order should be created successfully
   - Navigate to Orders screen to see your order

### Test Driver Flow

1. **Logout** from customer account

2. **Login as Driver**:
   - Email: `driver@test.com`
   - Password: `test123456`

3. **View Orders**:
   - You should see the pending order from customer
   - Tap on the order to view details

4. **Accept Order**:
   - Tap "Accept Order"
   - Status should change to "accepted"

5. **Update Status**:
   - Tap "Mark as In Transit"
   - Tap "Mark as Delivered"

### Test Real-time Features

**Test Order Status Updates**:

1. Login as customer on one device/browser
2. Login as driver on another device/browser
3. Customer: Open an order detail screen
4. Driver: Update the order status
5. **Expected**: Customer sees status update instantly without refreshing

**Test Real-time Chat**:

1. Customer: Open chat with driver
2. Driver: Open chat with customer
3. Send messages from both sides
4. **Expected**: Messages appear instantly on both sides

## Troubleshooting

### App Won't Start

**Check**:
- Node.js version: `node --version` (should be 18+)
- Dependencies installed: `npm install`
- No port conflicts (default: 8081)

**Fix**:
```bash
# Clear cache and restart
npm start -- --clear
```

### Can't Connect to Supabase

**Check**:
- `.env` file exists and has correct values
- Supabase project is running (not paused)
- Internet connection is stable

**Fix**:
```bash
# Restart app after updating .env
npm start -- --clear
```

### Authentication Errors

**Check**:
- User exists in `auth.users` table
- User profile exists in `users` table
- Email is confirmed (auto-confirm enabled)

**Fix**:
```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'your-email@test.com';

-- Check if profile exists
SELECT * FROM users WHERE email = 'your-email@test.com';
```

### Realtime Not Working

**Check**:
1. Realtime enabled for tables (Database → Replication)
2. Triggers exist and are active
3. RLS policies on `realtime.messages` table
4. "Private channels only" enabled in settings

**Debug**:
```sql
-- Check triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%realtime%';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'realtime';
```

See `REALTIME_SETUP.md` for detailed troubleshooting.

### No Stores Showing

**Check**:
- Sample data was inserted
- RLS policies allow reading stores

**Fix**:
```sql
-- Check if stores exist
SELECT * FROM stores;

-- If empty, run the INSERT statements from supabase_setup.sql
```

### Images Not Loading

**Check**:
- Storage bucket `images` exists
- Bucket is public or has proper RLS policies
- Image URLs are correct

**Fix**:
1. Go to Storage → images
2. Check bucket settings
3. Make bucket public if needed
4. Update image URLs in database

## Next Steps

### Customize the App

1. **Update Branding**:
   - Edit `src/styles/theme.ts` for colors
   - Update app name in `app.json`
   - Add your logo

2. **Add More Stores**:
   - Insert stores via SQL or build admin interface
   - Upload store logos to storage
   - Add store items

3. **Configure for Production**:
   - Update RLS policies for production use
   - Set up proper storage policies
   - Configure email templates in Supabase
   - Set up custom domain (optional)

### Deploy the App

**For Testing**:
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

**For Production**:
1. Set up EAS (Expo Application Services)
2. Configure app signing
3. Submit to App Store / Google Play

See [Expo documentation](https://docs.expo.dev/build/introduction/) for details.

## Additional Resources

- **Realtime Setup**: See `REALTIME_SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **React Native Docs**: [reactnative.dev](https://reactnative.dev)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Verify Supabase configuration
4. Check database triggers and RLS policies
5. Test with sample data first

## Summary

You should now have:
- ✅ Supabase project configured
- ✅ Database with tables and triggers
- ✅ Realtime enabled and configured
- ✅ Storage bucket for images
- ✅ Sample data for testing
- ✅ Test users (customer and driver)
- ✅ App running on device/emulator
- ✅ Real-time features working

The app is ready for testing and development!

---

**Important Notes**:
- Keep your `.env` file secure (never commit to git)
- Use strong passwords for production
- Enable "Private channels only" for better security
- Test thoroughly before deploying to production
- Monitor Supabase usage to stay within free tier limits
