
# Push Notifications and Location Tracking Implementation

## Overview
This document outlines the implementation of push notifications and real-time location tracking for the ErrandRunners app, along with the ability for drivers to accept orders and see errand services.

## Features Implemented

### 1. Push Notifications
- **Expo Notifications Integration**: Installed and configured `expo-notifications` package
- **Push Token Management**: Created `push_tokens` table to store user device tokens
- **Notification Triggers**: Automatic notifications sent when:
  - Order is accepted by driver (confirmed)
  - Order is being prepared
  - Order is ready for pickup
  - Order is picked up
  - Order is in transit
  - Order is delivered
  - Order is cancelled

### 2. Real-Time Location Tracking
- **Expo Location Integration**: Installed and configured `expo-location` package
- **Background Location Tracking**: Drivers' locations are tracked in the background during active deliveries
- **Location Updates**: Location is updated every 10-15 seconds and stored in `driver_locations` table
- **Customer Tracking**: Customers can see driver's real-time location with:
  - Latitude and longitude coordinates
  - Estimated distance to delivery address
  - Driver's speed
  - Last update timestamp

### 3. Driver Order Acceptance
- **Accept Button**: Drivers can now accept pending orders from the order detail screen
- **Automatic Status Update**: Order status changes to "confirmed" when accepted
- **Location Tracking Start**: Location tracking automatically starts when order is accepted
- **Notification Sent**: Customer receives push notification when driver accepts order

### 4. Errand Services for Drivers
- **Unified Dashboard**: Drivers can now see both fast food orders and errand services
- **View Mode Toggle**: Three viewing modes:
  - **All**: Shows both orders and errands
  - **Fast Food**: Shows only food delivery orders
  - **Errands**: Shows only errand services
- **Errand Cards**: Dedicated UI for displaying errand information including:
  - Errand number
  - Category and subcategory
  - Pickup and dropoff addresses
  - Total price
  - Status

## Database Changes

### New Table: `push_tokens`
```sql
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);
```

### RLS Policies
- Users can view, insert, update, and delete their own push tokens
- Indexes added for faster lookups

## New Files Created

### 1. `src/utils/notifications.ts`
Handles all push notification functionality:
- `registerForPushNotificationsAsync()`: Registers device for push notifications
- `savePushToken()`: Saves push token to database
- `getUserPushTokens()`: Retrieves user's push tokens
- `sendPushNotification()`: Sends push notification via Expo Push Service
- `notifyOrderStatusChange()`: Sends notification when order status changes
- `notifyDriverNewOrder()`: Notifies driver about new order

### 2. `src/utils/location.ts`
Handles all location tracking functionality:
- `requestLocationPermissions()`: Requests foreground and background location permissions
- `getCurrentLocation()`: Gets current device location
- `updateDriverLocation()`: Updates driver location in database
- `getDriverLocation()`: Retrieves latest driver location
- `startLocationTracking()`: Starts background location tracking
- `stopLocationTracking()`: Stops background location tracking
- `watchDriverLocation()`: Subscribes to real-time driver location updates
- `calculateDistance()`: Calculates distance between two coordinates

### 3. `src/api/notifications.ts`
API functions for managing notifications:
- `getUserNotifications()`: Fetches user's notifications
- `markNotificationAsRead()`: Marks notification as read
- `markAllNotificationsAsRead()`: Marks all notifications as read
- `getUnreadNotificationCount()`: Gets count of unread notifications

## Updated Files

### 1. `src/contexts/AuthContext.tsx`
- Added automatic push notification registration when user logs in
- Calls `registerForPushNotificationsAsync()` after successful authentication

### 2. `src/api/orders.ts`
- Updated `assignDriver()` to send push notification to customer
- Updated `updateOrderStatus()` to send push notification on status change

### 3. `src/screens/driver/DriverOrderDetailScreen.tsx`
- Added "Accept Order" button for pending orders
- Integrated location tracking that starts automatically when order is accepted
- Location updates every 15 seconds during active delivery
- Automatic cleanup when order is completed or cancelled

### 4. `src/screens/customer/OrderDetailScreen.tsx`
- Added real-time driver location display
- Shows latitude, longitude, estimated distance, and speed
- Subscribes to driver location updates via Supabase realtime
- Note displayed explaining that map view is not available

### 5. `src/screens/driver/DriverDashboardScreen.tsx`
- Added view mode toggle (All, Fast Food, Errands)
- Integrated errand services display
- Shows both orders and errands in unified list
- Custom errand card component with relevant information
- Color-coded status badges for errands

### 6. `app.json`
- Added `expo-notifications` plugin configuration
- Added `expo-location` plugin configuration with permissions
- Configured notification channel and icon
- Enabled background location tracking for Android

## Dependencies Installed
- `expo-notifications`: ^0.32.15
- `expo-location`: ^19.0.8
- `expo-task-manager`: ^14.0.9
- `expo-device`: ^8.0.10

## Permissions Required

### iOS
- `NSLocationAlwaysAndWhenInUseUsageDescription`: For location tracking
- `NSLocationAlwaysUsageDescription`: For background location
- `NSLocationWhenInUseUsageDescription`: For foreground location
- Notification permissions requested at runtime

### Android
- `ACCESS_COARSE_LOCATION`: For approximate location
- `ACCESS_FINE_LOCATION`: For precise location
- `ACCESS_BACKGROUND_LOCATION`: For background location tracking
- `FOREGROUND_SERVICE`: For foreground service
- `FOREGROUND_SERVICE_LOCATION`: For location foreground service (Android 14+)
- `POST_NOTIFICATIONS`: For push notifications (Android 13+)

## How It Works

### Push Notifications Flow
1. User logs in → Push token is registered and saved to database
2. Order status changes → Notification is sent to all user's devices
3. User receives notification → Can tap to open order details
4. In-app notification is also created for history

### Location Tracking Flow
1. Driver accepts order → Location tracking starts automatically
2. Background task updates location every 10 seconds
3. Location is saved to `driver_locations` table
4. Customer subscribes to real-time updates via Supabase
5. Customer sees live location updates on order detail screen
6. Tracking stops when order is delivered or cancelled

### Driver Dashboard Flow
1. Driver opens dashboard → Sees toggle for view mode
2. Can switch between All, Fast Food, and Errands
3. Both orders and errands are displayed in chronological order
4. Can tap on any item to view details
5. Can accept pending orders or errands

## Testing Recommendations

### Push Notifications
1. Test on physical device (notifications don't work on simulators)
2. Verify notification permissions are granted
3. Test all order status transitions
4. Verify notifications appear in notification tray
5. Test tapping notification to open order

### Location Tracking
1. Test on physical device with GPS enabled
2. Grant location permissions (foreground and background)
3. Accept an order and verify tracking starts
4. Move device and verify location updates
5. Check customer can see location updates
6. Verify tracking stops when order is completed

### Driver Dashboard
1. Create both food orders and errands
2. Verify both appear in "All" view
3. Test filtering by view mode
4. Verify errand cards display correctly
5. Test accepting both orders and errands

## Known Limitations

1. **Map View**: React-native-maps is not supported in Natively, so location is displayed as coordinates instead of on a map
2. **Background Tracking**: May be limited by device battery optimization settings
3. **Notification Delivery**: Depends on device's internet connection and Expo Push Service availability
4. **Location Accuracy**: Varies based on device GPS capabilities and environment

## Future Enhancements

1. Add map view when react-native-maps support is available
2. Implement geofencing for automatic status updates
3. Add notification sound customization
4. Implement notification categories for better organization
5. Add estimated time of arrival (ETA) calculation
6. Implement route optimization for multiple deliveries
7. Add notification preferences in user settings
8. Implement notification history with filtering

## Troubleshooting

### Push Notifications Not Working
- Verify device is physical (not simulator)
- Check notification permissions are granted
- Verify Expo project ID is configured correctly
- Check push token is saved in database
- Verify internet connection

### Location Tracking Not Working
- Verify location permissions are granted (both foreground and background)
- Check GPS is enabled on device
- Verify location services are enabled in device settings
- Check battery optimization is not blocking background location
- Verify foreground service notification appears

### Errands Not Showing
- Verify errand categories and subcategories exist in database
- Check RLS policies allow driver to view errands
- Verify errands have correct status
- Check view mode is set to "All" or "Errands"

## Support

For issues or questions, please refer to:
- Expo Notifications documentation: https://docs.expo.dev/versions/latest/sdk/notifications/
- Expo Location documentation: https://docs.expo.dev/versions/latest/sdk/location/
- Supabase Realtime documentation: https://supabase.com/docs/guides/realtime
