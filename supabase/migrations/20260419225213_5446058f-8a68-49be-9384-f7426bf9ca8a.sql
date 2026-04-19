
-- Helper alias: many original migrations call is_admin(); map to is_admin_or_manager
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_or_manager(_user_id)
$$;

-- ============ newsletter_subscribers ============
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view newsletter subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Admins can update newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can update newsletter subscribers" ON public.newsletter_subscribers FOR UPDATE TO authenticated USING (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can delete newsletter subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (is_admin_or_manager(auth.uid()));
DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ hero_slides ============
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  cta_text text NOT NULL DEFAULT 'Shop Now',
  cta_link text NOT NULL DEFAULT '/search',
  image_url text,
  bg_class text NOT NULL DEFAULT 'from-secondary/95 via-secondary/80 to-secondary/95',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Hero slides are publicly readable" ON public.hero_slides;
CREATE POLICY "Hero slides are publicly readable" ON public.hero_slides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero slides" ON public.hero_slides FOR ALL USING (is_admin_or_manager(auth.uid()));
DROP TRIGGER IF EXISTS update_hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
INSERT INTO public.hero_slides (title, subtitle, cta_text, cta_link, bg_class, display_order)
SELECT * FROM (VALUES
  ('Eco Print Technologies', 'Top brands, expert repairs, unbeatable prices', 'Shop Now', '/search', 'from-secondary/95 via-secondary/80 to-secondary/95', 1),
  ('Up to 30% Off', 'Refurbished laptops — tested & certified quality', 'View Deals', '/search?q=Sale', 'from-primary/90 via-primary/70 to-primary/90', 2),
  ('Same-Day Repairs', 'Expert technicians, genuine parts, fast turnaround', 'Find Technicians', '/technicians', 'from-accent/90 via-accent/70 to-accent/90', 3),
  ('Free Delivery', 'On orders above UGX 500,000 within Kampala', 'Start Shopping', '/search', 'from-secondary/95 via-secondary/80 to-secondary/95', 4)
) AS v(title, subtitle, cta_text, cta_link, bg_class, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.hero_slides);

-- ============ wishlist ============
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(device_id, product_id),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view own wishlist" ON public.wishlist;
CREATE POLICY "Anyone can view own wishlist" ON public.wishlist FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can add to wishlist" ON public.wishlist;
CREATE POLICY "Anyone can add to wishlist" ON public.wishlist FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can remove from wishlist" ON public.wishlist;
CREATE POLICY "Anyone can remove from wishlist" ON public.wishlist FOR DELETE USING (true);

-- ============ notifications + notification_reads ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  link text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active notifications" ON public.notifications;
CREATE POLICY "Anyone can read active notifications" ON public.notifications FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.devices(id) ON DELETE CASCADE,
  user_id uuid,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, device_id)
);
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view own reads" ON public.notification_reads;
CREATE POLICY "Anyone can view own reads" ON public.notification_reads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can mark as read" ON public.notification_reads;
CREATE POLICY "Anyone can mark as read" ON public.notification_reads FOR INSERT WITH CHECK (true);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ store_settings ============
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store settings are publicly readable" ON public.store_settings;
CREATE POLICY "Store settings are publicly readable" ON public.store_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;
CREATE POLICY "Admins can manage store settings" ON public.store_settings FOR ALL USING (is_admin_or_manager(auth.uid()));
INSERT INTO public.store_settings (key, value) VALUES
  ('store_location', '{"lat": 0.3136, "lng": 32.5811, "label": "Eco Print Technologies - Suncity Mall, Kampala"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ product_specifications + product_variants ============
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_key text NOT NULL,
  spec_value text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Specs are publicly readable" ON public.product_specifications;
CREATE POLICY "Specs are publicly readable" ON public.product_specifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage specs" ON public.product_specifications;
CREATE POLICY "Admins can manage specs" ON public.product_specifications FOR ALL USING (is_admin_or_manager(auth.uid()));
CREATE INDEX IF NOT EXISTS idx_product_specs_product_id ON public.product_specifications(product_id);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  sku text,
  price numeric NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 0,
  attributes jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Variants are publicly readable" ON public.product_variants;
CREATE POLICY "Variants are publicly readable" ON public.product_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL USING (is_admin_or_manager(auth.uid()));
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- ============ delivery_zones ============
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name text NOT NULL,
  district text NOT NULL,
  subcounty text,
  delivery_fee numeric NOT NULL DEFAULT 0,
  estimated_days text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active delivery zones" ON public.delivery_zones;
CREATE POLICY "Anyone can view active delivery zones" ON public.delivery_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can insert delivery zones" ON public.delivery_zones FOR INSERT WITH CHECK (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Admins can update delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can update delivery zones" ON public.delivery_zones FOR UPDATE USING (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Admins can delete delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can delete delivery zones" ON public.delivery_zones FOR DELETE USING (is_admin_or_manager(auth.uid()));
DROP TRIGGER IF EXISTS update_delivery_zones_updated_at ON public.delivery_zones;
CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ product_reviews ============
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.devices(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified_purchase boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, device_id, order_id)
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.product_reviews;
CREATE POLICY "Reviews viewable by everyone" ON public.product_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.product_reviews;
CREATE POLICY "Anyone can insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.product_reviews;
CREATE POLICY "Admins can manage reviews" ON public.product_reviews FOR ALL USING (is_admin_or_manager(auth.uid()));

-- ============ delivery_accounts ============
CREATE TABLE IF NOT EXISTS public.delivery_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  pin_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage delivery accounts" ON public.delivery_accounts;
CREATE POLICY "Admins can manage delivery accounts" ON public.delivery_accounts FOR ALL USING (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Delivery accounts viewable by everyone" ON public.delivery_accounts;
CREATE POLICY "Delivery accounts viewable by everyone" ON public.delivery_accounts FOR SELECT USING (true);

-- Order delivery location columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_latitude double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_longitude double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text DEFAULT 'online';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;

-- ============ expense_categories + expenses ============
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expense categories viewable by admins" ON public.expense_categories;
CREATE POLICY "Expense categories viewable by admins" ON public.expense_categories FOR SELECT TO authenticated USING (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage expense categories" ON public.expense_categories;
CREATE POLICY "Admins can manage expense categories" ON public.expense_categories FOR ALL TO authenticated USING (is_admin_or_manager(auth.uid()));
INSERT INTO public.expense_categories (name, is_default)
SELECT * FROM (VALUES ('Rent', true), ('Utilities', true), ('Salaries', true), ('Stock Purchases', true),
  ('Transport', true), ('Marketing', true), ('Repairs & Maintenance', true), ('Miscellaneous', true)) v(name, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.expense_categories);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.expense_categories(id),
  amount numeric NOT NULL DEFAULT 0,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'cash',
  reference_number text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expenses viewable by admins" ON public.expenses;
CREATE POLICY "Expenses viewable by admins" ON public.expenses FOR SELECT TO authenticated USING (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL TO authenticated USING (is_admin_or_manager(auth.uid()));

-- ============ brokers + broker_pickups ============
CREATE TABLE IF NOT EXISTS public.brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  id_number text,
  location text,
  commission_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage brokers" ON public.brokers;
CREATE POLICY "Admins can manage brokers" ON public.brokers FOR ALL USING (is_admin_or_manager(auth.uid())) WITH CHECK (is_admin_or_manager(auth.uid()));
DROP TRIGGER IF EXISTS update_brokers_updated_at ON public.brokers;
CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.broker_pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_number text NOT NULL UNIQUE,
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE RESTRICT,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  purpose text NOT NULL DEFAULT 'showing',
  payment_method text DEFAULT 'unpaid',
  amount_paid numeric DEFAULT 0,
  expected_return_date date,
  actual_return_date date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  released_by text,
  released_at timestamptz,
  closed_at timestamptz,
  sale_order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broker_pickups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage broker pickups" ON public.broker_pickups;
CREATE POLICY "Admins can manage broker pickups" ON public.broker_pickups FOR ALL USING (is_admin_or_manager(auth.uid())) WITH CHECK (is_admin_or_manager(auth.uid()));
DROP TRIGGER IF EXISTS update_broker_pickups_updated_at ON public.broker_pickups;
CREATE TRIGGER update_broker_pickups_updated_at BEFORE UPDATE ON public.broker_pickups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_broker_pickups_broker ON public.broker_pickups(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_pickups_status ON public.broker_pickups(status);
CREATE INDEX IF NOT EXISTS idx_broker_pickups_created ON public.broker_pickups(created_at DESC);

CREATE OR REPLACE FUNCTION public.generate_pickup_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.pickup_number IS NULL OR NEW.pickup_number = '' THEN
    NEW.pickup_number := 'BP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS set_pickup_number ON public.broker_pickups;
CREATE TRIGGER set_pickup_number BEFORE INSERT ON public.broker_pickups FOR EACH ROW EXECUTE FUNCTION public.generate_pickup_number();

-- ============ staff_permissions + attendance_records ============
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  email text,
  phone text,
  role_label text DEFAULT 'staff',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage staff permissions" ON public.staff_permissions;
CREATE POLICY "Admins manage staff permissions" ON public.staff_permissions FOR ALL USING (is_admin_or_manager(auth.uid())) WITH CHECK (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Users read own permissions" ON public.staff_permissions;
CREATE POLICY "Users read own permissions" ON public.staff_permissions FOR SELECT USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS staff_permissions_updated ON public.staff_permissions;
CREATE TRIGGER staff_permissions_updated BEFORE UPDATE ON public.staff_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  distance_meters numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance_records;
CREATE POLICY "Admins manage attendance" ON public.attendance_records FOR ALL USING (is_admin_or_manager(auth.uid())) WITH CHECK (is_admin_or_manager(auth.uid()));
DROP POLICY IF EXISTS "Staff read own attendance" ON public.attendance_records;
CREATE POLICY "Staff read own attendance" ON public.attendance_records FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Staff insert own attendance" ON public.attendance_records;
CREATE POLICY "Staff insert own attendance" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Staff update own attendance" ON public.attendance_records;
CREATE POLICY "Staff update own attendance" ON public.attendance_records FOR UPDATE USING (auth.uid() = user_id);

INSERT INTO public.store_settings (key, value)
VALUES ('attendance_geofence', '{"radius_meters": 150}'::jsonb)
ON CONFLICT (key) DO NOTHING;
