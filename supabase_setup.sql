
-- ErrandRunners Database Setup
-- Run this entire script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  logo TEXT,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store items table
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled')),
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_store_items_store_id ON store_items(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Stores policies (public read)
DROP POLICY IF EXISTS "Anyone can read stores" ON stores;
CREATE POLICY "Anyone can read stores" ON stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
CREATE POLICY "Admins can manage stores" ON stores FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Store items policies (public read)
DROP POLICY IF EXISTS "Anyone can read store items" ON store_items;
CREATE POLICY "Anyone can read store items" ON store_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage store items" ON store_items;
CREATE POLICY "Admins can manage store items" ON store_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Orders policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (
  customer_id = auth.uid() OR driver_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Customers can create orders" ON orders;
CREATE POLICY "Customers can create orders" ON orders FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Drivers and admins can update orders" ON orders;
CREATE POLICY "Drivers and admins can update orders" ON orders FOR UPDATE USING (
  driver_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
  (status = 'pending' AND driver_id IS NULL)
);

-- Order items policies
DROP POLICY IF EXISTS "Users can read order items" ON order_items;
CREATE POLICY "Users can read order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND
    (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  )
);

DROP POLICY IF EXISTS "Customers can create order items" ON order_items;
CREATE POLICY "Customers can create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- Messages policies
DROP POLICY IF EXISTS "Users can read messages for their orders" ON messages;
CREATE POLICY "Users can read messages for their orders" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = messages.order_id AND
    (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages for their orders" ON messages;
CREATE POLICY "Users can send messages for their orders" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM orders WHERE orders.id = messages.order_id AND
    (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
  )
);

-- ============================================
-- REALTIME RLS POLICIES
-- ============================================

-- Enable RLS on realtime.messages table
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Policy for reading order status updates
DROP POLICY IF EXISTS "Users can receive order broadcasts" ON realtime.messages;
CREATE POLICY "Users can receive order broadcasts" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    topic LIKE 'orders:%' AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id::text = SPLIT_PART(topic, ':', 2)
      AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
    )
  );

-- Policy for reading message broadcasts
DROP POLICY IF EXISTS "Users can receive message broadcasts" ON realtime.messages;
CREATE POLICY "Users can receive message broadcasts" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    topic LIKE 'messages:%' AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id::text = SPLIT_PART(topic, ':', 2)
      AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
    )
  );

-- Policy for sending broadcasts (optional, if clients need to send)
DROP POLICY IF EXISTS "Users can send broadcasts" ON realtime.messages;
CREATE POLICY "Users can send broadcasts" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    (topic LIKE 'orders:%' OR topic LIKE 'messages:%') AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id::text = SPLIT_PART(topic, ':', 2)
      AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
    )
  );

-- ============================================
-- REALTIME TRIGGERS
-- ============================================

-- Create trigger function for order updates
CREATE OR REPLACE FUNCTION notify_order_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'orders:' || COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS orders_realtime_trigger ON orders;

-- Create trigger for orders table
CREATE TRIGGER orders_realtime_trigger
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_order_changes();

-- Create trigger function for message updates
CREATE OR REPLACE FUNCTION notify_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'messages:' || NEW.order_id::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS messages_realtime_trigger ON messages;

-- Create trigger for messages table
CREATE TRIGGER messages_realtime_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_message_changes();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample stores
INSERT INTO stores (name, address, description, category) VALUES
('Fresh Market', '123 Main St, Georgetown', 'Fresh groceries and produce delivered to your door', 'Grocery'),
('Quick Eats', '456 Oak Ave, Georgetown', 'Fast food and delicious snacks', 'Restaurant'),
('Tech Store', '789 Tech Blvd, Georgetown', 'Latest electronics and gadgets', 'Electronics'),
('Pharmacy Plus', '321 Health St, Georgetown', 'Medicines and health products', 'Pharmacy'),
('Book Haven', '654 Reading Rd, Georgetown', 'Books, magazines, and stationery', 'Books')
ON CONFLICT DO NOTHING;

-- Note: To add sample items, you'll need to get the store IDs first
-- You can do this by running: SELECT id, name FROM stores;
-- Then replace 'store-id-here' with actual UUIDs

-- Example (replace with actual store IDs):
-- INSERT INTO store_items (store_id, name, price) VALUES
-- ('actual-uuid-here', 'Apples (1kg)', 2.99),
-- ('actual-uuid-here', 'Bread', 3.49),
-- ('actual-uuid-here', 'Milk (1L)', 4.99);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'ErrandRunners database setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable Realtime in your Supabase project settings';
  RAISE NOTICE '2. Create a storage bucket named "images" for logos and item photos';
  RAISE NOTICE '3. Configure your .env file with Supabase credentials';
  RAISE NOTICE '4. Run the app with: npm run dev';
  RAISE NOTICE '5. IMPORTANT: Enable "Private channels only" in Realtime Settings for better security';
END $$;
