-- Staff granular permissions
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role_label TEXT DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage staff permissions" ON public.staff_permissions
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users read own permissions" ON public.staff_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER staff_permissions_updated
  BEFORE UPDATE ON public.staff_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT,
  check_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_at TIMESTAMPTZ,
  check_in_lat DOUBLE PRECISION,
  check_in_lng DOUBLE PRECISION,
  check_out_lat DOUBLE PRECISION,
  check_out_lng DOUBLE PRECISION,
  distance_meters NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage attendance" ON public.attendance_records
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Staff read own attendance" ON public.attendance_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff insert own attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff update own attendance" ON public.attendance_records
  FOR UPDATE USING (auth.uid() = user_id);

-- Orders: broker + source
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS broker_id UUID,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'online';

-- Order items: cost price for profit
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Broker pickups: link to sale
ALTER TABLE public.broker_pickups
  ADD COLUMN IF NOT EXISTS sale_order_id UUID;

-- Geofence settings (uses existing store_settings table)
INSERT INTO public.store_settings (key, value)
VALUES ('attendance_geofence', '{"radius_meters": 150}'::jsonb)
ON CONFLICT DO NOTHING;