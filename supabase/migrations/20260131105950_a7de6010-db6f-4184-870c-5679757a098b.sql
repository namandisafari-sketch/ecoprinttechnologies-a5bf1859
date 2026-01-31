-- Drop the old function
DROP FUNCTION IF EXISTS public.verify_admin_access_code(TEXT);

-- Recreate the table with plain code (access codes are shared secrets, not passwords)
-- Delete existing data
DELETE FROM public.admin_access_codes;

-- Alter table to store code directly (for simple access codes)
ALTER TABLE public.admin_access_codes 
  DROP COLUMN IF EXISTS code_hash,
  ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';

-- Create a simpler verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access_code(input_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_access_codes
        WHERE code = input_code
        AND is_active = true
    );
END;
$$;

-- Insert the access code
INSERT INTO public.admin_access_codes (code, description)
VALUES ('2345', 'Default admin access code');