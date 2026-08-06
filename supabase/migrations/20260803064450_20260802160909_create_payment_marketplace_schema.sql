/*
# Payment System & Course Marketplace Schema
*/

CREATE TABLE IF NOT EXISTS payment_settings (
  id integer PRIMARY KEY DEFAULT 1,
  currency text NOT NULL DEFAULT 'USD',
  currency_symbol text NOT NULL DEFAULT '$',
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_enabled boolean NOT NULL DEFAULT false,
  platform_commission_percent numeric(5,2) NOT NULL DEFAULT 20.00,
  instructor_commission_percent numeric(5,2) NOT NULL DEFAULT 80.00,
  fixed_commission_per_sale numeric(12,2) NOT NULL DEFAULT 0,
  min_withdrawal_amount numeric(12,2) NOT NULL DEFAULT 50.00,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_payment_row CHECK (id = 1)
);

ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_settings_select_public" ON payment_settings;
CREATE POLICY "payment_settings_select_public"
  ON payment_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "payment_settings_insert_admin" ON payment_settings;
CREATE POLICY "payment_settings_insert_admin"
  ON payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "payment_settings_update_admin" ON payment_settings;
CREATE POLICY "payment_settings_update_admin"
  ON payment_settings FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  is_test_mode boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gateways_select_public" ON payment_gateways;
CREATE POLICY "gateways_select_public"
  ON payment_gateways FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "gateways_insert_admin" ON payment_gateways;
CREATE POLICY "gateways_insert_admin"
  ON payment_gateways FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "gateways_update_admin" ON payment_gateways;
CREATE POLICY "gateways_update_admin"
  ON payment_gateways FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "gateways_delete_admin" ON payment_gateways;
CREATE POLICY "gateways_delete_admin"
  ON payment_gateways FOR DELETE
  TO authenticated
  USING (public.has_role('admin'));

INSERT INTO payment_gateways (code, name, description, is_enabled, display_order) VALUES
  ('easypaisa', 'EasyPaisa', 'Mobile wallet payment', false, 1),
  ('jazzcash', 'JazzCash', 'Mobile wallet payment', false, 2),
  ('stripe', 'Stripe', 'Credit / debit card', false, 3),
  ('paypal', 'PayPal', 'PayPal account', false, 4),
  ('bank_transfer', 'Bank Transfer', 'Direct bank transfer', false, 5)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(12,2) NOT NULL DEFAULT 0,
  min_order_amount numeric(12,2) NOT NULL DEFAULT 0,
  max_discount_amount numeric(12,2),
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_public" ON coupons;
CREATE POLICY "coupons_select_public"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "coupons_insert_admin" ON coupons;
CREATE POLICY "coupons_insert_admin"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "coupons_update_admin" ON coupons;
CREATE POLICY "coupons_update_admin"
  ON coupons FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "coupons_delete_admin" ON coupons;
CREATE POLICY "coupons_delete_admin"
  ON coupons FOR DELETE
  TO authenticated
  USING (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method text,
  payment_gateway text,
  payment_reference text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  coupon_code text,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_admin" ON orders;
CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_title text NOT NULL,
  course_thumbnail text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  platform_commission numeric(12,2) NOT NULL DEFAULT 0,
  instructor_earnings numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course_id ON order_items(course_id);
CREATE INDEX IF NOT EXISTS idx_order_items_instructor_id ON order_items(instructor_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.has_role('admin')))
  );

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS instructor_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  platform_fee numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_earnings_instructor_id ON instructor_earnings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON instructor_earnings(status);
CREATE INDEX IF NOT EXISTS idx_earnings_course_id ON instructor_earnings(course_id);

ALTER TABLE instructor_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "earnings_select_own" ON instructor_earnings;
CREATE POLICY "earnings_select_own"
  ON instructor_earnings FOR SELECT
  TO authenticated
  USING (auth.uid() = instructor_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "earnings_insert_system" ON instructor_earnings;
CREATE POLICY "earnings_insert_system"
  ON instructor_earnings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instructor_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "earnings_update_admin" ON instructor_earnings;
CREATE POLICY "earnings_update_admin"
  ON instructor_earnings FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  method text NOT NULL CHECK (method IN ('easypaisa', 'jazzcash', 'bank_transfer', 'paypal')),
  method_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  admin_notes text,
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_instructor_id ON withdrawal_requests(instructor_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawals_select_own" ON withdrawal_requests;
CREATE POLICY "withdrawals_select_own"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = instructor_id OR public.has_role('admin'));

DROP POLICY IF EXISTS "withdrawals_insert_own" ON withdrawal_requests;
CREATE POLICY "withdrawals_insert_own"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "withdrawals_update_admin" ON withdrawal_requests;
CREATE POLICY "withdrawals_update_admin"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

INSERT INTO payment_settings (id, currency, currency_symbol, platform_commission_percent, instructor_commission_percent)
VALUES (1, 'USD', '$', 20.00, 80.00)
ON CONFLICT (id) DO NOTHING;