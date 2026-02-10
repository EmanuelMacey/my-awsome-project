
# Quick Guide: Make ciarahazel3@gmail.com an Admin

## 🚀 Fast Track (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Select project: `sytixskkgfvjjjemmoav`
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

### Step 2: Copy & Run This SQL

```sql
-- Update ciarahazel3@gmail.com to admin role
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'ciarahazel3@gmail.com';

  IF user_id_var IS NOT NULL THEN
    UPDATE users
    SET 
      role = 'admin',
      is_approved = true,
      updated_at = NOW()
    WHERE id = user_id_var;

    INSERT INTO admin_permissions (user_id, is_owner, can_manage_admins, can_manage_drivers)
    VALUES (user_id_var, false, true, true)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      can_manage_admins = true,
      can_manage_drivers = true;

    RAISE NOTICE 'User updated to admin successfully';
  ELSE
    RAISE NOTICE 'User not found - they need to register first';
  END IF;
END $$;
```

### Step 3: Verify
Run this to confirm:
```sql
SELECT email, role, is_approved
FROM users
WHERE email = 'ciarahazel3@gmail.com';
```

### Step 4: Send Password Reset
1. Login to admin dashboard
2. Go to User Management
3. Search for "ciarahazel3@gmail.com"
4. Click "Reset Password" button
5. User will receive email to set their password

## ✅ Done!

The user can now:
- Login with their email and new password
- Access the admin dashboard
- Manage users and drivers

---

## ⚠️ If User Doesn't Exist

If the SQL says "User not found", the user needs to register first:

1. User goes to the app
2. Clicks "Register"
3. Fills in:
   - Name: Ciara Hazel
   - Email: ciarahazel3@gmail.com
   - Phone: +592...
   - Password: Ciara10@
   - Role: Customer (will be changed to admin)
4. After registration, run the SQL script again

---

## 📧 Password Reset Not Working?

### Check Email Configuration:
1. Go to Supabase Dashboard
2. Navigate to: Authentication > Email Templates
3. Verify SMTP is configured
4. Check spam folder for reset email

### Manual Password Reset:
If emails aren't working, you can set a temporary password:

```sql
-- Set temporary password (use Supabase Dashboard > Authentication > Users)
-- Or send reset link manually from Supabase Dashboard
```

---

## 🎯 Quick Test

1. Run SQL script ✅
2. User receives reset email ✅
3. User clicks link in email ✅
4. User sets new password ✅
5. User logs in as admin ✅

---

**Need Help?**
- Email: errandrunners592@gmail.com
- Phone: 592-721-9769
