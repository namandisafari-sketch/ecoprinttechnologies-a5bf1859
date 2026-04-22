
-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all subscribers
CREATE POLICY "Admins can view newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (is_admin_or_manager(auth.uid()));

-- Admins can update subscribers
CREATE POLICY "Admins can update newsletter subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (is_admin_or_manager(auth.uid()));

-- Admins can delete subscribers
CREATE POLICY "Admins can delete newsletter subscribers"
ON public.newsletter_subscribers
FOR DELETE
TO authenticated
USING (is_admin_or_manager(auth.uid()));

-- Timestamp trigger
CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix conversations RLS: drop restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Customers can create conversations with session" ON public.conversations;

CREATE POLICY "Customers can create conversations with session"
ON public.conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (session_id IS NOT NULL AND session_id <> '');

-- Fix messages RLS: drop restrictive INSERT policy and recreate as permissive
DROP POLICY IF EXISTS "Customers can create messages for their conversation" ON public.messages;

CREATE POLICY "Customers can create messages for their conversation"
ON public.messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.session_id IS NOT NULL OR is_admin_or_manager(auth.uid()))
  )
);

-- Fix conversations SELECT for customers to be permissive
DROP POLICY IF EXISTS "Customers can view own conversations by session" ON public.conversations;

CREATE POLICY "Customers can view own conversations by session"
ON public.conversations
FOR SELECT
TO anon, authenticated
USING (
  is_admin_or_manager(auth.uid()) OR 
  (session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id'))
);

-- Fix messages SELECT for customers
DROP POLICY IF EXISTS "Customers can view own conversation messages" ON public.messages;

CREATE POLICY "Customers can view own conversation messages"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (
  is_admin_or_manager(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.session_id = ((current_setting('request.headers'::text, true))::json ->> 'x-session-id')
  )
);
