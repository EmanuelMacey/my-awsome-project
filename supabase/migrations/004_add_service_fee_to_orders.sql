
-- Add service_fee column to orders table
-- This migration adds the service_fee field to track the GYD$200 service charge

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10, 2) DEFAULT 200 NOT NULL;

-- Update existing orders to have the service fee
UPDATE orders 
SET service_fee = 200 
WHERE service_fee IS NULL OR service_fee = 0;

-- Add comment to document the column
COMMENT ON COLUMN orders.service_fee IS 'Service fee charged per order (default GYD$200)';

-- Create or replace function to ensure order numbers start from 1
-- This function generates sequential order numbers: ORD-000001, ORD-000002, etc.
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next order number by counting existing orders + 1
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_number ~ '^ORD-[0-9]+$';
  
  -- Generate order number with leading zeros (e.g., ORD-000001)
  NEW.order_number := 'ORD-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_order_number ON orders;

-- Create trigger to auto-generate order numbers
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Create or replace function to ensure errand numbers start from 1
CREATE OR REPLACE FUNCTION generate_errand_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next errand number by counting existing errands + 1
  SELECT COALESCE(MAX(CAST(SUBSTRING(errand_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM errands
  WHERE errand_number ~ '^ER-[0-9]+$';
  
  -- Generate errand number with leading zeros (e.g., ER-000001)
  NEW.errand_number := 'ER-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_errand_number ON errands;

-- Create trigger to auto-generate errand numbers
CREATE TRIGGER set_errand_number
  BEFORE INSERT ON errands
  FOR EACH ROW
  WHEN (NEW.errand_number IS NULL)
  EXECUTE FUNCTION generate_errand_number();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Service fee column added to orders table';
  RAISE NOTICE '✅ Order number generation fixed to start from 1';
  RAISE NOTICE '✅ Errand number generation fixed to start from 1';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run this migration in your Supabase SQL Editor';
  RAISE NOTICE '2. Existing orders will have service_fee = 200';
  RAISE NOTICE '3. New orders will auto-generate numbers starting from ORD-000001';
END $$;
