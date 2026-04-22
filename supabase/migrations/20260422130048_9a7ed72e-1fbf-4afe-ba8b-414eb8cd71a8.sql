UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE id = '0bf88615-a783-4a68-8f2c-fb68dd4fcf2b';

INSERT INTO public.user_roles (user_id, role)
VALUES ('0bf88615-a783-4a68-8f2c-fb68dd4fcf2b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.profiles (user_id, full_name)
VALUES ('0bf88615-a783-4a68-8f2c-fb68dd4fcf2b', 'System Admin')
ON CONFLICT DO NOTHING;