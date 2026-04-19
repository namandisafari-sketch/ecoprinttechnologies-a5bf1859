DO $$
DECLARE
  new_user_id uuid;
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM auth.users WHERE email = 'admin@eco.app';
  IF existing_id IS NULL THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
      'admin@eco.app', crypt('Zxcvbn#2', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrator"}'::jsonb,
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id, 'admin@eco.app')::jsonb, 'email', new_user_id::text, now(), now(), now());
  ELSE
    new_user_id := existing_id;
    UPDATE auth.users SET encrypted_password = crypt('Zxcvbn#2', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now() WHERE id = existing_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.profiles (user_id, full_name) VALUES (new_user_id, 'Administrator') ON CONFLICT DO NOTHING;
END $$;