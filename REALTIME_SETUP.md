
# ErrandRunners - Realtime Setup Guide

This guide will help you set up Supabase Realtime for instant order status updates and real-time messaging in the ErrandRunners app.

## Prerequisites

- A Supabase project with the ErrandRunners database already set up
- The `supabase_setup.sql` script has been executed
- Your `.env` file is configured with Supabase credentials

## Step 1: Enable Realtime in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Enable replication for the following tables:
   - `orders`
   - `messages`

## Step 2: Configure Realtime Settings

1. Go to **Project Settings** → **Realtime**
2. **IMPORTANT**: Enable **"Private channels only"** for better security
   - This ensures all realtime channels require authentication
   - Prevents unauthorized access to realtime data
3. Adjust **Database connection pool size** if needed (default is usually fine)
4. Set **Max concurrent connections** based on your expected user load

## Step 3: Run the Updated SQL Script

The `supabase_setup.sql` file includes all necessary configurations:

### Database Triggers

The script creates two trigger functions that automatically broadcast changes:

- **`notify_order_changes()`**: Broadcasts when orders are created, updated, or deleted
- **`notify_message_changes()`**: Broadcasts when new messages are sent

### RLS Policies for Realtime

The script includes RLS policies on the `realtime.messages` table:

- **Read policy**: Users can only receive broadcasts for orders they're involved in
- **Write policy**: Users can only send broadcasts for their own orders

### Channel Naming Convention

The app uses the following channel patterns:

- **Orders**: `orders:{order_id}` - For order status updates
- **Messages**: `messages:{order_id}` - For chat messages

## Step 4: Verify Realtime is Working

### Test Order Status Updates

1. **As a Customer**:
   - Place an order
   - Open the order detail screen
   - Keep the screen open

2. **As a Driver**:
   - Accept the order
   - Update the status to "In Transit"
   - Update the status to "Delivered"

3. **Expected Result**:
   - The customer's order detail screen should update instantly without refreshing
   - Status badge should change color and text automatically

### Test Real-time Messaging

1. **As a Customer**:
   - Open an order with an assigned driver
   - Tap "Chat with Driver"
   - Send a message

2. **As a Driver**:
   - Open the same order
   - Tap "Chat with Customer"
   - You should see the customer's message appear instantly

3. **Expected Result**:
   - Messages appear in real-time on both sides
   - No need to refresh or pull to update

## How It Works

### Architecture Overview

```
┌─────────────────┐
│   React Native  │
│      App        │
└────────┬────────┘
         │
         │ WebSocket Connection
         │
┌────────▼────────┐
│    Supabase     │
│    Realtime     │
└────────┬────────┘
         │
         │ Database Triggers
         │
┌────────▼────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘
```

### Flow for Order Updates

1. Driver updates order status in the database
2. PostgreSQL trigger `notify_order_changes()` fires
3. Trigger calls `realtime.broadcast_changes()` with channel `orders:{order_id}`
4. Supabase Realtime broadcasts the change via WebSocket
5. Customer's app receives the broadcast on the subscribed channel
6. UI updates automatically with new status

### Flow for Messages

1. User sends a message (inserts into `messages` table)
2. PostgreSQL trigger `notify_message_changes()` fires
3. Trigger calls `realtime.broadcast_changes()` with channel `messages:{order_id}`
4. Supabase Realtime broadcasts the message via WebSocket
5. Other user's app receives the broadcast
6. New message appears in the chat instantly

## Security Features

### Private Channels

All channels use `private: true` configuration, which means:

- Users must be authenticated to subscribe
- RLS policies on `realtime.messages` table control access
- Only users involved in an order can receive updates

### RLS Policy Logic

**For Orders**:
```sql
-- Users can only receive broadcasts for orders where they are:
-- 1. The customer (customer_id = auth.uid())
-- 2. The driver (driver_id = auth.uid())
```

**For Messages**:
```sql
-- Users can only receive broadcasts for orders where they are:
-- 1. The customer of the order
-- 2. The driver of the order
```

## Troubleshooting

### Messages Not Appearing in Real-time

**Check**:
1. Is Realtime enabled for the `messages` table?
2. Are you subscribed to the correct channel? (Check console logs)
3. Is the trigger `messages_realtime_trigger` active?

**Debug**:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'messages_realtime_trigger';

-- Test trigger manually
INSERT INTO messages (order_id, sender_id, content) 
VALUES ('your-order-id', 'your-user-id', 'Test message');
```

### Order Status Not Updating

**Check**:
1. Is Realtime enabled for the `orders` table?
2. Are you subscribed to the correct channel?
3. Is the trigger `orders_realtime_trigger` active?

**Debug**:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'orders_realtime_trigger';

-- Test trigger manually
UPDATE orders SET status = 'in_transit' WHERE id = 'your-order-id';
```

### Connection Issues

**Check**:
1. Is your internet connection stable?
2. Are you authenticated? (Check `supabase.auth.getSession()`)
3. Check browser/app console for WebSocket errors

**Debug**:
```typescript
// Enable verbose logging
const supabase = createClient(url, key, {
  realtime: {
    params: { log_level: 'debug' }
  }
});
```

### RLS Policy Issues

**Check**:
1. Are RLS policies enabled on `realtime.messages`?
2. Do the policies match your channel naming convention?

**Debug**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'realtime';

-- Test policy manually
SET ROLE authenticated;
SET request.jwt.claims.sub = 'your-user-id';
SELECT * FROM realtime.messages WHERE topic = 'orders:your-order-id';
```

## Performance Optimization

### Channel Management

- Each screen creates its own channel subscription
- Channels are automatically cleaned up when screens unmount
- Use `channelRef` to prevent duplicate subscriptions

### Best Practices

1. **Always check channel state** before subscribing:
   ```typescript
   if (channelRef.current?.state === 'subscribed') return;
   ```

2. **Set auth before subscribing**:
   ```typescript
   await supabase.realtime.setAuth();
   ```

3. **Clean up on unmount**:
   ```typescript
   return () => {
     if (channelRef.current) {
       supabase.removeChannel(channelRef.current);
       channelRef.current = null;
     }
   };
   ```

4. **Use dedicated channels** per order/conversation:
   - ✅ `orders:123` - Only users in order 123 receive updates
   - ❌ `orders` - All users receive all order updates (bad!)

## Monitoring

### Check Active Connections

In Supabase Dashboard:
1. Go to **Database** → **Roles**
2. Check the number of active connections
3. Monitor for connection leaks

### Check Realtime Metrics

In Supabase Dashboard:
1. Go to **Project Settings** → **Realtime**
2. View connection statistics
3. Monitor message throughput

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Realtime Settings](https://supabase.com/docs/guides/realtime/settings)
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify your Supabase project settings
3. Test the database triggers manually
4. Check RLS policies are correctly configured
5. Ensure Realtime is enabled for the required tables

---

**Note**: The realtime functionality requires an active internet connection and a properly configured Supabase project. Make sure to test in a development environment before deploying to production.
