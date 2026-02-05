
# ErrandRunners - Quick Start Guide

Get up and running with ErrandRunners in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- A Supabase account

## 1. Install Dependencies (1 min)

```bash
npm install
```

## 2. Set Up Supabase (3 min)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase_setup.sql`
3. Go to **Database** → **Replication** and enable:
   - ✅ orders
   - ✅ messages
4. Go to **Project Settings** → **Realtime** and enable:
   - ✅ Private channels only

## 3. Configure Environment (1 min)

Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from **Project Settings** → **API** in Supabase.

## 4. Create Test Users (2 min)

In Supabase, go to **Authentication** → **Users** and create:

**Customer**:
- Email: `customer@test.com`
- Password: `test123456`
- Auto Confirm: ✅

**Driver**:
- Email: `driver@test.com`
- Password: `test123456`
- Auto Confirm: ✅

Then run this SQL (replace IDs):

```sql
-- Get user IDs
SELECT id, email FROM auth.users;

-- Add profiles
INSERT INTO users (id, name, phone, email, role) VALUES
('customer-id', 'Test Customer', '+1234567890', 'customer@test.com', 'customer'),
('driver-id', 'Test Driver', '+0987654321', 'driver@test.com', 'driver');
```

## 5. Run the App (1 min)

```bash
npm run dev
```

Scan QR code with Expo Go app or press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## 6. Test It Out (2 min)

### As Customer:
1. Login with `customer@test.com`
2. Browse stores
3. Add items to cart
4. Place an order
5. View order status

### As Driver:
1. Login with `driver@test.com`
2. View pending orders
3. Accept an order
4. Update status to "In Transit"
5. Update status to "Delivered"

### Test Realtime:
1. Open customer app on one device
2. Open driver app on another device
3. Customer: View order details
4. Driver: Update order status
5. **Watch**: Customer sees update instantly! ⚡

## What's Included

✅ **Authentication**: Login/Register with email
✅ **Customer App**: Browse stores, order items, track delivery
✅ **Driver App**: Accept orders, update status, deliver
✅ **Real-time Updates**: Order status changes instantly
✅ **Real-time Chat**: Message between customer and driver
✅ **Secure**: RLS policies protect all data

## Key Features

### Real-time Order Tracking
When a driver updates an order status, the customer sees it instantly without refreshing.

### Real-time Messaging
Chat messages appear immediately on both customer and driver screens.

### Role-Based Access
- Customers can only see their own orders
- Drivers can only see assigned orders
- All data is protected with RLS policies

## Architecture

```
React Native App (Expo)
    ↓
Supabase Client SDK
    ↓
Supabase Backend
    ├── Auth (User management)
    ├── Database (PostgreSQL)
    ├── Realtime (WebSockets)
    └── Storage (Images)
```

## File Structure

```
app/                    # Screens (Expo Router)
src/
  ├── api/             # API functions
  ├── components/      # Reusable components
  ├── contexts/        # React contexts
  ├── screens/         # Screen components
  ├── config/          # Supabase config
  ├── styles/          # Theme and styles
  └── types/           # TypeScript types
```

## Common Commands

```bash
# Start development server
npm run dev

# Start with cache cleared
npm start -- --clear

# Run on specific platform
npm run ios
npm run android
npm run web

# Install new dependency
npm install package-name
```

## Troubleshooting

### App won't start
```bash
npm install
npm start -- --clear
```

### Can't login
- Check `.env` file has correct Supabase credentials
- Verify user exists in Supabase Auth
- Check user profile exists in `users` table

### Realtime not working
- Enable replication for `orders` and `messages` tables
- Enable "Private channels only" in Realtime settings
- Check console logs for connection errors

### No stores showing
- Run `supabase_setup.sql` to add sample stores
- Check RLS policies allow reading stores

## Next Steps

### For Development
1. Read `SETUP_GUIDE.md` for detailed setup
2. Read `REALTIME_SETUP.md` for realtime details
3. Read `IMPLEMENTATION_SUMMARY.md` for architecture

### For Production
1. Add more stores and items
2. Upload store logos to Supabase Storage
3. Customize theme colors
4. Add push notifications
5. Deploy with EAS Build

## Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **React Native**: [reactnative.dev](https://reactnative.dev)

## Support

Need help?
1. Check console logs for errors
2. Review the troubleshooting section
3. Check Supabase dashboard for issues
4. Verify database triggers are active

---

**That's it!** You now have a fully functional delivery app with real-time features. 🎉

Start customizing and building your own features!
