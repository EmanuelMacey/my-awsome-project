
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('customer', 'driver', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store items table
CREATE TABLE store_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_transit', 'delivered', 'cancelled')),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX idx_store_items_store_id ON store_items(store_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES - USERS
-- =====================================================

-- Users can read their own row
CREATE POLICY "Users can read own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own row
CREATE POLICY "Users can insert own data"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own row
CREATE POLICY "Users can update own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- 5. RLS POLICIES - STORES
-- =====================================================

-- Anyone can read stores
CREATE POLICY "Anyone can read stores"
    ON stores FOR SELECT
    USING (true);

-- Only admins can insert stores
CREATE POLICY "Admins can insert stores"
    ON stores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Only admins can update stores
CREATE POLICY "Admins can update stores"
    ON stores FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Only admins can delete stores
CREATE POLICY "Admins can delete stores"
    ON stores FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- =====================================================
-- 6. RLS POLICIES - STORE_ITEMS
-- =====================================================

-- Anyone can read store items
CREATE POLICY "Anyone can read store items"
    ON store_items FOR SELECT
    USING (true);

-- Only admins can insert store items
CREATE POLICY "Admins can insert store items"
    ON store_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Only admins can update store items
CREATE POLICY "Admins can update store items"
    ON store_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Only admins can delete store items
CREATE POLICY "Admins can delete store items"
    ON store_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- =====================================================
-- 7. RLS POLICIES - ORDERS
-- =====================================================

-- Users can read orders if they are customer, driver, or admin
CREATE POLICY "Users can read relevant orders"
    ON orders FOR SELECT
    USING (
        customer_id = auth.uid() OR
        driver_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Only customers can create orders
CREATE POLICY "Customers can create orders"
    ON orders FOR INSERT
    WITH CHECK (customer_id = auth.uid());

-- Orders can be updated by driver, admin, or driver accepting pending order
CREATE POLICY "Drivers and admins can update orders"
    ON orders FOR UPDATE
    USING (
        driver_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        ) OR
        (driver_id IS NULL AND status = 'pending' AND EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'driver'
        ))
    );

-- =====================================================
-- 8. RLS POLICIES - ORDER_ITEMS
-- =====================================================

-- Users can read order items if they belong to the order
CREATE POLICY "Users can read order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (
                orders.customer_id = auth.uid() OR
                orders.driver_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid() AND users.role = 'admin'
                )
            )
        )
    );

-- Only customers can insert order items for their orders
CREATE POLICY "Customers can insert order items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND orders.customer_id = auth.uid()
        )
    );

-- =====================================================
-- 9. RLS POLICIES - MESSAGES
-- =====================================================

-- Users can read messages if they are customer or driver on the order
CREATE POLICY "Users can read messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = messages.order_id
            AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
        )
    );

-- Users can insert messages if sender_id matches and they are on the order
CREATE POLICY "Users can insert messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = messages.order_id
            AND (orders.customer_id = auth.uid() OR orders.driver_id = auth.uid())
        )
    );

-- =====================================================
-- 10. REALTIME TRIGGERS
-- =====================================================

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
