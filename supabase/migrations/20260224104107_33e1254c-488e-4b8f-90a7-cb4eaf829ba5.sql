
-- Create hero_slides table for admin-managed hero carousel
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  cta_text text NOT NULL DEFAULT 'Shop Now',
  cta_link text NOT NULL DEFAULT '/search',
  image_url text,
  bg_class text NOT NULL DEFAULT 'from-secondary/95 via-secondary/80 to-secondary/95',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hero slides are publicly readable" ON public.hero_slides
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage hero slides" ON public.hero_slides
  FOR ALL USING (is_admin_or_manager(auth.uid()));

CREATE TRIGGER update_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default slides
INSERT INTO public.hero_slides (title, subtitle, cta_text, cta_link, bg_class, display_order) VALUES
  ('Eco Print Technologies', 'Top brands, expert repairs, unbeatable prices', 'Shop Now', '/search', 'from-secondary/95 via-secondary/80 to-secondary/95', 1),
  ('Up to 30% Off', 'Refurbished laptops — tested & certified quality', 'View Deals', '/search?q=Sale', 'from-primary/90 via-primary/70 to-primary/90', 2),
  ('Same-Day Repairs', 'Expert technicians, genuine parts, fast turnaround', 'Find Technicians', '/technicians', 'from-accent/90 via-accent/70 to-accent/90', 3),
  ('Free Delivery', 'On orders above UGX 500,000 within Kampala', 'Start Shopping', '/search', 'from-secondary/95 via-secondary/80 to-secondary/95', 4);
