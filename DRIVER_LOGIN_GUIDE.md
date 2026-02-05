
# Driver Login & Authentication Guide

## Overview

Drivers in the ErrandRunners app use the same login system as customers and admins. The app automatically detects the user's role and navigates them to the appropriate dashboard.

---

## How Driver Login Works

### 1. **Registration Process**

When a new driver signs up:

- They go to the **Registration Screen** (`/auth/register`)
- They fill in their details:
  - Name
  - Phone number
  - Email
  - Password
  - **Role selection**: They must select "Driver" from the role dropdown
- Upon successful registration, their account is created with `role: 'driver'` in the database

### 2. **Login Process**

When a driver logs in:

1. **Navigate to Login Screen**: Driver opens the app and goes to `/auth/login`
2. **Enter Credentials**: Driver enters their email and password
3. **Authentication**: The app calls `signIn(email, password)` from the AuthContext
4. **Role Detection**: The system fetches the user profile from the `users` table
5. **Automatic Navigation**: Based on the `role` field in the database:
   - If `role === 'driver'` → Navigate to `/driver/dashboard`
   - If `role === 'customer'` → Navigate to `/customer/home`
   - If `role === 'admin'` → Navigate to `/admin/dashboard`

### 3. **Driver Dashboard**

Once logged in, drivers see:

- **Available Orders**: All pending orders that need a driver
- **Assigned Orders**: Orders already assigned to them
- **Order Actions**: Ability to:
  - Accept pending orders
  - Update order status (accepted → in_transit → delivered)
  - Chat with customers
  - View order details and delivery addresses

---

## Technical Implementation

### Authentication Flow

```typescript
// In AuthContext.tsx
const signIn = async (email: string, password: string) => {
  // 1. Sign in with Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // 2. Fetch user profile with role
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // 3. Set user state (includes role)
  setUser(userData);
};
```

### Role-Based Navigation

```typescript
// In app/_layout.tsx or navigation logic
useEffect(() => {
  if (user) {
    if (user.role === 'driver') {
      router.replace('/driver/dashboard');
    } else if (user.role === 'customer') {
      router.replace('/customer/home');
    } else if (user.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }
}, [user]);
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'driver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The `role` field determines which dashboard the user sees after login.

---

## Driver Features

### 1. **View Available Orders**

- Drivers see all orders with `status = 'pending'` and `driver_id IS NULL`
- They can also see orders already assigned to them

### 2. **Accept Orders**

- Driver taps on a pending order
- Clicks "Accept Order" button
- Order status changes to `accepted` and `driver_id` is set to the driver's ID

### 3. **Update Order Status**

Drivers can update orders through these stages:
- `pending` → `accepted` (when they accept the order)
- `accepted` → `in_transit` (when they pick up the order)
- `in_transit` → `delivered` (when they complete delivery)

### 4. **Real-time Updates**

- Orders update in real-time using Supabase Realtime subscriptions
- When a new order is placed, all drivers see it immediately
- When a driver accepts an order, it disappears from other drivers' lists

### 5. **Chat with Customers**

- Each order has an associated chat
- Drivers can message customers for delivery instructions
- Messages are real-time using Supabase Realtime

---

## Creating a Driver Account

### For Testing/Development:

1. **Via Registration Screen**:
   - Open the app
   - Tap "Register"
   - Fill in details
   - Select "Driver" as role
   - Submit

2. **Via Database (Admin)**:
   ```sql
   -- Create auth user first (via Supabase Auth UI or API)
   -- Then insert into users table
   INSERT INTO users (id, name, email, phone, role)
   VALUES (
     'auth-user-uuid-here',
     'John Driver',
     'driver@example.com',
     '+592-123-4567',
     'driver'
   );
   ```

### For Production:

1. Drivers register through the app
2. Admin can verify/approve drivers (optional feature)
3. Admin can manually change a user's role to 'driver' if needed

---

## Security & Permissions

### Row Level Security (RLS)

The app uses RLS policies to ensure:

- Drivers can only see orders assigned to them or pending orders
- Drivers can only update orders they've accepted
- Drivers cannot access admin functions
- Drivers cannot modify other users' data

### Example RLS Policy:

```sql
-- Drivers can view pending orders or their own orders
CREATE POLICY "Drivers can view available orders"
ON orders FOR SELECT
USING (
  status = 'pending' 
  OR driver_id = auth.uid()
);

-- Drivers can update only their assigned orders
CREATE POLICY "Drivers can update their orders"
ON orders FOR UPDATE
USING (driver_id = auth.uid());
```

---

## Common Issues & Solutions

### Issue: Driver can't see orders

**Solution**: 
- Check that the driver's `role` in the database is set to `'driver'`
- Verify RLS policies allow drivers to view orders
- Check that orders exist with `status = 'pending'`

### Issue: Driver redirected to wrong dashboard

**Solution**:
- Verify the `role` field in the `users` table
- Check the navigation logic in `app/_layout.tsx`
- Clear app cache and re-login

### Issue: Driver can't accept orders

**Solution**:
- Check RLS policies on the `orders` table
- Verify the driver is authenticated
- Check network connectivity

---

## Summary

**Driver Login Process**:
1. Driver registers with role = 'driver'
2. Driver logs in with email/password
3. App detects role = 'driver'
4. App navigates to `/driver/dashboard`
5. Driver can view and accept orders
6. Driver can update order status and chat with customers

**Key Points**:
- Same login screen for all users
- Role determines which dashboard they see
- Automatic navigation based on role
- Real-time order updates
- Secure with RLS policies

---

## Next Steps

To enhance the driver experience, consider:

1. **Driver Verification**: Add a verification process for new drivers
2. **Driver Profiles**: Allow drivers to add vehicle information
3. **Earnings Dashboard**: Show drivers their earnings and statistics
4. **Push Notifications**: Notify drivers of new orders
5. **GPS Tracking**: Real-time location tracking for deliveries
6. **Rating System**: Allow customers to rate drivers

