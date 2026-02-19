
-- Add delivery confirmation code to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_code text;

-- Create function to generate 6-digit delivery code on order insert
CREATE OR REPLACE FUNCTION public.generate_delivery_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.delivery_code := upper(substr(md5(random()::text), 1, 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate delivery code for new orders
CREATE TRIGGER set_delivery_code
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_delivery_code();
