-- Brokers table
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT,
  location TEXT,
  commission_rate NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage brokers"
  ON public.brokers FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Broker pickups table
CREATE TABLE IF NOT EXISTS public.broker_pickups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_number TEXT NOT NULL UNIQUE,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  purpose TEXT NOT NULL DEFAULT 'showing', -- buying, showing, borrowing
  payment_method TEXT DEFAULT 'unpaid',     -- cash, momo, unpaid, on_return
  amount_paid NUMERIC DEFAULT 0,
  expected_return_date DATE,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending, approved, released, returned, sold, overdue, rejected
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  released_by TEXT,
  released_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broker pickups"
  ON public.broker_pickups FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_broker_pickups_updated_at
  BEFORE UPDATE ON public.broker_pickups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_broker_pickups_broker ON public.broker_pickups(broker_id);
CREATE INDEX idx_broker_pickups_status ON public.broker_pickups(status);
CREATE INDEX idx_broker_pickups_created ON public.broker_pickups(created_at DESC);

-- Auto-generate pickup number
CREATE OR REPLACE FUNCTION public.generate_pickup_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.pickup_number IS NULL OR NEW.pickup_number = '' THEN
    NEW.pickup_number := 'BP-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 5));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pickup_number
  BEFORE INSERT ON public.broker_pickups
  FOR EACH ROW EXECUTE FUNCTION public.generate_pickup_number();