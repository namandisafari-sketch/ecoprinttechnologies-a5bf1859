
-- Product reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES public.devices(id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified_purchase boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, device_id, order_id)
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage reviews" ON public.product_reviews
  FOR ALL USING (is_admin(auth.uid()));

-- Delivery accounts table
CREATE TABLE public.delivery_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  pin_code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delivery accounts" ON public.delivery_accounts
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Delivery accounts viewable by everyone" ON public.delivery_accounts
  FOR SELECT USING (true);

-- Add location fields to orders for delivery tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_latitude double precision;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_longitude double precision;
