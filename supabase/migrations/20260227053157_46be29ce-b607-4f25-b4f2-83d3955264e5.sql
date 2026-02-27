
-- Fix infinite recursion in user_roles RLS policies
-- Drop the recursive admin policy and replace with a non-recursive one
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

-- Use auth.uid() directly without subquery to user_roles
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin' AND ur.user_id = auth.uid()
    )
  );
