
# ErrandRunners API Documentation

## Overview
This document describes all API functions available in the ErrandRunners app.

---

## 📦 Orders API (`src/api/orders.ts`)

### `createOrder()`
Creates a new order with items.

**Parameters**:
- `customerId` (string) - Customer user ID
- `storeId` (string) - Store ID
- `items` (array) - Array of `{ item_id, quantity }`
- `total` (number) - Total amount in GYD
- `paymentMethod` (string) - Payment method
- `deliveryAddress` (string) - Delivery address
- `deliveryNotes` (string) - Optional notes
- `subtotal` (number) - Subtotal amount
- `deliveryFee` (number) - Delivery fee
- `tax` (number) - Tax amount

**Returns**: `Promise<Order>`

**Example**:
```typescript
const order = await createOrder(
  userId,
  storeId,
  [{ item_id: 'abc', quantity: 2 }],
  5000,
  'cash',
  '123 Main St',
  'Ring doorbell',
  4500,
  500,
  630
);
```

---

### `getOrdersByCustomer()`
Gets all orders for a customer.

**Parameters**:
- `customerId` (string) - Customer user ID

**Returns**: `Promise<Order[]>`

**Example**:
```typescript
const orders = await getOrdersByCustomer(userId);
```

---

### `getOrderById()`
Gets a single order by ID with full details.

**Parameters**:
- `orderId` (string) - Order ID

**Returns**: `Promise<Order>`

**Example**:
```typescript
const order = await getOrderById('order-123');
```

---

### `getOrderItems()`
Gets all items for an order.

**Parameters**:
- `orderId` (string) - Order ID

**Returns**: `Promise<OrderItem[]>`

**Example**:
```typescript
const items = await getOrderItems('order-123');
```

---

### `updateOrderStatus()`
Updates the status of an order.

**Parameters**:
- `orderId` (string) - Order ID
- `status` (string) - New status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'

**Returns**: `Promise<void>`

**Example**:
```typescript
await updateOrderStatus('order-123', 'in_transit');
```

---

### `assignDriver()`
Assigns a driver to an order.

**Parameters**:
- `orderId` (string) - Order ID
- `driverId` (string) - Driver user ID

**Returns**: `Promise<void>`

**Example**:
```typescript
await assignDriver('order-123', 'driver-456');
```

---

## 🏪 Stores API (`src/api/stores.ts`)

### `getStores()`
Gets all stores.

**Returns**: `Promise<Store[]>`

**Example**:
```typescript
const stores = await getStores();
```

---

### `getStoreById()`
Gets a single store by ID.

**Parameters**:
- `storeId` (string) - Store ID

**Returns**: `Promise<Store>`

**Example**:
```typescript
const store = await getStoreById('store-123');
```

---

### `getStoreItems()`
Gets all items for a store.

**Parameters**:
- `storeId` (string) - Store ID

**Returns**: `Promise<StoreItem[]>`

**Example**:
```typescript
const items = await getStoreItems('store-123');
```

---

## 📍 Driver Location API (`src/api/driverLocation.ts`)

### `updateDriverLocation()`
Updates driver's current location.

**Parameters**:
- `driverId` (string) - Driver user ID
- `orderId` (string) - Order ID
- `latitude` (number) - Latitude coordinate
- `longitude` (number) - Longitude coordinate
- `heading` (number, optional) - Direction in degrees
- `speed` (number, optional) - Speed in km/h
- `accuracy` (number, optional) - GPS accuracy in meters

**Returns**: `Promise<void>`

**Example**:
```typescript
await updateDriverLocation(
  'driver-123',
  'order-456',
  6.8013,
  -58.1551,
  45,
  30,
  10
);
```

---

### `getDriverLocation()`
Gets current driver location for an order.

**Parameters**:
- `orderId` (string) - Order ID

**Returns**: `Promise<DriverLocation | null>`

**Example**:
```typescript
const location = await getDriverLocation('order-123');
if (location) {
  console.log(`Driver at: ${location.latitude}, ${location.longitude}`);
}
```

---

### `subscribeToDriverLocation()`
Subscribes to real-time driver location updates.

**Parameters**:
- `orderId` (string) - Order ID
- `callback` (function) - Callback function called on updates

**Returns**: `RealtimeChannel`

**Example**:
```typescript
const channel = await subscribeToDriverLocation(
  'order-123',
  (location) => {
    console.log('Driver moved:', location);
    setDriverLocation(location);
  }
);

// Later, unsubscribe:
supabase.removeChannel(channel);
```

---

## 💬 Messages API (`src/api/messages.ts`)

### `sendMessage()`
Sends a message in order chat.

**Parameters**:
- `orderId` (string) - Order ID
- `senderId` (string) - Sender user ID
- `content` (string) - Message content

**Returns**: `Promise<Message>`

**Example**:
```typescript
const message = await sendMessage(
  'order-123',
  'user-456',
  'Hello, I am on my way!'
);
```

---

### `getMessages()`
Gets all messages for an order.

**Parameters**:
- `orderId` (string) - Order ID

**Returns**: `Promise<Message[]>`

**Example**:
```typescript
const messages = await getMessages('order-123');
```

---

### `subscribeToMessages()`
Subscribes to real-time message updates.

**Parameters**:
- `orderId` (string) - Order ID
- `callback` (function) - Callback function

**Returns**: `RealtimeChannel`

**Example**:
```typescript
const channel = await subscribeToMessages(
  'order-123',
  (message) => {
    console.log('New message:', message);
    addMessageToChat(message);
  }
);
```

---

## 💳 Payment API (`src/api/payment.ts`)

### `createPaymentIntent()`
Creates a payment intent (Stripe integration required).

**Parameters**:
- `orderId` (string) - Order ID
- `amount` (number) - Amount in cents
- `currency` (string) - Currency code
- `paymentMethod` (string) - Payment method

**Returns**: `Promise<PaymentIntent>`

**Status**: ⏳ Requires Stripe API keys

---

### `updateOrderPaymentStatus()`
Updates payment status for an order.

**Parameters**:
- `orderId` (string) - Order ID
- `status` (string) - Payment status
- `paymentIntentId` (string, optional) - Payment intent ID

**Returns**: `Promise<void>`

**Example**:
```typescript
await updateOrderPaymentStatus('order-123', 'completed', 'pi_123');
```

---

### `processCashPayment()`
Marks order as cash payment.

**Parameters**:
- `orderId` (string) - Order ID

**Returns**: `Promise<void>`

**Example**:
```typescript
await processCashPayment('order-123');
```

---

### `getPaymentStatus()`
Gets payment status for an order.

**Parameters**:
- `orderId` (string) - Order ID

**Returns**: `Promise<{ status, method, amount }>`

**Example**:
```typescript
const payment = await getPaymentStatus('order-123');
console.log(`Status: ${payment.status}, Method: ${payment.method}`);
```

---

## 🔐 Authentication Context (`src/contexts/AuthContext.tsx`)

### `useAuth()`
Hook to access authentication state and functions.

**Returns**:
```typescript
{
  session: Session | null,
  user: User | null,
  loading: boolean,
  signIn: (email, password) => Promise<{ error? }>,
  signUp: (email, password, name, phone, role) => Promise<{ error?, needsVerification? }>,
  signOut: () => Promise<void>
}
```

**Example**:
```typescript
const { user, signOut } = useAuth();

if (user) {
  console.log(`Logged in as: ${user.name}`);
}

await signOut();
```

---

## 🛒 Cart Context (`src/contexts/CartContext.tsx`)

### `useCart()`
Hook to access cart state and functions.

**Returns**:
```typescript
{
  cart: CartItem[],
  storeId: string | null,
  addToCart: (item: StoreItem) => void,
  removeFromCart: (itemId: string) => void,
  updateQuantity: (itemId: string, quantity: number) => void,
  clearCart: () => void,
  getTotal: () => number,
  setStoreId: (id: string) => void
}
```

**Example**:
```typescript
const { cart, addToCart, getTotal } = useCart();

addToCart(item);
const total = getTotal();
console.log(`Cart total: GY$${total}`);
```

---

## 💰 Currency Utilities (`src/utils/currency.ts`)

### `formatCurrency()`
Formats amount in Guyanese Dollars.

**Parameters**:
- `amount` (number) - Amount to format

**Returns**: `string`

**Example**:
```typescript
formatCurrency(5000); // "GY$5,000.00"
```

---

### `calculateDeliveryFee()`
Calculates delivery fee based on distance.

**Parameters**:
- `distance` (number) - Distance in km (default: 5)

**Returns**: `number`

**Formula**: `GY$500 + (distance × GY$100)`

**Example**:
```typescript
calculateDeliveryFee(5); // 1000 (GY$500 + 5×GY$100)
```

---

### `calculateTax()`
Calculates 14% VAT.

**Parameters**:
- `subtotal` (number) - Subtotal amount

**Returns**: `number`

**Example**:
```typescript
calculateTax(5000); // 700 (14% of 5000)
```

---

## 🔧 Payment Utilities (`src/utils/payment.ts`)

### `validateMMGNumber()`
Validates MMG phone number format.

**Parameters**:
- `number` (string) - Phone number

**Returns**: `boolean`

**Example**:
```typescript
validateMMGNumber('+592 683 4060'); // true
validateMMGNumber('123'); // false
```

---

### `validateCardNumber()`
Validates credit card number format.

**Parameters**:
- `number` (string) - Card number

**Returns**: `boolean`

**Example**:
```typescript
validateCardNumber('4242424242424242'); // true
validateCardNumber('123'); // false
```

---

## 📊 Database Types (`src/types/database.types.ts`)

### User
```typescript
interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'customer' | 'driver' | 'admin';
  created_at: string;
  avatar_url?: string;
  rating?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  license_plate?: string;
}
```

### Store
```typescript
interface Store {
  id: string;
  name: string;
  address: string;
  logo: string | null;
  description: string;
  category: string;
  created_at: string;
  is_featured?: boolean;
  rating?: number;
  delivery_time?: string;
}
```

### StoreItem
```typescript
interface StoreItem {
  id: string;
  store_id: string;
  name: string;
  price: number;
  image: string | null;
  created_at: string;
  category?: string;
  in_stock?: boolean;
  description?: string;
}
```

### Order
```typescript
interface Order {
  id: string;
  customer_id: string;
  driver_id: string | null;
  store_id: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  total: number;
  created_at: string;
  customer?: User;
  driver?: User;
  store?: Store;
  payment_method?: string;
  payment_status?: string;
  currency?: string;
  delivery_address?: string;
  delivery_notes?: string;
  delivery_fee?: number;
  tax?: number;
  subtotal?: number;
}
```

### OrderItem
```typescript
interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  item?: StoreItem;
}
```

### DriverLocation
```typescript
interface DriverLocation {
  id: string;
  driver_id: string;
  order_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updated_at: string;
  created_at: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: User;
}
```

---

## 🔄 Real-time Subscriptions

### Order Updates
```typescript
const channel = supabase
  .channel(`orders:${orderId}`)
  .on('broadcast', { event: 'UPDATE' }, (payload) => {
    console.log('Order updated:', payload);
  })
  .subscribe();
```

### Driver Location Updates
```typescript
const channel = supabase
  .channel(`driver_location:${orderId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'driver_locations',
    filter: `order_id=eq.${orderId}`
  }, (payload) => {
    console.log('Location updated:', payload);
  })
  .subscribe();
```

### Message Updates
```typescript
const channel = supabase
  .channel(`messages:${orderId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `order_id=eq.${orderId}`
  }, (payload) => {
    console.log('New message:', payload);
  })
  .subscribe();
```

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with policies:

### Orders
- Customers can read their own orders
- Drivers can read assigned orders
- Customers can create orders
- Drivers can update assigned orders

### Order Items
- Users can read items for their orders
- Customers can create items for their orders

### Driver Locations
- Drivers can insert/update their own locations
- Customers can view locations for their orders
- Drivers can view their own locations

### Messages
- Users can read messages for their orders
- Users can send messages for their orders

---

## 📝 Error Handling

All API functions throw errors that should be caught:

```typescript
try {
  const order = await getOrderById(orderId);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error (show toast, retry, etc.)
}
```

---

## 🚀 Best Practices

1. **Always handle errors**
   ```typescript
   try {
     await apiFunction();
   } catch (error) {
     handleError(error);
   }
   ```

2. **Use loading states**
   ```typescript
   setLoading(true);
   try {
     await apiFunction();
   } finally {
     setLoading(false);
   }
   ```

3. **Clean up subscriptions**
   ```typescript
   useEffect(() => {
     const channel = subscribeToUpdates();
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);
   ```

4. **Validate input**
   ```typescript
   if (!validateInput(data)) {
     throw new Error('Invalid input');
   }
   ```

5. **Use TypeScript types**
   ```typescript
   const order: Order = await getOrderById(id);
   ```

---

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Status**: Complete ✅
