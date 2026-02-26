-- Fix organizations SELECT policy to use SECURITY DEFINER function instead of direct subquery
-- The subquery hits RLS on organization_members causing empty results
DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;

CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
USING (is_org_member(auth.uid(), id));