-- Fix privilege escalation: remove self-owner clause from organization_members INSERT policy
DROP POLICY IF EXISTS "Org admins can insert members" ON public.organization_members;

CREATE POLICY "Org admins can insert members"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- Provide a trusted way for the organization's owner (as recorded in organizations.owner_id)
-- to create their initial owner membership row. This is the only legitimate path for the
-- self-insert-as-owner case that the old policy was trying to support.
CREATE OR REPLACE FUNCTION public.bootstrap_org_owner_membership(_organization_id uuid)
RETURNS public.organization_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.organization_members;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _organization_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the organization owner can bootstrap the owner membership';
  END IF;

  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (auth.uid(), _organization_id, 'owner')
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = _organization_id
    LIMIT 1;
  END IF;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_org_owner_membership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_org_owner_membership(uuid) TO authenticated;