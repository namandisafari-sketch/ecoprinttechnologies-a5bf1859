
-- Create delivery zones table for admin to set delivery prices per area
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  district TEXT NOT NULL,
  subcounty TEXT,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Everyone can read delivery zones (needed for checkout)
CREATE POLICY "Anyone can view active delivery zones"
ON public.delivery_zones
FOR SELECT
USING (true);

-- Only admins can manage delivery zones
CREATE POLICY "Admins can insert delivery zones"
ON public.delivery_zones
FOR INSERT
WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can update delivery zones"
ON public.delivery_zones
FOR UPDATE
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admins can delete delivery zones"
ON public.delivery_zones
FOR DELETE
USING (public.is_admin_or_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
