-- Drop the overly permissive policy
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

-- Create a new policy that only allows users to see their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);