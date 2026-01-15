-- Drop the overly permissive policy that exposes all user roles
-- The "Users can view their own role" policy already exists and properly restricts access
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;