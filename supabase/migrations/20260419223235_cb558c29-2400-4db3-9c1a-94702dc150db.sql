-- delivery_zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district text NOT NULL,
  subcounty text,
  delivery_fee numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Delivery zones publicly readable" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Admins manage delivery zones" ON public.delivery_zones FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- delivery_accounts
CREATE TABLE IF NOT EXISTS public.delivery_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  pin_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Delivery accounts readable for login" ON public.delivery_accounts FOR SELECT USING (true);
CREATE POLICY "Admins manage delivery accounts" ON public.delivery_accounts FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- product_reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  device_id text,
  order_id uuid,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_verified_purchase boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews publicly readable" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can submit reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage reviews" ON public.product_reviews FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- product_specifications
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_name text NOT NULL,
  spec_value text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Specs publicly readable" ON public.product_specifications FOR SELECT USING (true);
CREATE POLICY "Admins manage specs" ON public.product_specifications FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(device_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wishlist readable" ON public.wishlist FOR SELECT USING (true);
CREATE POLICY "Wishlist insert" ON public.wishlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Wishlist delete" ON public.wishlist FOR DELETE USING (true);