
# 🔧 Supabase Database Setup Guide

This guide will help you set up the required database tables and triggers for the MaceyRunners app authentication and order system.

## 📋 Prerequisites

- Access to your Supabase project dashboard
- Navigate to: **SQL Editor** in your Supabase dashboard

---

## 🗄️ Step 1: Create Profiles Table

The `profiles` table stores additional user information linked to Supabase Auth users.

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

-- Create policies for profiles table
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

---

## 💳 Step 2: Create Orders Table with Payment Methods

The `orders` table stores order information with support for multiple payment methods.

```sql
-- Create orders table with payment options
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount numeric,
  payment_method text check (
    payment_method in ('cash','mmg','visa','mastercard')
  ),
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.orders enable row level security;

-- Create policies for orders table
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
```

---

## 🔄 Step 3: Create Auto-Profile Trigger

This trigger automatically creates a profile entry when a new user signs up.

```sql
-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## ✅ Step 4: Verify Setup

Run this query to verify your tables were created successfully:

```sql
-- Check if tables exist
select table_name 
from information_schema.tables 
where table_schema = 'public' 
and table_name in ('profiles', 'orders');

-- Check if trigger exists
select trigger_name 
from information_schema.triggers 
where trigger_name = 'on_auth_user_created';
```

You should see:
- `profiles` table
- `orders` table
- `on_auth_user_created` trigger

---

## 🧪 Step 5: Test the Setup

### Test Profile Creation

1. Sign up a new user in your app
2. Run this query to check if the profile was created:

```sql
select * from public.profiles order by created_at desc limit 5;
```

### Test Order Creation

Use this function in your app to place an order:

```typescript
const placeOrder = async (amount: number, method: 'cash' | 'mmg' | 'visa' | 'mastercard') => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    alert('Please login first');
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
    console.log('Order placed:', data);
    alert('Order placed successfully!');
  }
};
```

---

## 🎯 Payment Method Options

Your app supports these payment methods:

- **cash** - Cash on Delivery (COD)
- **mmg** - Mobile Money Guyana
- **visa** - Visa Card
- **mastercard** - Mastercard

---

## 🔒 Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. Users can only view/edit their own data
3. Admins have special permissions to view all orders
4. The trigger runs with `security definer` to bypass RLS during profile creation

---

## 🐛 Troubleshooting

### Profile Not Created After Signup

If profiles aren't being created automatically:

1. Check if the trigger exists:
```sql
select * from information_schema.triggers where trigger_name = 'on_auth_user_created';
```

2. Manually create a profile for existing users:
```sql
insert into public.profiles (id, full_name, phone)
select 
  id,
  raw_user_meta_data->>'name',
  raw_user_meta_data->>'phone'
from auth.users
where id not in (select id from public.profiles);
```

### Order Creation Fails

If you get a constraint error:

1. Check the payment method is valid:
```sql
-- Valid values: 'cash', 'mmg', 'visa', 'mastercard'
```

2. Ensure user is authenticated:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

---

## 📞 Support

If you encounter any issues:

- **Email**: errandrunners592@gmail.com
- **Phone**: 592-721-9769

---

## 🎉 You're All Set!

Your Supabase database is now configured with:
- ✅ Profiles table for user information
- ✅ Orders table with payment method support
- ✅ Automatic profile creation on signup
- ✅ Row Level Security policies
- ✅ Payment methods: cash, mmg, visa, mastercard

Users can now:
1. Sign up and have profiles created automatically
2. Place orders with their preferred payment method
3. View their order history
4. Update their profile information
