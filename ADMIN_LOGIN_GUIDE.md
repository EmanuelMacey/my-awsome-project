
# Admin Login Guide

## How to Log In as Admin

To access the admin dashboard and oversee all customer and driver activities, follow these steps:

### Admin Credentials

- **Email:** `admin@errandrunners.gy`
- **Password:** `Admin1234`

### Login Steps

1. **Open the App**
   - Launch the ErrandRunners app on your device

2. **Navigate to Login Screen**
   - From the landing screen, tap on "Login"

3. **Enter Admin Credentials**
   - Email: `admin@errandrunners.gy`
   - Password: `Admin1234`

4. **Tap Login**
   - The app will automatically detect admin credentials and redirect you to the Admin Dashboard

### What You Can Do as Admin

Once logged in as admin, you have full access to:

#### 1. **View All Orders**
   - See all orders from all customers
   - Monitor order statuses in real-time
   - View order details including customer info, driver info, and items

#### 2. **Manage Stores**
   - Add new stores/restaurants
   - Edit existing store information
   - Update store menus and pricing
   - Upload store logos

#### 3. **Manage Users**
   - View all registered users (customers and drivers)
   - See user details and activity
   - Change user roles if needed

#### 4. **Monitor Errands**
   - View all errand requests
   - Track errand statuses
   - See errand details and pricing

#### 5. **System Overview**
   - Dashboard with key metrics
   - Total orders count
   - Active drivers count
   - Revenue statistics

### Admin Dashboard Features

The admin dashboard provides:

- **Real-time Updates:** All data updates automatically as orders and errands are created/updated
- **Comprehensive View:** See what both customers and drivers see, plus additional management tools
- **Full Control:** Ability to manage all aspects of the platform

### Troubleshooting

If you have issues logging in as admin:

1. **Verify Credentials**
   - Make sure you're using the exact email: `admin@errandrunners.gy`
   - Password is case-sensitive: `Admin1234`

2. **Check Internet Connection**
   - Ensure you have a stable internet connection

3. **Clear App Cache**
   - If login fails, try restarting the app

4. **Contact Support**
   - If issues persist, check the app logs for error messages

### Security Note

The admin credentials are hardcoded for initial setup. For production use, it's recommended to:

- Change the default admin password
- Implement proper admin user management
- Add two-factor authentication
- Set up role-based access control

### Admin vs Regular Users

| Feature | Customer | Driver | Admin |
|---------|----------|--------|-------|
| Browse Stores | ✓ | ✗ | ✓ |
| Place Orders | ✓ | ✗ | ✓ |
| Accept Orders | ✗ | ✓ | ✓ |
| Manage Deliveries | ✗ | ✓ | ✓ |
| View All Orders | ✗ | ✗ | ✓ |
| Manage Stores | ✗ | ✗ | ✓ |
| Manage Users | ✗ | ✗ | ✓ |
| System Analytics | ✗ | ✗ | ✓ |

### Quick Access

For quick admin access during development:

```typescript
// Admin credentials
const ADMIN_EMAIL = 'admin@errandrunners.gy';
const ADMIN_PASSWORD = 'Admin1234';
```

The admin detection is handled automatically in the `AuthContext.tsx` file, which checks if the login credentials match the admin credentials and redirects accordingly.
