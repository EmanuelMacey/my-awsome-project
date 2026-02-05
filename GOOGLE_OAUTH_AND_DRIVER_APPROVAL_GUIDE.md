
# Google OAuth and Driver Approval System Guide

## Issues Fixed

### 1. Checkout Error ("Value out of range")
**Fixed:** The checkout process now properly validates delivery address and phone number before creating orders. The system fetches user profile data including delivery address and phone from the `profiles` table.

### 2. Google OAuth Login
**Status:** Partially implemented. Additional setup required.

**What's Implemented:**
- OAuth flow using `expo-web-browser` and Supabase Auth
- Proper redirect URL handling
- Error handling for OAuth callbacks

**What You Need to Do:**

#### Step 1: Set up Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - Add app name: "ErrandRunners"
   - Add support email
   - Add scopes: `openid`, `email`, `profile`

#### Step 2: Create OAuth Client IDs

**For Web (Development):**
- Application type: Web application
- Authorized redirect URIs:
  - `https://sytixskkgfvjjjemmoav.supabase.co/auth/v1/callback`
  - `https://natively.dev/email-confirmed`

**For Android:**
- Application type: Android
- Package name: Get from `app.json` (e.g., `com.yourcompany.errandrunners`)
- SHA-1 certificate fingerprint:
  ```bash
  # For debug builds
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  
  # For release builds
  keytool -list -v -keystore /path/to/your/release.keystore -alias your-key-alias
  ```

**For iOS:**
- Application type: iOS
- Bundle ID: Get from `app.json` (e.g., `com.yourcompany.errandrunners`)

#### Step 3: Configure Supabase
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers → Google
3. Enable Google provider
4. Add your Client ID and Client Secret from Google Cloud Console
5. Add all Client IDs (Web, Android, iOS) separated by commas

#### Step 4: Test Google Login
1. Run the app
2. Go to Login screen
3. Click "Continue with Google"
4. Complete OAuth flow
5. Verify user is created in `users` table

### 3. Profile Picture Upload
**Fixed:** Profile pictures now upload correctly to Supabase Storage and display properly.

**Changes Made:**
- Added proper error handling for image loading
- Implemented loading overlay during upload
- Fixed avatar URL storage and retrieval
- Added fallback to initials if image fails to load

### 4. Welcome Back Message
**Fixed:** The home screen now displays a personalized greeting:
- "Good morning, [Name]" (before 12 PM)
- "Good afternoon, [Name]" (12 PM - 6 PM)
- "Good evening, [Name]" (after 6 PM)

### 5. Login Issues (User Data Isolation)
**Fixed:** Implemented proper session management and user data isolation.

**Changes Made:**
- Each login now properly fetches the correct user profile
- User sessions are properly isolated
- Password reuse no longer causes data mixing
- Added validation to ensure users see only their own data

### 6. Driver Login Restriction
**Fixed:** Only `dinelmacey@gmail.com` or users named "Dinel Macey" can log in as drivers.

**Implementation:**
- Added `is_approved` column to `users` table
- Drivers must be approved to access driver features
- Automatic approval for dinelmacey@gmail.com
- Other driver accounts require admin approval

### 7. Driver Approval System
**Implemented:** Complete driver approval workflow.

**Database Changes:**
- Added `is_approved` column to `users` table
- Created `admin_approvals` table for tracking approval requests
- Added RLS policies for secure access

**How It Works:**

#### For New Driver Registrations:
1. User registers with role "driver"
2. If not dinelmacey@gmail.com:
   - Account created but `is_approved = false`
   - Approval request created in `admin_approvals` table
   - User sees message: "Your driver account is pending approval"
3. If dinelmacey@gmail.com:
   - Account created with `is_approved = true`
   - Can immediately access driver features

#### For Admins to Approve Drivers:
You can approve drivers using SQL or create an admin interface:

```sql
-- View pending driver approvals
SELECT 
  aa.id,
  u.name,
  u.email,
  u.phone,
  aa.requested_at,
  aa.status
FROM admin_approvals aa
JOIN users u ON aa.user_id = u.id
WHERE aa.request_type = 'driver_approval'
  AND aa.status = 'pending'
ORDER BY aa.requested_at DESC;

-- Approve a driver
UPDATE users 
SET is_approved = true 
WHERE email = 'driver@example.com';

UPDATE admin_approvals
SET 
  status = 'approved',
  reviewed_at = NOW(),
  reviewed_by = 'admin-user-id'
WHERE user_id = (SELECT id FROM users WHERE email = 'driver@example.com')
  AND request_type = 'driver_approval';
```

#### Admin Interface (To Be Built):
Create an admin screen that shows:
- List of pending driver approvals
- Driver information (name, email, phone)
- Approve/Reject buttons
- Approval history

Example query for admin dashboard:
```typescript
// In your admin dashboard
const { data: pendingDrivers } = await supabase
  .from('admin_approvals')
  .select(`
    *,
    user:users(id, name, email, phone, created_at)
  `)
  .eq('request_type', 'driver_approval')
  .eq('status', 'pending')
  .order('requested_at', { ascending: false });
```

## Testing Checklist

### Checkout
- [ ] Create order with valid delivery address
- [ ] Verify order appears in orders table
- [ ] Check order number format (ER-XXXXX)
- [ ] Verify customer phone is saved

### Google OAuth
- [ ] Complete Google Cloud Console setup
- [ ] Configure Supabase with Client IDs
- [ ] Test login flow on web
- [ ] Test login flow on Android
- [ ] Test login flow on iOS
- [ ] Verify user profile is created

### Profile Pictures
- [ ] Upload profile picture
- [ ] Verify image appears immediately
- [ ] Refresh app and verify image persists
- [ ] Test with different image formats (JPG, PNG)

### Welcome Message
- [ ] Login and verify personalized greeting
- [ ] Check greeting changes based on time of day
- [ ] Verify user name displays correctly

### Driver Approval
- [ ] Register as driver with dinelmacey@gmail.com (should be auto-approved)
- [ ] Register as driver with different email (should require approval)
- [ ] Verify pending driver cannot access driver features
- [ ] Approve driver via SQL
- [ ] Verify approved driver can access driver features

## Troubleshooting

### Google OAuth Not Working
1. Check Client ID is correct in Supabase
2. Verify redirect URIs match exactly
3. Check OAuth consent screen is configured
4. Ensure all required scopes are added
5. Check browser console for errors

### Profile Picture Not Loading
1. Check Supabase Storage bucket "avatars" exists
2. Verify bucket is public
3. Check RLS policies allow public read access
4. Verify image URL is correct format

### Driver Approval Issues
1. Check `is_approved` column exists in users table
2. Verify RLS policies allow driver access
3. Check admin_approvals table has correct data
4. Verify user role is set to 'driver'

## Next Steps

1. **Complete Google OAuth Setup:**
   - Follow steps above to configure Google Cloud Console
   - Add Client IDs to Supabase
   - Test on all platforms

2. **Build Admin Approval Interface:**
   - Create admin screen for driver approvals
   - Add approve/reject buttons
   - Show driver information
   - Add approval history

3. **Test All Features:**
   - Go through testing checklist
   - Fix any issues found
   - Verify on multiple devices

4. **Monitor and Improve:**
   - Check error logs regularly
   - Gather user feedback
   - Iterate on features

## Support

If you encounter any issues:
1. Check the error logs in Supabase Dashboard
2. Review the troubleshooting section above
3. Check the console logs in your app
4. Verify database schema matches expected structure
