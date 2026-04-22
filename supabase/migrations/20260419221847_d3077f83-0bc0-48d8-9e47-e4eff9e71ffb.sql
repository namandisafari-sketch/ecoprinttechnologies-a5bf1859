CREATE OR REPLACE FUNCTION public.is_seller(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'seller')
$$;

CREATE TABLE IF NOT EXISTS public.seller_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    business_name text NOT NULL,
    description text,
    phone text NOT NULL,
    whatsapp text,
    location text,
    shop_number text,
    specializations text[] DEFAULT '{}',
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    rating numeric(2,1) DEFAULT 0,
    total_reviews integer DEFAULT 0,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers can manage own profile" ON public.seller_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active seller profiles" ON public.seller_profiles FOR SELECT USING (is_active = true OR auth.uid() = user_id OR is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.seller_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    price numeric NOT NULL,
    price_type text DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'starting_from', 'hourly')),
    category text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.seller_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers can manage own services" ON public.seller_services FOR ALL USING (EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = seller_services.seller_id AND sp.user_id = auth.uid()));
CREATE POLICY "Anyone can view active services" ON public.seller_services FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = seller_services.seller_id AND sp.user_id = auth.uid()) OR is_admin_or_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.service_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES auth.users(id) NOT NULL,
    seller_id uuid REFERENCES public.seller_profiles(id) NOT NULL,
    service_id uuid REFERENCES public.seller_services(id),
    title text NOT NULL,
    description text NOT NULL,
    device_type text,
    device_brand text,
    device_model text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    budget numeric,
    customer_phone text NOT NULL,
    customer_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can create service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view own requests" ON public.service_requests FOR SELECT USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = service_requests.seller_id AND sp.user_id = auth.uid()) OR is_admin_or_manager(auth.uid()));
CREATE POLICY "Sellers can update requests for their services" ON public.service_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = service_requests.seller_id AND sp.user_id = auth.uid()) OR is_admin_or_manager(auth.uid()));

CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_services_updated_at BEFORE UPDATE ON public.seller_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view orders by order_number" ON public.orders FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.devices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint text NOT NULL UNIQUE,
  full_name text NOT NULL,
  recovery_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can register a device" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Anyone can update own device" ON public.devices FOR UPDATE USING (true);

ALTER TABLE public.orders ADD COLUMN device_id uuid REFERENCES public.devices(id);
CREATE INDEX idx_orders_device_id ON public.orders(device_id);
CREATE INDEX idx_devices_fingerprint ON public.devices(device_fingerprint);
CREATE INDEX idx_devices_recovery_code ON public.devices(recovery_code);
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_code text;

CREATE OR REPLACE FUNCTION public.generate_delivery_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.delivery_code := upper(substr(md5(random()::text), 1, 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_delivery_code BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_delivery_code();

CREATE TABLE IF NOT EXISTS public.momo_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reference_id TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UGX',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESSFUL', 'FAILED')),
  raw_request_json JSONB,
  raw_response_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_momo_one_active_per_order ON public.momo_transactions(order_id) WHERE status IN ('PENDING', 'SUCCESSFUL');
ALTER TABLE public.momo_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create momo transactions" ON public.momo_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all momo transactions" ON public.momo_transactions FOR SELECT USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Anyone can view momo transactions" ON public.momo_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can update momo transactions" ON public.momo_transactions FOR UPDATE USING (true);
CREATE TRIGGER update_momo_transactions_updated_at BEFORE UPDATE ON public.momo_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();