-- Create a function to check if a user is a coach for Glacis United FC
-- This can be extended later to link coaches to specific teams via a coaches_teams table
CREATE OR REPLACE FUNCTION public.is_glacis_coach(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'coach'::app_role
  )
  -- Note: Currently all coaches are Glacis United FC coaches
  -- To support multiple teams, create a coaches_teams junction table
$$;

-- Drop existing coach policies on match_comments
DROP POLICY IF EXISTS "Coaches can view match comments" ON public.match_comments;
DROP POLICY IF EXISTS "Coaches can add replies to comments" ON public.match_comments;

-- Create new policies that only allow Glacis United FC coaches
CREATE POLICY "Glacis coaches can view match comments"
  ON public.match_comments
  FOR SELECT
  USING (is_glacis_coach(auth.uid()));

CREATE POLICY "Glacis coaches can add replies to comments"
  ON public.match_comments
  FOR INSERT
  WITH CHECK (is_glacis_coach(auth.uid()) AND parent_id IS NOT NULL);