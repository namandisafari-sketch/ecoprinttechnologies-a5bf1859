-- Create a function to check if user is a seller
CREATE OR REPLACE FUNCTION public.is_seller(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'seller'
  )
$$;

-- Create seller_profiles table for technician/seller information
CREATE TABLE IF NOT EXISTS public.seller_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    business_name text NOT NULL,
    description text,
    phone text NOT NULL,
    whatsapp text,
    location text,
    specializations text[] DEFAULT '{}',
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    rating numeric(2,1) DEFAULT 0,
    total_reviews integer DEFAULT 0,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on seller_profiles
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller_profiles
CREATE POLICY "Sellers can manage own profile"
ON public.seller_profiles FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active seller profiles"
ON public.seller_profiles FOR SELECT
USING (is_active = true OR auth.uid() = user_id OR is_admin_or_manager(auth.uid()));

-- Create seller_services table for services offered by sellers
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

-- Enable RLS on seller_services
ALTER TABLE public.seller_services ENABLE ROW LEVEL SECURITY;

-- RLS policies for seller_services
CREATE POLICY "Sellers can manage own services"
ON public.seller_services FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.seller_profiles sp
        WHERE sp.id = seller_services.seller_id AND sp.user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can view active services"
ON public.seller_services FOR SELECT
USING (
    is_active = true OR 
    EXISTS (
        SELECT 1 FROM public.seller_profiles sp
        WHERE sp.id = seller_services.seller_id AND sp.user_id = auth.uid()
    ) OR
    is_admin_or_manager(auth.uid())
);

-- Create service_requests table for customers hiring sellers
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

-- Enable RLS on service_requests
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_requests
CREATE POLICY "Customers can create service requests"
ON public.service_requests FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view own requests"
ON public.service_requests FOR SELECT
USING (
    auth.uid() = customer_id OR 
    EXISTS (
        SELECT 1 FROM public.seller_profiles sp
        WHERE sp.id = service_requests.seller_id AND sp.user_id = auth.uid()
    ) OR
    is_admin_or_manager(auth.uid())
);

CREATE POLICY "Sellers can update requests for their services"
ON public.service_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.seller_profiles sp
        WHERE sp.id = service_requests.seller_id AND sp.user_id = auth.uid()
    ) OR
    is_admin_or_manager(auth.uid())
);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_seller_profiles_updated_at
BEFORE UPDATE ON public.seller_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_services_updated_at
BEFORE UPDATE ON public.seller_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();