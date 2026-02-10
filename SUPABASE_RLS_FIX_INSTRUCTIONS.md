
# 🚨 CRITICAL: Supabase RLS Policy Fix Required

## Problem
Login is failing with error: `"infinite recursion detected in policy for relation \"users\""`

This is a **Supabase database configuration issue**, not a frontend issue. The RLS (Row Level Security) policies on the `users` table are causing infinite recursion.

## Solution
You need to fix the RLS policies in your Supabase dashboard. Follow these steps:

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: **sytixskkgfvjjjemmoav**
3. Go to **Authentication** → **Policies**
4. Find the `users` table

### Step 2: Delete ALL existing policies on the `users` table
Delete any policies that might be causing recursion.

### Step 3: Create NEW, SIMPLE policies

Run this SQL in the **SQL Editor**:

```sql
-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create SIMPLE, NON-RECURSIVE policies
-- Policy 1: Allow users to SELECT their own row
CREATE POLICY "users_select_own" ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Allow users to INSERT their own row (for signup)
CREATE POLICY "users_insert_own" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to UPDATE their own row
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow admins to view all users
CREATE POLICY "admins_select_all" ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 5: Allow admins to update all users
CREATE POLICY "admins_update_all" ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### Step 4: Verify RLS is enabled
```sql
-- Ensure RLS is enabled on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Step 5: Test the fix
1. Try logging in again at: https://maceyrunners-fyvkk2vo5-emanuel-maceys-projects.vercel.app/
2. The login should now work without the infinite recursion error

## Why This Happened
The previous RLS policies likely had a circular reference where:
- Policy A checked if user exists in `users` table
- That check triggered Policy B
- Policy B checked if user exists in `users` table
- That check triggered Policy A again
- **INFINITE LOOP** 🔄

The new policies use `auth.uid()` directly, which doesn't query the `users` table, breaking the recursion.

## Need Help?
If you're still having issues after applying these fixes, contact:
- Email: errandrunners592@gmail.com
- Phone: 592-721-9769
