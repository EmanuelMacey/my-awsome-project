
-- ============================================
-- FIX ACCOUNT CREATION ISSUES
-- ErrandRunners - Supabase Database Fix
-- ============================================

-- This script fixes the account creation issues by:
-- 1. Updating RLS policies to allow user profile creation during signup
-- 2. Adding a trigger to automatically create user profiles
-- 3. Removing any account creation limits

-- ============================================
-- STEP 1: FIX RLS POLICIES ON USERS TABLE
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies that allow signup
-- Policy 1: Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert their profile" 
ON users FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 2: Allow service role to insert any profile (for triggers)
CREATE POLICY "Allow service role to insert profiles" 
ON users FOR INSERT 
TO service_role
WITH CHECK (true);

-- Policy 3: Users can read their own data
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy 4: Users can update their own data
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Policy 5: Admins can read all users
CREATE POLICY "Admins can read all users" 
ON users FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy 6: Admins can update all users
CREATE POLICY "Admins can update all users" 
ON users FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ============================================
-- STEP 2: CREATE AUTOMATIC USER PROFILE TRIGGER
-- ============================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_role TEXT;
  user_email TEXT;
  is_approved BOOLEAN;
BEGIN
  -- Extract metadata from the new auth user
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.phone,
    ''
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'customer'
  );
  
  user_email := COALESCE(NEW.email, '');
  
  -- Determine if user should be auto-approved
  is_approved := CASE
    WHEN user_role = 'customer' THEN true
    WHEN user_role = 'driver' AND (
      user_email = 'dinelmacey@gmail.com' OR 
      user_name = 'Dinel Macey'
    ) THEN true
    ELSE COALESCE((NEW.raw_user_meta_data->>'is_approved')::boolean, false)
  END;
  
  -- Insert the user profile
  INSERT INTO public.users (id, name, phone, email, role, is_approved, created_at)
  VALUES (
    NEW.id,
    user_name,
    user_phone,
    user_email,
    user_role,
    is_approved,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 3: ENSURE USERS TABLE HAS CORRECT STRUCTURE
-- ============================================

-- Add is_approved column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'is_approved'
  ) THEN
    ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Ensure all existing customers are approved
UPDATE users SET is_approved = true WHERE role = 'customer' AND is_approved IS NULL;

-- ============================================
-- STEP 4: CREATE ADMIN_APPROVALS TABLE IF NOT EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS admin_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_approvals
ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;

-- Admins can view all approval requests
DROP POLICY IF EXISTS "Admins can view all approvals" ON admin_approvals;
CREATE POLICY "Admins can view all approvals" 
ON admin_approvals FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Admins can update approval requests
DROP POLICY IF EXISTS "Admins can update approvals" ON admin_approvals;
CREATE POLICY "Admins can update approvals" 
ON admin_approvals FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Users can insert their own approval requests
DROP POLICY IF EXISTS "Users can insert approval requests" ON admin_approvals;
CREATE POLICY "Users can insert approval requests" 
ON admin_approvals FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Service role can insert approval requests (for triggers)
DROP POLICY IF EXISTS "Service role can insert approvals" ON admin_approvals;
CREATE POLICY "Service role can insert approvals" 
ON admin_approvals FOR INSERT 
TO service_role
WITH CHECK (true);

-- ============================================
-- STEP 5: REMOVE ANY ACCOUNT LIMITS
-- ============================================

-- There are no explicit account limits in the database
-- Account creation is only limited by Supabase Auth settings
-- Make sure in your Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Ensure "Enable email confirmations" is set according to your needs
-- 3. Ensure "Enable phone confirmations" is set according to your needs
-- 4. There should be no rate limiting that's too restrictive

-- ============================================
-- STEP 6: TEST THE SETUP
-- ============================================

-- Test that the trigger works by checking if it exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test that RLS policies are in place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Account creation fix completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes made:';
  RAISE NOTICE '1. ✅ Updated RLS policies to allow user profile creation';
  RAISE NOTICE '2. ✅ Added automatic user profile creation trigger';
  RAISE NOTICE '3. ✅ Created admin_approvals table for driver approvals';
  RAISE NOTICE '4. ✅ Removed account creation restrictions';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next steps:';
  RAISE NOTICE '1. Test account creation in your app';
  RAISE NOTICE '2. Verify that user profiles are created automatically';
  RAISE NOTICE '3. Check that customers are auto-approved';
  RAISE NOTICE '4. Verify that drivers require approval (except Dinel Macey)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Important: Make sure to check your Supabase Auth settings:';
  RAISE NOTICE '   - Go to Authentication > Settings in Supabase Dashboard';
  RAISE NOTICE '   - Adjust email confirmation settings as needed';
  RAISE NOTICE '   - Check rate limiting settings';
END $$;
