-- Attendance: align column names with code
ALTER TABLE public.attendance_records RENAME COLUMN check_in TO check_in_at;
ALTER TABLE public.attendance_records RENAME COLUMN check_out TO check_out_at;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_in_lat numeric;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_in_lng numeric;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_out_lat numeric;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS check_out_lng numeric;

-- Brokers
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS location text;

-- Broker pickups: add missing fields used by UI
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS product_sku text;
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS total_value numeric DEFAULT 0;
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS purpose text DEFAULT 'showing';
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS released_at timestamptz;
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS returned_at timestamptz;
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS expected_return date;
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS sale_id uuid;
ALTER TABLE public.broker_pickups ADD COLUMN IF NOT EXISTS order_id uuid;

-- Products: cost price
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0;

-- Order items: cost price
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS cost_price numeric;

-- Variants: attributes
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- Verify admin access code RPC
CREATE OR REPLACE FUNCTION public.verify_admin_access_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_access_codes
    WHERE code = _code AND is_active = true
  );
$$;