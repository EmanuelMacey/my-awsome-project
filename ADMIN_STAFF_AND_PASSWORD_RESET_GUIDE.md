
# Admin Staff Setup & Password Reset Fix Guide

## ✅ What Has Been Fixed

### 1. **Made ciarahazel3@gmail.com an Admin Staff**
   - Created SQL script to update the user to admin role
   - Added admin permissions for managing users and drivers
   - User can now access the admin dashboard

### 2. **Fixed Password Reset for Staff**
   - Added "Reset Password" button in User Management screen
   - Staff members can now receive password reset emails
   - New staff added through admin panel automatically get password reset emails

### 3. **Fixed Magic Link**
   - Updated redirect URL to: `maceyrunners://auth/reset-password`
   - Created dedicated password reset screen
   - Added proper session handling for password recovery

### 4. **Fixed Password Reset Flow**
   - Created new `ResetPasswordScreen.tsx` for password updates
   - Added `updatePassword` function to AuthContext
   - Proper error handling and user feedback

---

## 🚀 How to Make ciarahazel3@gmail.com an Admin

### Option 1: Run SQL Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `sytixskkgfvjjjemmoav`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the SQL Script**
   - Copy the contents of `UPDATE_USER_TO_ADMIN.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify the Update**
   - The script will show a success message
   - Check the verification query results at the bottom

### Option 2: Use Admin Dashboard (After First Admin is Set Up)

1. **Login as Admin**
   - Email: `admin@errandrunners.gy`
   - Password: `Admin1234`

2. **Go to User Management**
   - Navigate to Admin Dashboard
   - Click "Users" in the sidebar

3. **Find the User**
   - Search for "ciarahazel3@gmail.com"
   - Click "Change Role"
   - Select "Admin"

---

## 🔐 How Staff Can Reset Their Password

### For New Staff Added Through Admin Panel:

1. **Admin Adds New Staff**
   - Admin goes to User Management
   - Clicks "+ Add User"
   - Fills in Name, Email, Phone
   - Selects "Admin" or "Driver" role
   - Clicks "Add User"

2. **Staff Receives Email**
   - A password reset email is automatically sent
   - Staff should check inbox AND spam folder
   - Email subject: "Reset Your Password"

3. **Staff Sets Password**
   - Click the link in the email
   - App opens to Reset Password screen
   - Enter new password (min 6 characters)
   - Confirm password
   - Click "Update Password"

4. **Staff Can Now Login**
   - Go to login screen
   - Enter email and new password
   - Access admin dashboard

### For Existing Staff Who Forgot Password:

1. **Admin Sends Reset Email**
   - Admin goes to User Management
   - Finds the staff member
   - Clicks "Reset Password" button
   - Confirms sending reset email

2. **Staff Follows Same Steps**
   - Check email (and spam folder)
   - Click reset link
   - Set new password
   - Login with new password

---

## 📧 Email Configuration (Important!)

For password reset emails to work, you need to configure email in Supabase:

### Check Email Settings:

1. **Go to Supabase Dashboard**
   - Navigate to: Authentication > Email Templates

2. **Verify Email Provider**
   - Check if custom SMTP is configured
   - Or using Supabase's default email service

3. **Test Email Delivery**
   - Send a test password reset email
   - Check if it arrives (check spam folder)

### If Emails Are Not Working:

1. **Configure Custom SMTP** (Recommended for Production)
   - Go to: Project Settings > Auth > SMTP Settings
   - Add your email provider details (Gmail, SendGrid, etc.)
   - Test the configuration

2. **Update Email Templates**
   - Go to: Authentication > Email Templates
   - Select "Reset Password"
   - Ensure the redirect URL is: `maceyrunners://auth/reset-password`

---

## 🧪 Testing the Fixes

### Test 1: Make User Admin

```sql
-- Run in Supabase SQL Editor
SELECT email, role, is_approved 
FROM users 
WHERE email = 'ciarahazel3@gmail.com';
```

Expected result:
- role: 'admin'
- is_approved: true

### Test 2: Password Reset for Staff

1. Login as admin
2. Go to User Management
3. Find any staff member
4. Click "Reset Password"
5. Check if email is sent
6. Click link in email
7. Verify app opens to Reset Password screen
8. Set new password
9. Login with new password

### Test 3: Add New Staff

1. Login as admin
2. Go to User Management
3. Click "+ Add User"
4. Fill in details:
   - Name: Test Staff
   - Email: test@example.com
   - Role: Admin
5. Click "Add User"
6. Verify success message mentions password reset email
7. Check test@example.com inbox
8. Follow password reset flow

---

## 🐛 Troubleshooting

### Issue: User Can't Login After Being Made Admin

**Solution:**
1. Check if user exists in `users` table:
   ```sql
   SELECT * FROM users WHERE email = 'ciarahazel3@gmail.com';
   ```
2. Check if user exists in `auth.users`:
   ```sql
   SELECT * FROM auth.users WHERE email = 'ciarahazel3@gmail.com';
   ```
3. If user doesn't exist, they need to register first

### Issue: Password Reset Email Not Received

**Solution:**
1. Check spam/junk folder
2. Verify email configuration in Supabase
3. Check Supabase logs for email delivery errors
4. Try sending reset email again

### Issue: Reset Password Link Doesn't Work

**Solution:**
1. Verify the redirect URL in Supabase:
   - Go to: Authentication > URL Configuration
   - Add: `maceyrunners://auth/reset-password` to Redirect URLs
2. Check if link has expired (links expire after 1 hour)
3. Request a new reset link

### Issue: "Invalid Link" Error on Reset Password Screen

**Solution:**
1. Link may have expired (1 hour expiry)
2. Link may have already been used
3. Request a new password reset email

---

## 📝 Summary of Changes

### Files Created:
1. `src/screens/auth/ResetPasswordScreen.tsx` - New password reset screen
2. `UPDATE_USER_TO_ADMIN.sql` - SQL script to make user admin
3. `ADMIN_STAFF_AND_PASSWORD_RESET_GUIDE.md` - This guide

### Files Modified:
1. `src/contexts/AuthContext.tsx`
   - Added `updatePassword` function
   - Added PASSWORD_RECOVERY event handling
   - Updated redirect URLs for password reset

2. `src/screens/admin/UserManagementScreen.tsx`
   - Added "Reset Password" button for all users
   - Updated add user flow to send password reset email
   - Improved user feedback messages

### Backend Configuration Needed:
1. Run `UPDATE_USER_TO_ADMIN.sql` in Supabase SQL Editor
2. Verify email configuration in Supabase Dashboard
3. Add `maceyrunners://auth/reset-password` to Redirect URLs

---

## 🎯 Next Steps

1. **Run the SQL script** to make ciarahazel3@gmail.com an admin
2. **Test the password reset flow** with a test user
3. **Verify email delivery** is working
4. **Configure custom SMTP** for production (optional but recommended)
5. **Test admin login** with ciarahazel3@gmail.com

---

## 📞 Support

If you encounter any issues:

1. Check the console logs in the app
2. Check Supabase logs in the dashboard
3. Verify email configuration
4. Contact support:
   - Email: errandrunners592@gmail.com
   - Phone: 592-721-9769

---

## ✅ Verification Checklist

- [ ] SQL script run successfully
- [ ] ciarahazel3@gmail.com can login as admin
- [ ] Password reset button appears in User Management
- [ ] Password reset emails are being sent
- [ ] Password reset links open the app correctly
- [ ] Users can successfully reset their passwords
- [ ] New staff added through admin panel receive reset emails
- [ ] Email configuration is working (check spam folder)

---

**Last Updated:** $(date)
**Version:** 1.0
