
# 🔐 Supabase Authentication & Profile Setup Guide

## ✅ What's Been Fixed

### 1. Android Orientation Support
- **Removed**: Portrait-only restriction (`android:screenOrientation="PORTRAIT"`)
- **Added**: `"screenOrientation": "unspecified"` in `app.json`
- **Result**: App now supports all orientations on tablets, foldables, and large screen devices

### 2. Account Creation Flow
The app now uses proper Supabase authentication with automatic profile creation.

---

## 📋 Required Supabase Database Setup

### Step 1: Create Profiles Table

Run this in **Supabase → SQL Editor**:

```sql
-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
```

### Step 2: Create Orders Table with Payment Options

```sql
-- Create orders table with payment methods
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  payment_method text check (
    payment_method in ('cash','mmg','visa','mastercard')
  ),
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.orders enable row level security;

-- Create policies for orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
```

### Step 3: Auto-Create Profile on Signup

```sql
-- Create function to auto-create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone, '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to run on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 🔧 How Authentication Works in the App

### Sign Up Flow

1. **User fills registration form** with:
   - Full name
   - Email
   - Phone (with country code, e.g., +5927219769)
   - Password (min 6 characters)
   - Role (customer or driver)

2. **App calls Supabase Auth**:
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         name,
         full_name: name,
         phone,
         role,
         is_approved: isApproved,
       },
       emailRedirectTo: 'maceyrunners://email-confirmed',
     }
   });
   ```

3. **Supabase creates auth user** in `auth.users` table

4. **Trigger automatically creates profile** in `public.profiles` table

5. **User receives verification email** (if email confirmation is enabled)

6. **User clicks verification link** and can login

### Login Flow

1. **User enters email and password**

2. **App calls Supabase Auth**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   ```

3. **App fetches user profile** from `users` table

4. **App redirects based on role**:
   - Customer → `/customer/home`
   - Driver → `/driver/dashboard`
   - Admin → `/admin/dashboard`

### Password Reset Flow

1. **User clicks "Forgot Password"** on login screen

2. **User enters email address**

3. **App sends reset email**:
   ```typescript
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: 'maceyrunners://auth/reset-password'
   });
   ```

4. **User receives email** with magic link

5. **User clicks link** → Opens app at reset password screen

6. **User enters new password**:
   ```typescript
   const { error } = await supabase.auth.updateUser({
     password: newPassword
   });
   ```

7. **User can login** with new password

---

## 💳 Payment Methods

The app supports 4 payment methods:

1. **cash** - Cash on Delivery
2. **mmg** - Mobile Money Guyana
3. **visa** - Visa Card
4. **mastercard** - Mastercard

### How to Place an Order with Payment Method

```typescript
const placeOrder = async (amount: number, method: 'cash' | 'mmg' | 'visa' | 'mastercard') => {
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    alert('Please login to place an order');
    return;
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      amount,
      payment_method: method,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Order error:', error);
    alert('Failed to place order: ' + error.message);
  } else {
    console.log('Order placed successfully:', data);
    alert('Order placed successfully!');
  }
};
```

---

## 🧪 Testing the Setup

### Test Sign Up

1. Open the app
2. Tap "Register"
3. Fill in all fields:
   - Name: Test User
   - Email: test@example.com
   - Phone: +5927219769
   - Password: test123
   - Confirm Password: test123
   - Role: Customer
4. Tap "Register"
5. Check email for verification link (if enabled)
6. Verify email and login

### Test Login

1. Open the app
2. Tap "Login"
3. Enter email and password
4. Tap "Login"
5. Should redirect to customer home screen

### Test Password Reset

1. Open the app
2. Tap "Login"
3. Tap "Forgot Password?"
4. Enter email address
5. Tap "Send Reset Link"
6. Check email for reset link
7. Click link in email
8. App opens to reset password screen
9. Enter new password
10. Tap "Reset Password"
11. Login with new password

### Test Order Placement

1. Login as customer
2. Browse stores and add items to cart
3. Go to cart
4. Select payment method (cash, mmg, visa, or mastercard)
5. Place order
6. Check Supabase dashboard → Orders table
7. Should see new order with selected payment method

---

## 🔍 Troubleshooting

### Issue: "User profile not found"

**Solution**: Check if the trigger is working:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If not, recreate it
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Issue: "Email already registered"

**Solution**: User already has an account. Use "Forgot Password" to reset password.

### Issue: "Invalid phone number"

**Solution**: Phone must include country code (e.g., +5927219769)

### Issue: "Password reset link not working"

**Solution**: 
1. Check that deep linking is configured: `scheme: "maceyrunners"` in app.json
2. Check that redirect URL matches: `maceyrunners://auth/reset-password`
3. Test the link in the app, not in a browser

### Issue: "Payment method constraint error"

**Solution**: Ensure payment method is one of: 'cash', 'mmg', 'visa', 'mastercard'

---

## 📱 App Configuration

### Deep Linking Setup

The app uses the scheme `maceyrunners://` for deep linking.

**Configured in app.json**:
```json
{
  "scheme": "maceyrunners",
  "extra": {
    "supabaseUrl": "https://sytixskkgfvjjjemmoav.supabase.co",
    "supabaseAnonKey": "your-anon-key"
  }
}
```

**Deep link URLs**:
- Email confirmation: `maceyrunners://email-confirmed`
- Password reset: `maceyrunners://auth/reset-password`
- OAuth callback: `maceyrunners://auth/callback`

---

## 🎯 Next Steps

1. ✅ Run the SQL scripts in Supabase SQL Editor
2. ✅ Test sign up flow
3. ✅ Test login flow
4. ✅ Test password reset flow
5. ✅ Test order placement with different payment methods
6. ✅ Build and test on Android device/emulator
7. ✅ Verify app works in landscape mode on tablets

---

## 📞 Support

If you encounter any issues:

- **Email**: errandrunners592@gmail.com
- **Phone**: 592-721-9769

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All SQL scripts run successfully in Supabase
- [ ] Email confirmation is enabled in Supabase Auth settings
- [ ] Password reset emails are working
- [ ] Deep linking is tested on physical devices
- [ ] App works in both portrait and landscape modes
- [ ] All payment methods are tested
- [ ] RLS policies are enabled and tested
- [ ] Error messages are user-friendly
- [ ] Support contact information is correct

---

**Last Updated**: January 2025
**App Version**: 1.0.9
