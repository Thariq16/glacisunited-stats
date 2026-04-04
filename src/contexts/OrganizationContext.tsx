import React, { createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
}

interface OrgTeam {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationContextType {
  orgSlug: string | undefined;
  currentOrg: Organization | null;
  orgTeams: OrgTeam[];
  primaryTeam: OrgTeam | null;
  orgRole: string | null;
  isOrgAdmin: boolean;
  isOrgMember: boolean;
  loading: boolean;
  error: string | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
  orgSlug: undefined,
  currentOrg: null,
  orgTeams: [],
  primaryTeam: null,
  orgRole: null,
  isOrgAdmin: false,
  isOrgMember: false,
  loading: true,
  error: null,
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useAuth();

  // Fetch org by slug
  const { data: orgData, isLoading: orgLoading, error: orgError } = useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      if (!orgSlug) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, owner_id')
        .eq('slug', orgSlug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug,
  });

  // Fetch teams for this org
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['org-teams', orgData?.id],
    queryFn: async () => {
      if (!orgData?.id) return [];
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug')
        .eq('organization_id', orgData.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgData?.id,
  });

  // Fetch user's role in this org
  const { data: memberData, isLoading: memberLoading } = useQuery({
    queryKey: ['org-membership', orgData?.id, user?.id],
    queryFn: async () => {
      if (!orgData?.id || !user?.id) return null;
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgData.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orgData?.id && !!user?.id,
  });

  const value = useMemo<OrganizationContextType>(() => {
    const orgTeams = teamsData || [];
    // Primary team = the team whose slug matches the org slug, or the first team
    const primaryTeam = orgTeams.find(t => t.slug === orgSlug) || orgTeams[0] || null;
    const orgRole = memberData?.role || null;

    return {
      orgSlug,
      currentOrg: orgData || null,
      orgTeams,
      primaryTeam,
      orgRole,
      isOrgAdmin: orgRole === 'owner' || orgRole === 'admin',
      isOrgMember: !!orgRole,
      loading: orgLoading || teamsLoading || (!!user && memberLoading),
      error: orgError ? 'Organization not found' : null,
    };
  }, [orgSlug, orgData, teamsData, memberData, orgLoading, teamsLoading, memberLoading, orgError, user]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
