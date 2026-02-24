
-- Product specifications table for dynamic attributes per product
CREATE TABLE public.product_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_key TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product variants table (e.g., Color/Storage combos with own SKU/price/stock)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  sku TEXT,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  attributes JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Specs policies: public read, admin manage
CREATE POLICY "Specs are publicly readable"
  ON public.product_specifications FOR SELECT USING (true);

CREATE POLICY "Admins can manage specs"
  ON public.product_specifications FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- Variants policies: public read, admin manage
CREATE POLICY "Variants are publicly readable"
  ON public.product_variants FOR SELECT USING (true);

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (is_admin_or_manager(auth.uid()));

-- Update trigger for variants
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_product_specs_product_id ON public.product_specifications(product_id);
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
