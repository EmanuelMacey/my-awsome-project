
-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  banner_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon_usage table to track who used which coupons
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

-- Add staff role support (update users table if needed)
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_permissions JSONB DEFAULT '{"can_manage_orders": true, "can_manage_drivers": false, "can_manage_stores": false, "can_view_analytics": true}'::jsonb;

-- Add coupon_code to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promotions
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

CREATE POLICY "Admins can manage promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for coupons
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE));

CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage"
  ON coupon_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own coupon usage"
  ON coupon_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all coupon usage"
  ON coupon_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_and_apply_coupon(
  p_coupon_code TEXT,
  p_order_total DECIMAL,
  p_user_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_amount DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_calculated_discount DECIMAL;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(p_coupon_code)
  AND is_active = true
  AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);

  -- Check if coupon exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Invalid or expired coupon code';
    RETURN;
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Coupon usage limit reached';
    RETURN;
  END IF;

  -- Check minimum order value
  IF v_coupon.min_order_value IS NOT NULL AND p_order_total < v_coupon.min_order_value THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Order total does not meet minimum requirement of $' || v_coupon.min_order_value;
    RETURN;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_calculated_discount := (p_order_total * v_coupon.discount_value / 100);
  ELSE
    v_calculated_discount := v_coupon.discount_value;
  END IF;

  -- Apply max discount cap if set
  IF v_coupon.max_discount IS NOT NULL AND v_calculated_discount > v_coupon.max_discount THEN
    v_calculated_discount := v_coupon.max_discount;
  END IF;

  -- Ensure discount doesn't exceed order total
  IF v_calculated_discount > p_order_total THEN
    v_calculated_discount := p_order_total;
  END IF;

  RETURN QUERY SELECT true, v_calculated_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
AFTER INSERT ON coupon_usage
FOR EACH ROW
EXECUTE FUNCTION increment_coupon_usage();

-- Add updated_at trigger for promotions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
