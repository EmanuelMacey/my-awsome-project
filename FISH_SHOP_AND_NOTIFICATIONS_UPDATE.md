
# Fish Shop Restaurant & Push Notifications Update

## Summary of Changes

This update includes:

1. **Added Fish Shop Restaurant** with menu items
2. **Fixed Gangbao Milkshake Prices** (12oz - $6000, 16oz - $1000)
3. **Implemented Automatic Push Notifications** for order updates
4. **Store Images Location Information**

---

## 1. Fish Shop Restaurant

### Restaurant Details
- **Name:** Fish Shop
- **Category:** Fast Food
- **Description:** Fresh seafood and fish dishes
- **Delivery Time:** 20-30 min
- **Delivery Fee:** $500

### Menu Items

#### Fish Burgers - $1200
- Category: Burgers
- Description: Delicious fish burger

#### Prawns and Chips - $2500
- Category: Seafood
- Description: Crispy prawns with chips

#### Fish and Chips - Starting at $1800
- Category: Seafood
- **Options:**
  - Banga: $1800
  - Shark/Trout: $2000

#### Salad - $800
- Category: Sides
- Description: Fresh garden salad

---

## 2. Gangbao Milkshake Price Fix

The milkshake prices have been corrected:

### Updated Prices
- **12oz:** $6000 (was $5000)
- **16oz:** $1000 (was $0)

### Available Flavors
- Orange
- Passion
- Grapefruit
- Red Grape
- Green Grape
- Honey Peach
- Mango
- Hami Melon
- Strawberry
- Green Apple
- Pineapple
- Milk Tea

---

## 3. Push Notifications System

### How It Works

The app now has a **fully automated push notification system** that sends notifications to:

1. **Customers** - When order status changes
2. **Drivers** - When a new order is assigned to them
3. **Admins** - For system-wide updates

### Notification Triggers

#### For Customers:
- ✅ **Order Confirmed** - "Order Confirmed! 🎉"
- ✅ **Order Accepted** - "Order Accepted! 🎉" (when driver accepts)
- 👨‍🍳 **Order Preparing** - "Order Being Prepared 👨‍🍳"
- 📦 **Ready for Pickup** - "Order Ready! 📦"
- 🚗 **Picked Up** - "Order Picked Up! 🚗"
- 🚚 **In Transit** - "On the Way! 🚚"
- ✅ **Delivered** - "Order Delivered! ✅"
- ❌ **Cancelled** - "Order Cancelled ❌"

#### For Drivers:
- 🆕 **New Order** - "New Order Available! 🆕" (when assigned to an order)

### Technical Implementation

#### Database Trigger
A PostgreSQL trigger automatically creates notifications when:
- Order status changes
- A driver is assigned to an order

#### Edge Function
A Supabase Edge Function (`send-push-notification`) handles:
- Fetching user push tokens
- Sending push notifications via Expo Push Service
- Creating in-app notifications

#### Client-Side
- Push tokens are registered when users log in
- Notifications are displayed as pop-ups
- Real-time updates via Supabase subscriptions

### Testing Notifications

To test if notifications are working:

1. **Place an Order** as a customer
2. **Accept the Order** as a driver
3. **Update Order Status** through the driver app
4. Check that notifications appear on both customer and driver devices

### Troubleshooting

If notifications aren't working:

1. **Check Push Token Registration**
   - Ensure users are on physical devices (not simulators)
   - Check that push tokens are saved in the `push_tokens` table
   - Verify permissions are granted

2. **Check Database Trigger**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'order_status_change_notification';
   ```

3. **Check Notifications Table**
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
   ```

4. **Check Edge Function Logs**
   - Go to Supabase Dashboard → Edge Functions → send-push-notification
   - View logs for any errors

---

## 4. Store Images Location

### Where Store Images Are Stored

Store images are stored in **two locations**:

#### 1. Supabase Storage Bucket
- **Bucket Name:** `stores`
- **Path:** `store-images/`
- **Subdirectories:**
  - `fastfood/` - Fast food restaurant logos
  - `restaurants/` - Restaurant logos
  - `supermarkets/` - Supermarket logos
  - `pharmacies/` - Pharmacy logos

**Example URLs:**
```
https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/churchs%20chicken.png
https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/pizzahut.png
```

#### 2. Local Assets Folder
- **Path:** `assets/images/`
- Used for app icons and default images

### How to Update Store Images

#### Option 1: Upload to Supabase Storage (Recommended)

1. Go to Supabase Dashboard
2. Navigate to **Storage** → **stores** bucket
3. Open the `store-images/` folder
4. Choose the appropriate subdirectory (e.g., `fastfood/`)
5. Click **Upload** and select your image
6. Copy the public URL
7. Update the store record in the database:
   ```sql
   UPDATE stores 
   SET logo = 'https://sytixskkgfvjjjemmoav.supabase.co/storage/v1/object/public/stores/store-images/fastfood/your-image.png'
   WHERE name = 'Your Store Name';
   ```

#### Option 2: Use External URLs

You can also use external image URLs (e.g., from Unsplash, store websites):

```sql
UPDATE stores 
SET logo = 'https://images.unsplash.com/photo-1234567890?w=800&q=80'
WHERE name = 'Your Store Name';
```

#### Option 3: Update in Code

For background images, update the `getStoreBackgroundImage` function in:
- `src/screens/customer/StoreDetailScreen.tsx`

Example:
```typescript
else if (name.includes('your store name')) {
  return { uri: 'https://your-image-url.com/image.jpg' };
}
```

### Image Requirements

- **Format:** PNG, JPG, or WebP
- **Size:** Recommended 800x800px for logos
- **File Size:** Keep under 500KB for optimal performance
- **Aspect Ratio:** Square (1:1) for logos, 16:9 for backgrounds

---

## 5. Additional Notes

### Database Changes
- Added Fish Shop store and products
- Updated Gangbao milkshake options
- Created notification trigger function
- Deployed Edge Function for push notifications

### Code Changes
- Updated `src/utils/notifications.ts` with improved notification handling
- Added Fish Shop to store background images
- Enhanced notification subscription system

### Testing Checklist
- ✅ Fish Shop appears in store list
- ✅ All Fish Shop menu items are visible
- ✅ Fish and Chips options work correctly
- ✅ Gangbao milkshake prices are correct
- ✅ Push notifications sent when order status changes
- ✅ Drivers receive notifications for new orders
- ✅ Customers receive notifications for order updates

---

## Support

If you encounter any issues:

1. Check the console logs for errors
2. Verify database records are correct
3. Test on physical devices (not simulators)
4. Ensure Expo push notification permissions are granted
5. Check Supabase Edge Function logs

For further assistance, refer to:
- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
