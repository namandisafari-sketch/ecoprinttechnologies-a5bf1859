
-- Store settings table for admin-configurable values like store location
CREATE TABLE IF NOT EXISTS public.store_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings are publicly readable"
ON public.store_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage store settings"
ON public.store_settings FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- Seed default store location (Suncity Mall, Kampala)
INSERT INTO public.store_settings (key, value) VALUES
('store_location', '{"lat": 0.3136, "lng": 32.5811, "label": "Eco Print Technologies - Suncity Mall, Kampala"}'::jsonb);

-- Trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
