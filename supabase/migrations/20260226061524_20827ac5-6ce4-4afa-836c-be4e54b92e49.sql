-- Fix organization_members SELECT policy to avoid potential recursion
-- Users should simply be able to see their own memberships
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;

CREATE POLICY "Users can view own memberships"
ON public.organization_members
FOR SELECT
USING (auth.uid() = user_id);

-- Also allow org admins to see all members in their org (non-recursive via SECURITY DEFINER function)
CREATE POLICY "Org admins can view all org members"
ON public.organization_members
FOR SELECT
USING (is_org_admin(auth.uid(), organization_id));

-- Fix organizations SELECT policy - users should see orgs they belong to
-- The current policy uses is_org_member which works but let's also allow owner access directly
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;

CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = id
    AND organization_members.user_id = auth.uid()
  )
);