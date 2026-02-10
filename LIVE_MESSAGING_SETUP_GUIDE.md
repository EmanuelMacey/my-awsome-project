
# Live Messaging Setup Guide

## Overview

The ErrandRunners app uses **Supabase Realtime** for live messaging between customers and drivers. This guide explains how the system works and what you need to know.

## How Live Messaging Works

### 1. Database Structure

The messaging system uses two main tables:

- **`chats`**: Stores chat sessions linked to orders
  - `id`: Unique chat identifier
  - `order_id`: Links to the order
  - `customer_id`: The customer in the chat
  - `driver_id`: The assigned driver (can be null initially)
  
- **`messages`**: Stores individual messages
  - `id`: Unique message identifier
  - `chat_id`: Links to the chat session
  - `order_id`: Links to the order (for easier querying)
  - `sender_id`: The user who sent the message
  - `content`: The message text
  - `created_at`: Timestamp

### 2. Real-time Communication

The app uses Supabase Realtime's **broadcast** feature:

1. **When a message is sent:**
   - The message is saved to the `messages` table
   - A broadcast event is sent to the channel `order:{orderId}:messages`
   - All connected clients listening to that channel receive the update

2. **When a user opens a chat:**
   - The app subscribes to the channel `order:{orderId}:messages`
   - Any new messages are received in real-time
   - The UI updates automatically

### 3. Row Level Security (RLS)

The system uses RLS policies to ensure security:

- **Chats**: Users can only view/create chats for orders they're involved in
- **Messages**: Users can only send messages in chats they're part of
- **Realtime**: Broadcast permissions are checked against order participation

## Current Implementation

### Chat Access Points

1. **Customer Side:**
   - From the Order Detail screen (`/customer/order/[id]`)
   - Click the "💬 Chat" button when a driver is assigned
   - Located in the "Your Driver" section

2. **Driver Side:**
   - From the Driver Order Detail screen (`/driver/order/[id]`)
   - Click the "💬 Chat" button
   - Available for all assigned orders

### Chat Features

- ✅ Real-time message delivery
- ✅ Message bubbles (different colors for sender/receiver)
- ✅ Sender avatars and names
- ✅ Timestamps
- ✅ Auto-scroll to latest message
- ✅ Empty state when no messages
- ✅ Loading states
- ✅ Error handling

## Setup Requirements

### 1. Supabase Configuration

**Already configured in your project:**

- Realtime is enabled on your Supabase project
- RLS policies are in place
- Database triggers handle chat creation

**No additional setup needed!**

### 2. Environment Variables

Your app already has the required Supabase credentials in `src/config/supabase.ts`:

```typescript
const supabaseUrl = 'https://sytixskkgfvjjjemmoav.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

### 3. Network Requirements

For real-time messaging to work:

- The device must have an active internet connection
- WebSocket connections must be allowed (usually automatic)
- No special firewall rules needed

## Testing the Chat Feature

### Test Scenario 1: Customer-Driver Chat

1. **As Customer:**
   - Log in as a customer
   - Place an order
   - Wait for admin to confirm and assign a driver

2. **As Admin:**
   - Log in as admin
   - Go to pending orders
   - Confirm the order and assign a driver

3. **As Customer:**
   - Go to "My Orders"
   - Open the order
   - Click "💬 Chat" button
   - Send a message

4. **As Driver:**
   - Log in as the assigned driver
   - Go to "My Orders"
   - Open the same order
   - Click "💬 Chat" button
   - You should see the customer's message
   - Reply to the message

5. **As Customer:**
   - The driver's reply should appear automatically in real-time

### Test Scenario 2: Multiple Messages

1. Send several messages back and forth
2. Verify all messages appear in correct order
3. Check timestamps are accurate
4. Verify sender names and avatars display correctly

## Troubleshooting

### Issue: Messages not sending (403 error)

**Fixed!** The issue was that messages required a `chat_id` but the API wasn't creating chats properly.

**Solution implemented:**
- The `sendMessage` function now automatically creates a chat if one doesn't exist
- Chat creation includes both customer and driver IDs
- RLS policies allow users to create chats for their orders

### Issue: Messages not appearing in real-time

**Possible causes:**
1. **Network connection**: Check internet connectivity
2. **Realtime subscription**: The app automatically subscribes when opening chat
3. **Channel name**: Must match format `order:{orderId}:messages`

**Debug steps:**
1. Check browser/app console for errors
2. Look for "Successfully subscribed to messages channel" log
3. Verify WebSocket connection in Network tab

### Issue: Chat button not visible

**Possible causes:**
1. **No driver assigned**: Chat only appears after driver assignment
2. **Wrong screen**: Make sure you're on the Order Detail screen

**Solution:**
- For customers: Driver must be assigned first
- For drivers: Must be the assigned driver for that order

## API Reference

### Get Messages

```typescript
import { getMessages } from '../../api/messages';

const messages = await getMessages(orderId);
```

### Send Message

```typescript
import { sendMessage } from '../../api/messages';

const message = await sendMessage(orderId, senderId, content);
```

### Subscribe to Real-time Updates

```typescript
const channel = supabase.channel(`order:${orderId}:messages`);

channel
  .on('broadcast', { event: 'message_created' }, (payload) => {
    console.log('New message:', payload);
    // Update UI
  })
  .subscribe();
```

## Database Queries

### Check if chat exists for an order

```sql
SELECT * FROM chats WHERE order_id = 'your-order-id';
```

### View all messages for an order

```sql
SELECT m.*, u.name as sender_name
FROM messages m
JOIN users u ON m.sender_id = u.id
WHERE m.order_id = 'your-order-id'
ORDER BY m.created_at ASC;
```

### Check RLS policies

```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('chats', 'messages');
```

## Best Practices

1. **Always check for driver assignment** before showing chat button
2. **Handle connection errors gracefully** with retry logic
3. **Show loading states** while messages are being sent
4. **Auto-scroll to latest message** for better UX
5. **Clean up subscriptions** when leaving the chat screen

## Future Enhancements

Potential improvements for the messaging system:

- [ ] Read receipts (show when messages are read)
- [ ] Typing indicators (show when someone is typing)
- [ ] Image/file attachments
- [ ] Push notifications for new messages
- [ ] Message search functionality
- [ ] Chat history pagination for long conversations
- [ ] Emoji reactions to messages
- [ ] Voice messages

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your Supabase project is active
3. Ensure RLS policies are correctly configured
4. Test with different user roles (customer, driver, admin)

The messaging system is now fully functional and ready to use!
