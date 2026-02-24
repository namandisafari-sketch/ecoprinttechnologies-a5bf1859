
-- Create app_role enum for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create brands table
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    original_price DECIMAL(12, 2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    image_url TEXT,
    images TEXT[],
    sku TEXT UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN DEFAULT false,
    color TEXT,
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create enums
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    delivery_fee DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT,
    notes TEXT,
    device_id UUID,
    delivery_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price DECIMAL(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    session_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    sender_id UUID,
    content TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create admin_access_codes table
CREATE TABLE public.admin_access_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL DEFAULT '',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

-- Create devices table
CREATE TABLE public.devices (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    device_fingerprint text NOT NULL UNIQUE,
    full_name text NOT NULL,
    recovery_code text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Add device_id FK to orders
ALTER TABLE public.orders ADD CONSTRAINT orders_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);

-- Add seller/customer roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- Create seller_profiles table
CREATE TABLE public.seller_profiles (
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

-- Create seller_services table
CREATE TABLE public.seller_services (
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

-- Create service_requests table
CREATE TABLE public.service_requests (
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

-- Create momo_transactions table
CREATE TABLE public.momo_transactions (
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

-- ===================== FUNCTIONS =====================

-- Role checking functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'manager'))
$$;

CREATE OR REPLACE FUNCTION public.is_seller(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'seller')
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'SW-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Generate delivery code
CREATE OR REPLACE FUNCTION public.generate_delivery_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.delivery_code := upper(substr(md5(random()::text), 1, 6));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Verify admin access code
CREATE OR REPLACE FUNCTION public.verify_admin_access_code(input_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admin_access_codes WHERE code = input_code AND is_active = true);
END;
$$;

-- Update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===================== TRIGGERS =====================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();
CREATE TRIGGER set_delivery_code BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_delivery_code();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversation_last_message_trigger AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_services_updated_at BEFORE UPDATE ON public.seller_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_momo_transactions_updated_at BEFORE UPDATE ON public.momo_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== INDEXES =====================

CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_orders_device_id ON public.orders(device_id);
CREATE INDEX idx_devices_fingerprint ON public.devices(device_fingerprint);
CREATE INDEX idx_devices_recovery_code ON public.devices(recovery_code);

-- ===================== RLS POLICIES =====================

-- user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- categories
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- brands
CREATE POLICY "Brands are publicly readable" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can manage brands" ON public.brands FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- products
CREATE POLICY "Active products are publicly readable" ON public.products FOR SELECT USING (is_active = true OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR UPDATE USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Anyone can view orders by order_number" ON public.orders FOR SELECT USING (true);

-- order_items
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))));
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- conversations
CREATE POLICY "Admins can view all conversations" ON public.conversations FOR SELECT USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Customers can create conversations with session" ON public.conversations FOR INSERT WITH CHECK (session_id IS NOT NULL AND session_id != '');
CREATE POLICY "Customers can view own conversations by session" ON public.conversations FOR SELECT USING (is_admin_or_manager(auth.uid()) OR session_id = current_setting('request.headers', true)::json->>'x-session-id');
CREATE POLICY "Admins can update conversations" ON public.conversations FOR UPDATE USING (is_admin_or_manager(auth.uid()));

-- messages
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Customers can create messages for their conversation" ON public.messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.session_id IS NOT NULL OR is_admin_or_manager(auth.uid()))));
CREATE POLICY "Customers can view own conversation messages" ON public.messages FOR SELECT USING (is_admin_or_manager(auth.uid()) OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.session_id = current_setting('request.headers', true)::json->>'x-session-id'));
CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE USING (is_admin_or_manager(auth.uid()));

-- admin_access_codes
CREATE POLICY "Admins can manage access codes" ON public.admin_access_codes FOR ALL USING (is_admin_or_manager(auth.uid()));

-- devices
CREATE POLICY "Anyone can register a device" ON public.devices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Anyone can update own device" ON public.devices FOR UPDATE USING (true);

-- seller_profiles
CREATE POLICY "Sellers can manage own profile" ON public.seller_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active seller profiles" ON public.seller_profiles FOR SELECT USING (is_active = true OR auth.uid() = user_id OR is_admin_or_manager(auth.uid()));

-- seller_services
CREATE POLICY "Sellers can manage own services" ON public.seller_services FOR ALL USING (EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = seller_services.seller_id AND sp.user_id = auth.uid()));
CREATE POLICY "Anyone can view active services" ON public.seller_services FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = seller_services.seller_id AND sp.user_id = auth.uid()) OR is_admin_or_manager(auth.uid()));

-- service_requests
CREATE POLICY "Customers can create service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view own requests" ON public.service_requests FOR SELECT USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = service_requests.seller_id AND sp.user_id = auth.uid()) OR is_admin_or_manager(auth.uid()));
CREATE POLICY "Sellers can update requests for their services" ON public.service_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = service_requests.seller_id AND sp.user_id = auth.uid()) OR is_admin_or_manager(auth.uid()));

-- momo_transactions
CREATE POLICY "Anyone can create momo transactions" ON public.momo_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all momo transactions" ON public.momo_transactions FOR SELECT USING (is_admin_or_manager(auth.uid()));
CREATE POLICY "Anyone can view momo transactions" ON public.momo_transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can update momo transactions" ON public.momo_transactions FOR UPDATE USING (true);

-- ===================== STORAGE =====================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND is_admin_or_manager(auth.uid()));
CREATE POLICY "Anyone can upload payment proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Admins can view payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND is_admin_or_manager(auth.uid()));

-- ===================== REALTIME =====================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ===================== SEED DATA =====================

INSERT INTO public.categories (name, slug, description, icon, display_order) VALUES
('Phone Screens', 'phone-screens', 'LCD & OLED displays for all phone brands', 'Smartphone', 1),
('Batteries', 'batteries', 'Original and compatible phone batteries', 'Battery', 2),
('Chargers & Cables', 'chargers-cables', 'Fast charging solutions', 'Cable', 3),
('Phone Cases', 'phone-cases', 'Protection and style for your device', 'ShieldCheck', 4),
('Spare Parts', 'spare-parts', 'Repair components and tools', 'Wrench', 5),
('Accessories', 'accessories', 'Enhance your device experience', 'Headphones', 6);

INSERT INTO public.brands (name, slug) VALUES
('Apple', 'apple'), ('Samsung', 'samsung'), ('Xiaomi', 'xiaomi'), ('Huawei', 'huawei'),
('Tecno', 'tecno'), ('Infinix', 'infinix'), ('Oppo', 'oppo'), ('Realme', 'realme'), ('Universal', 'universal');

INSERT INTO public.admin_access_codes (code, description) VALUES ('2345', 'Default admin access code');
