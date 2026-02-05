
# ErrandRunners - Project Information

## Project Overview

**ErrandRunners** is a full-featured delivery application built with React Native, Expo, and Supabase. It connects customers with drivers for on-demand delivery of items from local stores.

## Key Features

### For Customers
- Browse stores by category
- View store items with images and prices
- Add items to cart with quantity selection
- Place orders with automatic total calculation
- Track order status in real-time
- Chat with assigned driver in real-time
- View order history

### For Drivers
- View available orders
- Accept pending orders
- Update order status (accepted → in_transit → delivered)
- View customer and store information
- Chat with customers in real-time
- Track delivery history

### For Admins (Planned)
- View all orders and users
- Manage stores and items
- View analytics and reports
- Manage user roles

## Technology Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo 54**: Development framework and tooling
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based navigation
- **React Context**: State management

### Backend
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage for images
  - Row Level Security (RLS)

### Real-time Features
- **Supabase Realtime**: WebSocket-based real-time updates
- **Broadcast Channels**: For order status and messages
- **Database Triggers**: Automatic broadcasting of changes

## Database Schema

### Tables

**users**
- id (UUID, references auth.users)
- name (TEXT)
- phone (TEXT)
- email (TEXT)
- role (TEXT: customer, driver, admin)
- created_at (TIMESTAMPTZ)

**stores**
- id (UUID)
- name (TEXT)
- address (TEXT)
- logo (TEXT, URL to image)
- description (TEXT)
- category (TEXT)
- created_at (TIMESTAMPTZ)

**store_items**
- id (UUID)
- store_id (UUID, references stores)
- name (TEXT)
- price (DECIMAL)
- image (TEXT, URL to image)
- created_at (TIMESTAMPTZ)

**orders**
- id (UUID)
- customer_id (UUID, references users)
- driver_id (UUID, references users, nullable)
- store_id (UUID, references stores)
- status (TEXT: pending, accepted, in_transit, delivered, cancelled)
- total (DECIMAL)
- created_at (TIMESTAMPTZ)

**order_items**
- id (UUID)
- order_id (UUID, references orders)
- item_id (UUID, references store_items)
- quantity (INTEGER)
- created_at (TIMESTAMPTZ)

**messages**
- id (UUID)
- order_id (UUID, references orders)
- sender_id (UUID, references users)
- content (TEXT)
- created_at (TIMESTAMPTZ)

## Security

### Authentication
- Email/password authentication via Supabase Auth
- JWT tokens for API access
- Session persistence with AsyncStorage
- Auto-refresh tokens

### Authorization
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Customers can only see their orders
- Drivers can only see assigned orders
- Private realtime channels with RLS

### Data Protection
- HTTPS for all API calls
- WSS (WebSocket Secure) for realtime
- Signed URLs for storage access
- Input validation and sanitization

## Real-time Architecture

### Channel Naming Convention
- **Orders**: `orders:{order_id}`
- **Messages**: `messages:{order_id}`

### Broadcast Events
- **INSERT**: New record created
- **UPDATE**: Record updated
- **DELETE**: Record deleted

### Database Triggers
- `orders_realtime_trigger`: Broadcasts order changes
- `messages_realtime_trigger`: Broadcasts new messages

### RLS Policies
- Users can only subscribe to channels for their orders
- Policies on `realtime.messages` table control access
- Private channels require authentication

## Project Structure

```
ErrandRunners/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── (home)/              # Home tab
│   │   │   ├── index.tsx        # Home screen
│   │   │   └── _layout.tsx      # Home layout
│   │   ├── profile.tsx          # Profile screen
│   │   └── _layout.tsx          # Tab layout
│   ├── auth/                    # Authentication
│   │   ├── landing.tsx          # Landing screen
│   │   ├── login.tsx            # Login screen
│   │   └── register.tsx         # Register screen
│   ├── customer/                # Customer screens
│   │   ├── cart.tsx             # Shopping cart
│   │   ├── home.tsx             # Store list
│   │   ├── orders.tsx           # Order history
│   │   ├── order/[id].tsx       # Order detail
│   │   └── store/[id].tsx       # Store detail
│   ├── driver/                  # Driver screens
│   │   ├── dashboard.tsx        # Driver dashboard
│   │   └── order/[id].tsx       # Order detail
│   ├── chat/                    # Chat
│   │   └── [orderId].tsx        # Chat screen
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Entry point
├── src/
│   ├── api/                     # API functions
│   │   ├── messages.ts          # Message API
│   │   ├── orders.ts            # Orders API
│   │   └── stores.ts            # Stores API
│   ├── components/              # Reusable components
│   │   ├── ErrorMessage.tsx     # Error display
│   │   ├── ItemCard.tsx         # Item card
│   │   ├── LoadingSpinner.tsx   # Loading indicator
│   │   ├── OrderCard.tsx        # Order card
│   │   └── StoreCard.tsx        # Store card
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx      # Auth state
│   │   └── CartContext.tsx      # Cart state
│   ├── screens/                 # Screen components
│   │   ├── auth/                # Auth screens
│   │   ├── customer/            # Customer screens
│   │   ├── driver/              # Driver screens
│   │   └── chat/                # Chat screen
│   ├── config/                  # Configuration
│   │   └── supabase.ts          # Supabase client
│   ├── styles/                  # Styling
│   │   └── theme.ts             # Theme config
│   └── types/                   # TypeScript types
│       └── database.types.ts    # Database types
├── assets/                      # Static assets
│   ├── fonts/                   # Custom fonts
│   └── images/                  # Images
├── components/                  # Expo components
│   ├── FloatingTabBar.tsx       # Tab bar
│   └── ...                      # Other components
├── supabase_setup.sql           # Database setup
├── .env                         # Environment variables
├── app.json                     # Expo config
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── SETUP_GUIDE.md               # Setup instructions
├── REALTIME_SETUP.md            # Realtime guide
├── IMPLEMENTATION_SUMMARY.md    # Implementation details
├── QUICKSTART.md                # Quick start guide
└── PROJECT_INFO.md              # This file
```

## API Functions

### Authentication
- `signUp()`: Register new user
- `signIn()`: Login user
- `signOut()`: Logout user
- `getSession()`: Get current session

### Stores
- `getStores()`: Get all stores
- `getStoreById(id)`: Get single store
- `getStoreItems(storeId)`: Get items in store

### Orders
- `createOrder()`: Create new order
- `getOrdersByCustomer(customerId)`: Get customer orders
- `getOrdersByDriver(driverId)`: Get driver orders
- `getOrderById(orderId)`: Get single order
- `getOrderItems(orderId)`: Get items in order
- `updateOrderStatus(orderId, status)`: Update status
- `assignDriver(orderId, driverId)`: Assign driver

### Messages
- `getMessages(orderId)`: Get messages for order
- `sendMessage(orderId, senderId, content)`: Send message

## UI Components

### Reusable Components
- **StoreCard**: Display store information
- **ItemCard**: Display item with add to cart
- **OrderCard**: Display order summary
- **LoadingSpinner**: Loading indicator with message
- **ErrorMessage**: Error display with retry button

### Theme System
- Centralized color palette
- Consistent spacing and sizing
- Reusable styles
- Dark mode support (planned)

## State Management

### Contexts
- **AuthContext**: User authentication state
- **CartContext**: Shopping cart state

### Local State
- Component-level state with useState
- Ref-based state for realtime channels

## Navigation

### Structure
- Tab navigation for main screens
- Stack navigation for detail screens
- Modal screens for chat
- Deep linking support

### Routes
- `/auth/landing`: Landing screen
- `/auth/login`: Login screen
- `/auth/register`: Register screen
- `/customer/home`: Store list
- `/customer/store/[id]`: Store detail
- `/customer/cart`: Shopping cart
- `/customer/orders`: Order history
- `/customer/order/[id]`: Order detail
- `/driver/dashboard`: Driver dashboard
- `/driver/order/[id]`: Order detail
- `/chat/[orderId]`: Chat screen
- `/profile`: Profile screen

## Environment Variables

Required in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Development Workflow

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure `.env` file
4. Set up Supabase project
5. Run database setup script
6. Create test users

### Development
1. Start dev server: `npm run dev`
2. Test on device with Expo Go
3. Make changes and see live updates
4. Check console for errors

### Testing
1. Test authentication flow
2. Test customer features
3. Test driver features
4. Test realtime updates
5. Test chat functionality

## Deployment

### Build for Testing
```bash
# iOS
eas build --platform ios --profile preview

# Android
eas build --platform android --profile preview
```

### Build for Production
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

### Submit to Stores
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Performance Considerations

### Optimizations
- Dedicated realtime channels per order
- Efficient database queries with indexes
- Lazy loading of images
- Proper cleanup of subscriptions
- Memoization of expensive computations

### Best Practices
- Check channel state before subscribing
- Clean up subscriptions on unmount
- Use refs to prevent duplicate subscriptions
- Handle errors gracefully
- Show loading states

## Known Issues

1. **Maps**: react-native-maps not supported in Natively
2. **Image Upload**: Not implemented in UI (manual upload)
3. **Push Notifications**: Not implemented
4. **Payment Integration**: Not implemented

## Future Enhancements

### High Priority
- Admin dashboard
- Push notifications
- Image upload from app
- Order cancellation
- Driver location tracking

### Medium Priority
- Payment integration
- Order ratings and reviews
- Favorite stores
- Multiple delivery addresses
- Estimated delivery time

### Low Priority
- Dark mode
- Offline support
- Analytics dashboard
- Promotional codes
- Loyalty program

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Write clean, readable code
- Add comments for complex logic

### Git Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Commit with clear message
5. Create pull request

## License

This project is proprietary and confidential.

## Contact

For questions or support:
- Owner: Emanuel Macey
- Phone: +592 683 4060
- Address: 464 East Ruimveldt

## Version History

### v1.0.0 (Current)
- Initial release
- Customer and driver features
- Real-time order tracking
- Real-time messaging
- Authentication system
- Database with RLS
- Storage integration

---

**Last Updated**: January 2025
