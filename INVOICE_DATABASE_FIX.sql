
-- Fix for errand_invoices table schema
-- This adds the missing customer_id column or renames user_id to customer_id

-- Check if the table exists and what columns it has
-- Run this first to see the current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'errand_invoices';

-- Option 1: If the table has 'user_id' but needs 'customer_id', add customer_id as an alias
-- This approach keeps both columns for backward compatibility
DO $$
BEGIN
  -- Check if customer_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'errand_invoices' AND column_name = 'customer_id'
  ) THEN
    -- Check if user_id exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'errand_invoices' AND column_name = 'user_id'
    ) THEN
      -- Add customer_id column and copy data from user_id
      ALTER TABLE errand_invoices ADD COLUMN customer_id TEXT;
      UPDATE errand_invoices SET customer_id = user_id;
      
      -- Make it NOT NULL after copying data
      ALTER TABLE errand_invoices ALTER COLUMN customer_id SET NOT NULL;
      
      -- Add index for performance
      CREATE INDEX IF NOT EXISTS idx_errand_invoices_customer_id ON errand_invoices(customer_id);
      
      RAISE NOTICE 'Added customer_id column to errand_invoices table';
    ELSE
      -- Neither column exists, create customer_id
      ALTER TABLE errand_invoices ADD COLUMN customer_id TEXT NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_errand_invoices_customer_id ON errand_invoices(customer_id);
      
      RAISE NOTICE 'Created customer_id column in errand_invoices table';
    END IF;
  ELSE
    RAISE NOTICE 'customer_id column already exists in errand_invoices table';
  END IF;
END $$;

-- Option 2: If you want to completely replace user_id with customer_id (more breaking)
-- Uncomment this section if you prefer this approach:
/*
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'errand_invoices' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'errand_invoices' AND column_name = 'customer_id'
  ) THEN
    -- Rename user_id to customer_id
    ALTER TABLE errand_invoices RENAME COLUMN user_id TO customer_id;
    
    -- Update index name if it exists
    DROP INDEX IF EXISTS idx_errand_invoices_user_id;
    CREATE INDEX IF NOT EXISTS idx_errand_invoices_customer_id ON errand_invoices(customer_id);
    
    RAISE NOTICE 'Renamed user_id to customer_id in errand_invoices table';
  END IF;
END $$;
*/

-- Verify the change
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'errand_invoices' 
  AND column_name IN ('customer_id', 'user_id')
ORDER BY column_name;
