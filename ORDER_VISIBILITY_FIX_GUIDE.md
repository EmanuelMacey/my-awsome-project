
# Order Visibility Fix Guide

## Issues Fixed

### 1. Admin Not Seeing Orders
**Problem**: Admin user had role 'customer' instead of 'admin', preventing access to orders.

**Solution**: 
- Updated admin user role to 'admin' in the database
- Admin email: `admin@errandrunners.gy`
- Password: `Admin1234`

### 2. Driver Not Seeing Orders
**Problem**: RLS policies only allowed drivers to see orders where `driver_id = auth.uid()`, but pending orders have `driver_id = NULL`.

**Solution**: 
- Created new RLS policy "Drivers can view pending unassigned orders" that allows drivers to see all pending orders without an assigned driver
- Added indexes for better performance

### 3. Missing Features Implemented

#### Email Verification
- Already implemented in `src/contexts/AuthContext.tsx`
- Uses `emailRedirectTo: 'https://natively.dev/email-confirmed'`
- Users must verify email before logging in

#### Driver Availability Status
- Created `src/api/drivers.ts` with driver management functions
- Added online/offline toggle in driver dashboard
- Drivers can set their availability status
- Only available drivers can be assigned orders

#### Order Filters
- Added filter buttons for order status (all, pending, confirmed, in_transit, delivered, cancelled)
- Implemented in both driver and admin dashboards
- Filters work with real-time updates

#### Search Functionality
- Added search bar in driver and admin dashboards
- Search by order number or delivery address
- Real-time search results

## Database Changes

### RLS Policies Added

#### Orders Table
```sql
-- Allow drivers to view pending unassigned orders
CREATE POLICY "Drivers can view pending unassigned orders" ON orders
FOR SELECT
TO authenticated
USING (
  driver_id IS NULL 
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = (SELECT auth.uid()) 
    AND users.role = 'driver'
  )
);
```

#### Drivers Table
```sql
-- Drivers can view their own profile
CREATE POLICY "Drivers can view their own profile" ON drivers
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Drivers can update their own profile
CREATE POLICY "Drivers can update their own profile" ON drivers
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Admins can view all driver profiles
CREATE POLICY "Admins can view all driver profiles" ON drivers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = (SELECT auth.uid()) 
    AND users.role = 'admin'
  )
);
```

### Indexes Added for Performance
```sql
-- Orders table indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pending_unassigned ON orders(status, driver_id) 
  WHERE status = 'pending' AND driver_id IS NULL;

-- Drivers table indexes
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_is_available ON drivers(is_available) 
  WHERE is_available = true;
```

## New API Functions

### Orders API (`src/api/orders.ts`)
- `searchOrders(query: string)` - Search orders by order number or address
- `filterOrdersByStatus(status: OrderStatus)` - Filter orders by status
- Enhanced logging for all functions

### Drivers API (`src/api/drivers.ts`)
- `getDriverProfile(userId: string)` - Get driver profile
- `createDriverProfile(userId: string, driverData)` - Create driver profile
- `updateDriverAvailability(userId: string, isAvailable: boolean)` - Toggle driver availability
- `getAvailableDrivers()` - Get all available drivers
- `updateDriverLocation(...)` - Update driver GPS location
- `getDriverLocation(driverId: string)` - Get driver's current location

## UI Improvements

### Driver Dashboard
- **Availability Toggle**: Switch to go online/offline
- **Search Bar**: Search orders by order number or address
- **Filter Buttons**: Filter by status (all, pending, confirmed, in_transit, delivered)
- **Real-time Updates**: Orders update automatically when new orders are placed
- **Better Error Handling**: Clear error messages with retry functionality

### Admin Dashboard
- **Search Bar**: Search orders by order number or address
- **Filter Buttons**: Filter by status (all, pending, confirmed, in_transit, delivered, cancelled)
- **Order Count**: Shows total orders in each tab
- **Better Logging**: Console logs for debugging
- **Error Messages**: Clear error messages with details

## Testing the Fixes

### Test Admin Access
1. Login as admin:
   - Email: `admin@errandrunners.gy`
   - Password: `Admin1234`
2. Navigate to Admin Dashboard
3. You should see all orders (currently 5 pending orders)
4. Try searching for an order by order number
5. Try filtering by status

### Test Driver Access
1. Login as driver:
   - Email: `dinelmacey@gmail.com`
   - Password: (your password)
2. Navigate to Driver Dashboard
3. Toggle availability to "Online"
4. You should see all 5 pending orders
5. Try searching for an order
6. Try filtering by status
7. Accept an order to test assignment

### Test Real-time Updates
1. Open two devices/browsers
2. Login as customer on one, driver on another
3. Place an order as customer
4. Order should appear immediately in driver dashboard
5. Accept order as driver
6. Order status should update in customer view

## Troubleshooting

### Orders Not Showing
1. Check user role in database:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'your@email.com';
   ```
2. Verify RLS policies are enabled:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'orders';
   ```
3. Check console logs for errors

### Driver Can't See Pending Orders
1. Verify driver role:
   ```sql
   SELECT id, email, role FROM users WHERE role = 'driver';
   ```
2. Check if orders exist:
   ```sql
   SELECT COUNT(*) FROM orders WHERE status = 'pending' AND driver_id IS NULL;
   ```
3. Verify RLS policy exists:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'orders' 
   AND policyname = 'Drivers can view pending unassigned orders';
   ```

### Admin Can't See Orders
1. Verify admin role:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'admin@errandrunners.gy';
   ```
   Should return role = 'admin'
2. If role is not 'admin', update it:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@errandrunners.gy';
   ```

## Future Enhancements

### Push Notifications (Not Yet Implemented)
To implement push notifications:
1. Install Expo Notifications: `expo install expo-notifications`
2. Set up push notification tokens
3. Create Edge Function to send notifications
4. Trigger notifications on order status changes

### Automatic Driver Assignment (Not Yet Implemented)
To implement automatic driver assignment:
1. Create algorithm to find nearest available driver
2. Use driver location data from `driver_locations` table
3. Calculate distance using Haversine formula
4. Assign order to closest available driver
5. Send push notification to driver

### Email Verification Improvements
Current implementation:
- Email verification is required for signup
- Users receive verification email
- Must click link to verify before logging in

To improve:
1. Add resend verification email button
2. Add email verification status indicator
3. Send reminder emails for unverified accounts

## Summary

All major issues have been fixed:
- ✅ Admin can now see all orders
- ✅ Driver can now see pending orders
- ✅ Driver availability toggle implemented
- ✅ Order filters implemented
- ✅ Search functionality implemented
- ✅ Email verification already working
- ⏳ Push notifications (future enhancement)
- ⏳ Automatic driver assignment (future enhancement)

The app should now work correctly for all user roles!
