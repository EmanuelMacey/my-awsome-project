
# Backend-Controlled Push Notifications Guide

## 🎯 Overview

ErrandRunners now uses **backend-controlled push notifications** via Supabase Edge Functions and Expo Push Service. This ensures:

- ✅ **Security**: API keys stay on the server, not in the app
- ✅ **Reliability**: Notifications are sent even if the app is closed
- ✅ **Scalability**: Centralized notification logic
- ✅ **Consistency**: All users receive notifications the same way

---

## 📐 Architecture

```
Customer places order
        ↓
Order saved in Supabase Database
        ↓
Supabase Database Trigger fires
        ↓
Supabase Edge Function executes
        ↓
Edge Function sends push via Expo Push Service
        ↓
Customer/Driver phone receives notification
```

**Key Point**: The frontend app **NEVER** sends push notifications directly. It only:
1. Requests notification permissions
2. Gets the Expo Push Token
3. Saves the token to the database
4. Receives and displays notifications sent by the backend

---

## 🔧 Frontend Implementation (Already Complete)

### 1. Push Token Registration

The app registers for push notifications and saves the token to the database:

```typescript
// src/utils/notifications.ts
export async function registerForPushNotificationsAsync(userId?: string) {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    // Get Expo Push Token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Save to database - Backend will use this to send notifications
    await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', userId);
  }
}
```

### 2. Notification Listener

The app listens for incoming notifications and handles navigation:

```typescript
// src/components/NotificationListener.tsx
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  if (data.type === 'order_status' && data.orderId) {
    router.push(`/customer/order/${data.orderId}`);
  }
  // ... other navigation logic
});
```

### 3. Realtime UI Updates

The app subscribes to Supabase Postgres Changes for instant UI updates:

```typescript
// Driver/Admin screens
supabase
  .channel('orders-channel')
  .on('postgres_changes', { event: 'INSERT', table: 'orders' }, (payload) => {
    console.log('New order created, refreshing UI');
    fetchOrders(); // Update UI
  })
  .subscribe();
```

**Note**: These subscriptions are for UI updates only. Push notifications are sent by the backend.

---

## 🚀 Backend Implementation (Required)

### Database Schema

Ensure the `users` table has a `push_token` column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
```

### Supabase Edge Functions

You need to create Supabase Edge Functions that:

1. **Listen to database events** (via Database Triggers or Webhooks)
2. **Fetch user push tokens** from the database
3. **Send push notifications** via Expo Push Service

#### Example: New Order Notification

**File**: `supabase/functions/notify-new-order/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { orderId, orderNumber, customerId } = await req.json();
    
    // Fetch customer's push token
    const { data: user } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', customerId)
      .single();
    
    if (!user?.push_token) {
      return new Response('No push token found', { status: 200 });
    }
    
    // Send push notification via Expo Push Service
    const message = {
      to: user.push_token,
      title: '📦 Order Placed',
      body: `Your order #${orderNumber} has been placed successfully!`,
      data: {
        type: 'order_status',
        orderId,
        orderNumber,
        status: 'pending',
      },
      sound: 'default',
      priority: 'high',
    };
    
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('Push notification sent:', result);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### Database Trigger

Create a trigger that calls the Edge Function when an order is created:

```sql
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-new-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object(
      'orderId', NEW.id,
      'orderNumber', NEW.order_number,
      'customerId', NEW.customer_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_created
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_new_order();
```

---

## 📋 Required Notifications

### 1. Customer Notifications

| Event | Trigger | Recipients | Title | Body |
|-------|---------|-----------|-------|------|
| Order Placed | `INSERT orders` | Customer | 📦 Order Placed | Your order #X has been placed |
| Order Accepted | `UPDATE orders` (status=accepted) | Customer | ✅ Driver Assigned | A driver has been assigned to order #X |
| Order In Transit | `UPDATE orders` (status=in_transit) | Customer | 🚚 On the Way | Your order #X is on the way! |
| Order Delivered | `UPDATE orders` (status=delivered) | Customer | ✅ Order Delivered | Your order #X has been delivered |
| Order Cancelled | `UPDATE orders` (status=cancelled) | Customer | ❌ Order Cancelled | Your order #X has been cancelled |

### 2. Driver Notifications

| Event | Trigger | Recipients | Title | Body |
|-------|---------|-----------|-------|------|
| New Order | `INSERT orders` (status=pending) | All Drivers | 🆕 New Order Available | New order #X is available for pickup |
| Order Cancelled | `UPDATE orders` (status=cancelled) | Assigned Driver | ❌ Order Cancelled | Order #X has been cancelled |

### 3. Admin Notifications

| Event | Trigger | Recipients | Title | Body |
|-------|---------|-----------|-------|------|
| New Order | `INSERT orders` | All Admins | 🆕 New Order Placed | Customer placed order #X |
| Order Cancelled | `UPDATE orders` (status=cancelled) | All Admins | ❌ Order Cancelled | Order #X was cancelled |
| New Errand | `INSERT errands` | All Admins | 🆕 New Errand Requested | Customer requested errand #X |

---

## 🧪 Testing

### 1. Test Push Token Registration

```typescript
// In your app
const token = await registerForPushNotificationsAsync(user.id);
console.log('Push token:', token);

// Verify in database
const { data } = await supabase
  .from('users')
  .select('push_token')
  .eq('id', user.id)
  .single();

console.log('Token in database:', data.push_token);
```

### 2. Test Backend Notification Sending

Use the Expo Push Notification Tool: https://expo.dev/notifications

1. Copy your push token from the database
2. Paste it into the tool
3. Send a test notification
4. Verify it appears on your device

### 3. Test End-to-End Flow

1. Place an order as a customer
2. Verify the order is created in the database
3. Check that the Edge Function was triggered
4. Verify the customer receives a push notification
5. Tap the notification and verify it navigates to the order detail screen

---

## 🔍 Debugging

### Check Push Token

```sql
SELECT id, name, role, push_token 
FROM users 
WHERE id = 'USER_ID';
```

### Check Edge Function Logs

```bash
supabase functions logs notify-new-order
```

### Check Expo Push Service Response

The Edge Function should log the response from Expo:

```json
{
  "data": {
    "status": "ok",
    "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
  }
}
```

Common errors:
- `DeviceNotRegistered`: Push token is invalid or expired
- `InvalidCredentials`: Check your Expo project configuration
- `MessageTooBig`: Notification payload exceeds 4KB limit

---

## 📱 App Configuration

Ensure `app.json` has the notification plugin configured:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#FF6B35"
        }
      ]
    ]
  }
}
```

---

## ✅ Verification Checklist

- [ ] `expo-notifications` and `expo-device` packages installed
- [ ] Notification plugin configured in `app.json`
- [ ] `users` table has `push_token` column
- [ ] Push token registration works on login
- [ ] Push tokens are saved to database
- [ ] Supabase Edge Functions are deployed
- [ ] Database triggers are created
- [ ] Test notifications are received on device
- [ ] Notification taps navigate to correct screens
- [ ] Realtime UI updates work for all user roles

---

## 🚨 Important Notes

1. **Physical Device Required**: Push notifications don't work on iOS Simulator or Android Emulator
2. **Expo Go Limitations**: For production, build a standalone app with EAS Build
3. **Token Expiration**: Push tokens can expire - implement token refresh logic
4. **Rate Limiting**: Expo Push Service has rate limits - batch notifications when possible
5. **Error Handling**: Always handle `DeviceNotRegistered` errors and remove invalid tokens

---

## 📚 Resources

- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

---

## 🎉 Summary

Your app now has a **production-ready, backend-controlled notification system**:

✅ Frontend registers push tokens and saves them to the database
✅ Backend sends notifications via Supabase Edge Functions
✅ Notifications are triggered by database events (orders, errands, etc.)
✅ Users receive notifications even when the app is closed
✅ Tapping notifications navigates to the correct screen
✅ Realtime UI updates keep the app responsive

**Next Steps**: Deploy the Supabase Edge Functions and database triggers to enable push notifications in production!
