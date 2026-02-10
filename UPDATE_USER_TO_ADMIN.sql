
-- Update ciarahazel3@gmail.com to admin role
-- Run this in your Supabase SQL Editor

-- First, find the user by email
DO $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = 'ciarahazel3@gmail.com';

  -- If user exists, update their role
  IF user_id_var IS NOT NULL THEN
    -- Update the users table
    UPDATE users
    SET 
      role = 'admin',
      is_approved = true,
      updated_at = NOW()
    WHERE id = user_id_var;

    -- Create admin permissions if they don't exist
    INSERT INTO admin_permissions (user_id, is_owner, can_manage_admins, can_manage_drivers)
    VALUES (user_id_var, false, true, true)
    ON CONFLICT (user_id) 
    DO UPDATE SET
      can_manage_admins = true,
      can_manage_drivers = true;

    RAISE NOTICE 'User ciarahazel3@gmail.com has been updated to admin role';
  ELSE
    RAISE NOTICE 'User ciarahazel3@gmail.com not found in auth.users';
  END IF;
END $$;

-- Verify the update
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.is_approved,
  ap.can_manage_admins,
  ap.can_manage_drivers
FROM users u
LEFT JOIN admin_permissions ap ON u.id = ap.user_id
WHERE u.email = 'ciarahazel3@gmail.com';
