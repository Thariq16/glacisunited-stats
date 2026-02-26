
-- ============================================
-- MULTI-TENANCY FOUNDATION
-- ============================================

-- 1. Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create organization_members table (org-scoped roles)
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'analyst', 'coach', 'player', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Add organization_id to teams
ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 4. Helper functions for org membership checks
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id 
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- 5. RLS Policies for organizations
-- Anyone can view orgs they belong to
CREATE POLICY "Members can view their organization"
  ON public.organizations FOR SELECT
  USING (is_org_member(auth.uid(), id));

-- Owners can update their org
CREATE POLICY "Owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (get_org_role(auth.uid(), id) = 'owner');

-- Authenticated users can create orgs (self-service signup)
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can delete
CREATE POLICY "Owners can delete their organization"
  ON public.organizations FOR DELETE
  USING (get_org_role(auth.uid(), id) = 'owner');

-- 6. RLS Policies for organization_members
-- Members can view other members of their org
CREATE POLICY "Members can view org members"
  ON public.organization_members FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

-- Org admins/owners can manage members
CREATE POLICY "Org admins can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    is_org_admin(auth.uid(), organization_id)
    OR (auth.uid() = user_id AND role = 'owner') -- allow self-insert as owner during org creation
  );

CREATE POLICY "Org admins can update members"
  ON public.organization_members FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete members"
  ON public.organization_members FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id));

-- 7. Update teams RLS to be org-scoped (keep existing public read + add org-scoped write)
-- Keep existing SELECT policy (public readable) for now
-- Update write policies to also allow org admins
CREATE POLICY "Org admins can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update teams"
  ON public.teams FOR UPDATE
  USING (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete teams"
  ON public.teams FOR DELETE
  USING (is_org_admin(auth.uid(), organization_id));

-- 8. Add trigger for updated_at on new tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
