
# Quick Test: Account Creation

## 🚀 Quick Test Steps

### 1. Test Customer Account
```
✅ Open app
✅ Click "Register" or "Create Account"
✅ Fill in:
   - Name: John Doe
   - Email: john.doe@test.com
   - Phone: +5921234567
   - Password: Test123456
   - Role: Customer
✅ Click "Register"
✅ Should see success message
✅ Should redirect to customer home screen
```

### 2. Test Driver Account
```
✅ Open app
✅ Click "Register" or "Create Account"
✅ Fill in:
   - Name: Jane Driver
   - Email: jane.driver@test.com
   - Phone: +5927654321
   - Password: Test123456
   - Role: Driver
✅ Click "Register"
✅ Should see "pending approval" message
✅ Should NOT redirect (awaiting approval)
```

### 3. Test Duplicate Email
```
✅ Try to register with john.doe@test.com again
✅ Should see error: "This email is already registered"
✅ Should suggest using "Forgot Password"
```

## 📊 What to Check in Supabase Dashboard

### Check User Was Created
1. Go to Authentication > Users
2. Look for the new user email
3. Should see user with correct email

### Check Profile Was Created
1. Go to Table Editor > users
2. Look for the user by email
3. Should see:
   - ✅ Name filled in
   - ✅ Phone filled in
   - ✅ Email filled in
   - ✅ Role set correctly
   - ✅ is_approved = true (for customers)
   - ✅ is_approved = false (for drivers, except Dinel Macey)

## 🐛 Common Issues & Fixes

### "Failed to create user profile"
- **Check:** Trigger exists
- **Fix:** Run SUPABASE_FIX_ACCOUNT_CREATION.sql

### "Permission denied"
- **Check:** RLS policies
- **Fix:** Run SUPABASE_FIX_ACCOUNT_CREATION.sql

### "Email not confirmed"
- **Check:** Email confirmation setting
- **Fix:** Disable in Authentication > Settings

### No error but can't log in
- **Check:** User exists in auth.users
- **Check:** Profile exists in public.users
- **Fix:** Manually create profile or re-run trigger

## ✅ Success Criteria

Account creation is working correctly when:
- [x] Customer accounts are created instantly
- [x] Driver accounts are created (pending approval)
- [x] User profiles appear in `users` table
- [x] Duplicate emails are rejected
- [x] Users can log in after creating account
- [x] Users are redirected to correct dashboard
- [x] No console errors during signup
- [x] No database errors in Supabase logs

## 📞 Need Help?

If account creation still doesn't work:
1. Check frontend logs (console)
2. Check Supabase logs (Dashboard > Logs)
3. Verify SQL script was run successfully
4. Contact: errandrunners592@gmail.com
