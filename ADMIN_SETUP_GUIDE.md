
# Admin Setup Guide

## Initial Setup Required

Before you can use the admin panel, you need to create the admin user account in Supabase.

---

## Step 1: Create Admin User in Supabase Auth

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** or **Invite User**
4. Fill in the details:
   - **Email**: `admin@errandrunners.gy`
   - **Password**: `Admin1234`
   - **Auto Confirm User**: ✅ (Check this box)
5. Click **Create User**

### Option B: Using SQL (Advanced)

Run this SQL in the Supabase SQL Editor:

```sql
-- Create admin user in auth.users
-- Note: You'll need to use Supabase Dashboard for this
-- as direct auth.users manipulation requires special permissions
```

**Important**: You must use the Supabase Dashboard to create auth users. Direct SQL insertion into `auth.users` is not recommended.

---

## Step 2: Create Admin Profile in Users Table

After creating the auth user, create the profile:

### Using Supabase SQL Editor:

```sql
-- First, get the user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@errandrunners.gy';

-- Then insert into users table (replace YOUR_USER_ID with the actual ID)
INSERT INTO users (id, email, name, phone, role)
VALUES (
  'YOUR_USER_ID',  -- Replace with actual UUID from above query
  'admin@errandrunners.gy',
  'Admin User',
  '592-000-0000',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

### Automatic Creation (Preferred):

The app will automatically create the user profile when you first log in with the admin credentials, thanks to the trigger in the database. However, you still need to create the auth user first.

---

## Step 3: Verify Admin User

### Check Auth User:
```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'admin@errandrunners.gy';
```

### Check Profile:
```sql
SELECT id, email, name, role 
FROM users 
WHERE email = 'admin@errandrunners.gy';
```

Both queries should return results.

---

## Step 4: Test Admin Login

1. Open the ErrandRunners app
2. Go to the login screen
3. Enter credentials:
   - Email: `admin@errandrunners.gy`
   - Password: `Admin1234`
4. Click **Login**
5. You should be redirected to the Admin Dashboard

---

## Step 5: Create Emanuel Macey User (Optional)

The app will automatically create this user when you accept your first errand. However, you can create it manually:

```sql
-- Check if Emanuel Macey exists
SELECT id, email, name, role FROM users WHERE name = 'Emanuel Macey';

-- If not exists, create manually
INSERT INTO users (email, name, phone, role)
VALUES (
  'emanuel.macey@errandrunners.gy',
  'Emanuel Macey',
  '592-000-0000',
  'driver'
)
ON CONFLICT (email) DO NOTHING;
```

---

## Troubleshooting Setup

### Issue: "User already exists" error
**Solution**: The auth user was created but profile wasn't. Run Step 2 again.

### Issue: "Email not confirmed" error
**Solution**: 
1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Click the three dots menu
4. Select "Confirm Email"

### Issue: Cannot login with admin credentials
**Solution**:
1. Verify user exists in auth.users
2. Verify password is correct
3. Check if email is confirmed
4. Try resetting password in Supabase Dashboard

### Issue: Login works but redirects to customer home
**Solution**:
1. Check user role in users table
2. Should be 'admin', not 'customer' or 'driver'
3. Update role:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@errandrunners.gy';
```

---

## Security Recommendations

### After Initial Setup:

1. **Change Default Password**
   - Use Supabase Dashboard to update password
   - Choose a strong, unique password
   - Store securely

2. **Enable MFA (Optional)**
   - Go to Supabase Dashboard
   - Enable Multi-Factor Authentication
   - Follow setup instructions

3. **Monitor Access**
   - Check Supabase logs regularly
   - Review admin actions
   - Set up alerts for suspicious activity

4. **Backup Credentials**
   - Store admin credentials securely
   - Use password manager
   - Document recovery process

---

## Alternative Admin Credentials

If you want to use different credentials:

### Update Code:

1. **In `src/contexts/AuthContext.tsx`**:
```typescript
// Change this line:
if (email === 'admin@errandrunners.gy' && password === 'Admin1234') {

// To your credentials:
if (email === 'your-admin@email.com' && password === 'YourPassword') {
```

2. **In `src/screens/admin/AdminDashboardScreen.tsx`**:
```typescript
// Change this line:
if (user && user.email !== 'admin@errandrunners.gy') {

// To your email:
if (user && user.email !== 'your-admin@email.com') {
```

3. **In `app/index.tsx`**:
```typescript
// Change this line:
if (user?.email === 'admin@errandrunners.gy' || user?.role === 'admin') {

// To your email:
if (user?.email === 'your-admin@email.com' || user?.role === 'admin') {
```

4. **Update Documentation**:
   - Update all references to admin email
   - Update QUICK_ADMIN_REFERENCE.md
   - Update TROUBLESHOOTING_GUIDE.md

---

## Multiple Admin Users (Future Enhancement)

Currently, the system supports only one admin user. To add multiple admins:

### Option 1: Role-Based (Recommended)
Remove email checks and only check role:

```typescript
// In AdminDashboardScreen.tsx
if (user && user.role !== 'admin') {
  Alert.alert('Access Denied');
  router.replace('/customer/home');
  return;
}
```

Then create multiple users with role='admin' in the database.

### Option 2: Email List
Create an array of admin emails:

```typescript
const ADMIN_EMAILS = [
  'admin@errandrunners.gy',
  'admin2@errandrunners.gy',
  'manager@errandrunners.gy',
];

if (user && !ADMIN_EMAILS.includes(user.email)) {
  Alert.alert('Access Denied');
  router.replace('/customer/home');
  return;
}
```

---

## Verification Checklist

After setup, verify:

- [ ] Admin user exists in auth.users
- [ ] Admin profile exists in users table
- [ ] Email is confirmed
- [ ] Role is set to 'admin'
- [ ] Can login with credentials
- [ ] Redirects to admin dashboard
- [ ] Can view orders
- [ ] Can view errands
- [ ] Can perform actions (accept/reject/complete)
- [ ] Can logout successfully

---

## Quick Setup Script

For quick setup, run these SQL commands in order:

```sql
-- 1. Check if admin user exists in users table
SELECT id, email, role FROM users WHERE email = 'admin@errandrunners.gy';

-- 2. If exists, update role to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@errandrunners.gy';

-- 3. Verify the update
SELECT id, email, name, role FROM users WHERE email = 'admin@errandrunners.gy';

-- 4. Create Emanuel Macey if needed
INSERT INTO users (email, name, phone, role)
VALUES (
  'emanuel.macey@errandrunners.gy',
  'Emanuel Macey',
  '592-000-0000',
  'driver'
)
ON CONFLICT (email) DO NOTHING;
```

**Remember**: You still need to create the auth user in Supabase Dashboard first!

---

## Support

If you encounter issues during setup:

1. Check Supabase logs for errors
2. Review this guide carefully
3. Check TROUBLESHOOTING_GUIDE.md
4. Verify all steps were completed
5. Contact development team if needed

---

**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Prerequisites**: Supabase project access
