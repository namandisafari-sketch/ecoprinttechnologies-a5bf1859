-- Create table for admin access codes
CREATE TABLE public.admin_access_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code_hash TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage access codes
CREATE POLICY "Admins can manage access codes"
ON public.admin_access_codes
FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- Create a function to verify access code (public, no auth required)
CREATE OR REPLACE FUNCTION public.verify_admin_access_code(input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_access_codes
        WHERE code_hash = crypt(input_code, code_hash)
        AND is_active = true
    );
END;
$$;

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the initial access code (2345) - hashed for security
INSERT INTO public.admin_access_codes (code_hash, description)
VALUES (crypt('2345', gen_salt('bf')), 'Default admin access code');