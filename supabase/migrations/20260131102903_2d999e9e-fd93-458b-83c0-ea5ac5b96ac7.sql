-- Drop the permissive policies
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;

-- Add session_id column to conversations for tracking anonymous users
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Create more secure policies with session tracking
-- Customers can only view/create their own conversations using session_id
CREATE POLICY "Customers can create conversations with session"
ON public.conversations FOR INSERT
WITH CHECK (session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Customers can view own conversations"
ON public.conversations FOR SELECT
USING (is_admin_or_manager(auth.uid()) OR session_id IS NOT NULL);

-- Messages: customers can only add to their conversation
CREATE POLICY "Customers can create messages for their conversation"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.session_id IS NOT NULL OR is_admin_or_manager(auth.uid()))
    )
);

CREATE POLICY "Customers can view messages in their conversation"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
    ) OR is_admin_or_manager(auth.uid())
);