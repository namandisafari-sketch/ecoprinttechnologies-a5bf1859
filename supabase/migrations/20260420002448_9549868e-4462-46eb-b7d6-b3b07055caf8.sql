-- Add tiered pricing for products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wholesale_price numeric,
  ADD COLUMN IF NOT EXISTS internal_price numeric;

-- Add add-ons / upgrades support to sale_items (per-line attached extras)
ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS addons jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.wholesale_price IS 'Bulk / reseller price (admin-only)';
COMMENT ON COLUMN public.products.internal_price IS 'Trusted partner / internal price (admin-only)';
COMMENT ON COLUMN public.sale_items.addons IS 'Array of {name, price, product_id?} attached upgrades or add-ons sold with this line';