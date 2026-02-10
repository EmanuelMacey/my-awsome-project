
-- ============================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- MaceyRunners App - Complete Setup
-- ============================================

-- This file contains all the RLS policies needed for the app
-- Run this in Supabase SQL Editor after creating the tables

-- ============================================
-- 1. PROFILES TABLE POLICIES
-- ============================================

-- Enable RLS on profiles table
alter table public.profiles enable row level security;

-- Users can view their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- 2. ORDERS TABLE POLICIES
-- ============================================

-- Enable RLS on orders table
alter table public.orders enable row level security;

-- Users can view their own orders
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Users can create their own orders
create policy "Users can create their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Users can update their own orders
create policy "Users can update their own orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- ============================================
-- 3. USERS TABLE POLICIES (if you have one)
-- ============================================

-- If you have a users table separate from profiles:
-- alter table public.users enable row level security;

-- create policy "Users can view their own user record"
--   on public.users for select
--   using (auth.uid() = id);

-- create policy "Users can update their own user record"
--   on public.users for update
--   using (auth.uid() = id);

-- ============================================
-- 4. ADMIN POLICIES (Optional)
-- ============================================

-- If you want admins to see all data, add these policies:

-- Admins can view all profiles
-- create policy "Admins can view all profiles"
--   on public.profiles for select
--   using (
--     exists (
--       select 1 from public.users
--       where users.id = auth.uid()
--       and users.role = 'admin'
--     )
--   );

-- Admins can view all orders
-- create policy "Admins can view all orders"
--   on public.orders for select
--   using (
--     exists (
--       select 1 from public.users
--       where users.id = auth.uid()
--       and users.role = 'admin'
--     )
--   );

-- ============================================
-- 5. DRIVER POLICIES (Optional)
-- ============================================

-- Drivers can view orders assigned to them
-- create policy "Drivers can view assigned orders"
--   on public.orders for select
--   using (
--     exists (
--       select 1 from public.users
--       where users.id = auth.uid()
--       and users.role = 'driver'
--       and orders.driver_id = auth.uid()
--     )
--   );

-- Drivers can update orders assigned to them
-- create policy "Drivers can update assigned orders"
--   on public.orders for update
--   using (
--     exists (
--       select 1 from public.users
--       where users.id = auth.uid()
--       and users.role = 'driver'
--       and orders.driver_id = auth.uid()
--     )
--   );

-- ============================================
-- 6. VERIFY POLICIES ARE WORKING
-- ============================================

-- Check all policies on profiles table
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'profiles';

-- Check all policies on orders table
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'orders';

-- ============================================
-- 7. TROUBLESHOOTING
-- ============================================

-- If policies are not working, check:

-- 1. Is RLS enabled?
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
and tablename in ('profiles', 'orders');

-- 2. Are there any policies?
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
and tablename in ('profiles', 'orders')
group by tablename;

-- 3. Test if you can query the tables
-- (Run this while logged in as a user)
-- select * from profiles where id = auth.uid();
-- select * from orders where user_id = auth.uid();

-- ============================================
-- 8. RESET POLICIES (if needed)
-- ============================================

-- Drop all policies on profiles
-- drop policy if exists "Users can view their own profile" on public.profiles;
-- drop policy if exists "Users can update their own profile" on public.profiles;
-- drop policy if exists "Users can insert their own profile" on public.profiles;

-- Drop all policies on orders
-- drop policy if exists "Users can view their own orders" on public.orders;
-- drop policy if exists "Users can create their own orders" on public.orders;
-- drop policy if exists "Users can update their own orders" on public.orders;

-- Then re-run the policies above

-- ============================================
-- NOTES:
-- ============================================

-- 1. RLS policies are enforced for all users except:
--    - Service role key (bypasses RLS)
--    - Postgres role (bypasses RLS)

-- 2. The anon key (used in the app) respects RLS policies

-- 3. auth.uid() returns the currently authenticated user's ID

-- 4. Policies are checked in order:
--    - If ANY policy allows the action, it's permitted
--    - If NO policies allow the action, it's denied

-- 5. For SELECT: using() clause determines which rows are visible
--    For INSERT: with check() clause determines which rows can be inserted
--    For UPDATE: using() determines which rows can be updated,
--                with check() determines what values can be set

-- ============================================
-- END OF RLS POLICIES
-- ============================================
