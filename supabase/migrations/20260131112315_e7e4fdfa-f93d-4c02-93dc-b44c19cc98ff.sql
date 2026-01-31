-- Fix RLS policies to properly isolate conversations by session_id

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Customers can view messages in their conversation" ON public.messages;

-- Create proper isolation policy - customers only see THEIR OWN session's conversations
CREATE POLICY "Customers can view own conversations by session"
ON public.conversations
FOR SELECT
USING (
  is_admin_or_manager(auth.uid()) 
  OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- Customers can only see messages from their own conversations
CREATE POLICY "Customers can view own conversation messages"
ON public.messages
FOR SELECT
USING (
  is_admin_or_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND c.session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
);