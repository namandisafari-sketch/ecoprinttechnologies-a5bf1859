
-- Devices: add browser/device profile columns
ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS screen_width integer,
  ADD COLUMN IF NOT EXISTS screen_height integer,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS connection_type text,
  ADD COLUMN IF NOT EXISTS phone_brand text,
  ADD COLUMN IF NOT EXISTS phone_model text;

-- Products: cost price for margin calcs
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit_cost numeric DEFAULT 0;

-- Seller profiles: status field
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';

-- Hero slides: 'link' column matching cta_link
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS link text;
UPDATE public.hero_slides SET link = cta_link WHERE link IS NULL;
