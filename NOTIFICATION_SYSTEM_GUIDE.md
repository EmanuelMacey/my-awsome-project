
# 🔔 Push Notification System - Complete Guide

## Overview
Your ErrandRunners app now has a **complete push notification system** with:
- ✅ Pop-up notifications with sound
- ✅ Real-time order status updates
- ✅ Driver assignment notifications
- ✅ Chat message notifications
- ✅ Cross-platform support (iOS, Android, Web)
- ✅ In-app notification popups
- ✅ Notification tap handling (navigation)

---

## 📱 How to Test Notifications

### Method 1: Use the Built-in Test Screen

1. **Navigate to the Test Screen:**
   - Add a button in any profile screen or settings screen
   - Use: `router.push('/notification-test')`
   - Or manually navigate to: `yourapp://notification-test`

2. **Grant Permissions:**
   - Tap "Request Notification Permissions"
   - Allow notifications when prompted
   - You should see "Permission Status: Granted ✅"

3. **Send Test Notifications:**
   - Tap "Basic Notification" - sends a simple test notification
   - Tap "Order Status Update" - simulates an order status change
   - Tap "New Order (Driver)" - simulates a new order for drivers
   - Tap "Chat Message" - simulates a new chat message

4. **What to Expect:**
   - A notification popup appears at the top of the screen
   - You hear a notification sound
   - The popup auto-dismisses after 5 seconds
   - Tapping the popup navigates to the relevant screen

### Method 2: Test with Real Actions

#### For Customers:
1. **Place an Order:**
   - Go to any store
   - Add items to cart
   - Place an order
   - ✅ You'll get a "📦 Order Placed" notification

2. **Wait for Driver:**
   - When a driver accepts your order
   - ✅ You'll get a "🚗 Driver Assigned" notification

3. **Track Delivery:**
   - As the driver updates status
   - ✅ You'll get notifications for each status change:
     - "🛒 Purchasing Items"
     - "👨‍🍳 Preparing Order"
     - "🚚 Out for Delivery"
     - "✅ Order Delivered"

4. **Chat with Driver:**
   - Open the chat screen
   - When driver sends a message
   - ✅ You'll get a "💬 [Driver Name]" notification

#### For Drivers:
1. **Open Driver Dashboard:**
   - Log in as a driver
   - Keep the app open

2. **Wait for Orders:**
   - When a customer places an order
   - ✅ You'll get a "🆕 New Order Available" notification

3. **Accept an Order:**
   - Tap on a pending order
   - Accept it
   - ✅ Customer gets notified

4. **Update Status:**
   - Change order status (In Transit, Delivered, etc.)
   - ✅ Customer gets notified for each change

5. **Chat with Customer:**
   - Open the chat screen
   - When customer sends a message
   - ✅ You'll get a "💬 [Customer Name]" notification

#### For Admins:
- Admins receive all notifications
- Can see order updates in real-time
- Can monitor driver assignments

---

## 🔍 How to Find the Test Screen

### Option 1: Add a Button to Profile Screen

Add this to any profile screen (Customer, Driver, or Admin):

```tsx
<TouchableOpacity
  style={styles.testButton}
  onPress={() => router.push('/notification-test')}
>
  <Text style={styles.testButtonText}>🔔 Test Notifications</Text>
</TouchableOpacity>
```

### Option 2: Navigate Directly

In any screen, you can navigate to the test screen:

```tsx
import { router } from 'expo-router';

// In a button or useEffect
router.push('/notification-test');
```

### Option 3: Deep Link (for testing)

Open this URL in your device:
```
maceyrunners://notification-test
```

---

## 🛠️ Technical Details

### Files Created/Modified:

1. **`src/components/NotificationListener.tsx`** (NEW)
   - Global notification listener component
   - Displays in-app notification popups
   - Handles notification taps and navigation
   - Subscribes to real-time order updates

2. **`src/utils/notifications.ts`** (ENHANCED)
   - Core notification functions
   - Permission handling
   - Local notification sending
   - Order/driver/chat notification helpers

3. **`src/screens/NotificationTestScreen.tsx`** (NEW)
   - Test screen for notifications
   - Permission status display
   - Test buttons for all notification types
   - Troubleshooting guide

4. **`app/_layout.tsx`** (MODIFIED)
   - Added `<NotificationListener />` component
   - Added route for notification test screen

5. **`app.json`** (MODIFIED)
   - Added `expo-notifications` plugin
   - Added Android notification permissions
   - Configured notification icon and color

6. **`src/api/orders.ts`** (ALREADY INTEGRATED)
   - Calls notification functions on order updates
   - Sends notifications to customers and drivers

### Notification Flow:

```
1. Order Status Changes (in database)
   ↓
2. Supabase Realtime triggers NotificationListener
   ↓
3. NotificationListener calls Notifications.scheduleNotificationAsync()
   ↓
4. Notification appears with sound
   ↓
5. User taps notification
   ↓
6. App navigates to relevant screen (order detail, chat, etc.)
```

---

## 🐛 Troubleshooting

### "I don't see any notifications"

1. **Check Permissions:**
   - Go to notification test screen
   - Check if permission status is "Granted ✅"
   - If not, tap "Request Notification Permissions"

2. **Check Device Settings:**
   - **iOS:** Settings → MaceyRunners → Notifications → Allow Notifications
   - **Android:** Settings → Apps → MaceyRunners → Notifications → Enable

3. **Check Do Not Disturb:**
   - Make sure "Do Not Disturb" is OFF on your device

4. **Restart the App:**
   - Close the app completely
   - Reopen it
   - Try sending a test notification

### "I see notifications but no sound"

1. **Check Volume:**
   - Make sure your device volume is up
   - Check that ringer is not on silent (iOS)

2. **Check Notification Settings:**
   - **iOS:** Settings → MaceyRunners → Notifications → Sounds → ON
   - **Android:** Settings → Apps → MaceyRunners → Notifications → Sound → Enabled

### "Notifications don't navigate to the right screen"

1. **Check Console Logs:**
   - Look for "👆 Handling notification tap with data:" in logs
   - Make sure the notification data includes the correct IDs

2. **Verify Routes:**
   - Make sure the routes exist in `app/_layout.tsx`
   - Check that the order/errand IDs are valid

### "Web notifications don't work"

1. **Check Browser Support:**
   - Web notifications require HTTPS (or localhost)
   - Some browsers block notifications by default

2. **Grant Browser Permissions:**
   - Click the 🔔 icon in the address bar
   - Allow notifications for the site

---

## 📊 Notification Types

### Order Status Notifications
- **Pending:** "📦 Order Placed"
- **Confirmed:** "✅ Order Confirmed"
- **Accepted:** "🚗 Driver Assigned"
- **Purchasing:** "🛒 Purchasing Items"
- **Preparing:** "👨‍🍳 Preparing Order"
- **Ready for Pickup:** "📦 Ready for Pickup"
- **Picked Up:** "🚚 Out for Delivery"
- **In Transit:** "🚚 On the Way"
- **Delivered:** "✅ Order Delivered"
- **Cancelled:** "❌ Order Cancelled"

### Driver Notifications
- **New Order:** "🆕 New Order Available"
- **Order Assigned:** "✅ Order Assigned to You"

### Chat Notifications
- **New Message:** "💬 [Sender Name]"
- Shows message preview

### Errand Notifications
- **Pending:** "📦 Errand Created"
- **Accepted:** "✅ Runner Assigned"
- **In Progress:** "🏃 Errand In Progress"
- **Completed:** "✅ Errand Completed"
- **Cancelled:** "❌ Errand Cancelled"

---

## 🎯 Next Steps

### For Development:
1. Test all notification types thoroughly
2. Verify notifications work on physical devices (not just simulators)
3. Test on both iOS and Android
4. Test web notifications in different browsers

### For Production:
1. Configure push notification certificates (iOS)
2. Set up Firebase Cloud Messaging (Android)
3. Configure Expo push notification service
4. Test with real users

### For Enhancement:
1. Add notification history screen
2. Add notification preferences (enable/disable specific types)
3. Add notification badges on app icon
4. Add rich notifications with images
5. Add action buttons on notifications (Accept, Decline, etc.)

---

## 📞 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Use the notification test screen to diagnose issues
3. Verify permissions are granted
4. Check device settings
5. Restart the app

**Contact:**
- Email: errandrunners592@gmail.com
- Phone: 592-721-9769

---

## ✅ Verification Checklist

Before deploying, verify:
- [ ] Notifications appear with sound
- [ ] Notifications show correct title and body
- [ ] Tapping notifications navigates correctly
- [ ] Permissions are requested properly
- [ ] Works on iOS (physical device)
- [ ] Works on Android (physical device)
- [ ] Works on Web (Chrome, Safari, Firefox)
- [ ] Real-time updates trigger notifications
- [ ] Order status changes send notifications
- [ ] Chat messages send notifications
- [ ] Driver assignment sends notifications
- [ ] Notification test screen works
- [ ] Console logs show notification events

---

## 🎉 Success!

Your notification system is now fully implemented and ready to test!

**To get started:**
1. Navigate to `/notification-test` in your app
2. Grant notification permissions
3. Tap any test button
4. Watch for the notification popup and sound!

**For real testing:**
1. Place an order as a customer
2. Accept it as a driver
3. Update the order status
4. Watch notifications appear in real-time!

Enjoy your fully functional notification system! 🚀
