ALTER TABLE public.seller_profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';
ALTER TABLE public.service_requests ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.product_specifications RENAME COLUMN spec_name TO spec_key;