import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
}

interface OrgMembership {
  organization_id: string;
  role: string;
  organization: Organization;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  membership: OrgMembership | null;
  allMemberships: OrgMembership[];
  loading: boolean;
  hasOrg: boolean;
  switchOrg: (orgId: string) => void;
  refreshOrg: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrgMembership | null>(null);
  const [allMemberships, setAllMemberships] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const fetchMemberships = async () => {
    if (!user) {
      setCurrentOrg(null);
      setMembership(null);
      setAllMemberships([]);
      setResolvedUserId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id);

      if (error || !members || members.length === 0) {
        setAllMemberships([]);
        setCurrentOrg(null);
        setMembership(null);
        return;
      }

      // Fetch org details for each membership
      const orgIds = members.map((m) => m.organization_id);
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgError) throw orgError;

      const memberships: OrgMembership[] = members
        .map((m) => ({
          organization_id: m.organization_id,
          role: m.role,
          organization: orgs?.find((o) => o.id === m.organization_id) as Organization,
        }))
        .filter((m) => m.organization);

      setAllMemberships(memberships);

      // Restore last selected org from localStorage or use first
      const savedOrgId = localStorage.getItem('currentOrgId');
      const saved = memberships.find((m) => m.organization_id === savedOrgId);
      const active = saved || memberships[0];

      if (active) {
        setCurrentOrg(active.organization);
        setMembership(active);
        localStorage.setItem('currentOrgId', active.organization_id);
      } else {
        setCurrentOrg(null);
        setMembership(null);
        localStorage.removeItem('currentOrgId');
      }
    } catch (err) {
      console.error('Error fetching org memberships:', err);
      setAllMemberships([]);
      setCurrentOrg(null);
      setMembership(null);
    } finally {
      setResolvedUserId(user.id);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchMemberships();
    }
  }, [user, authLoading]);

  const switchOrg = (orgId: string) => {
    const target = allMemberships.find((m) => m.organization_id === orgId);
    if (target) {
      setCurrentOrg(target.organization);
      setMembership(target);
      localStorage.setItem('currentOrgId', orgId);
    }
  };

  const refreshOrg = async () => {
    await fetchMemberships();
  };

  const isResolvingMembership = !!user && resolvedUserId !== user.id;
  const organizationLoading = authLoading || loading || isResolvingMembership;
  const hasOrg = !organizationLoading && allMemberships.length > 0;

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        membership,
        allMemberships,
        loading: organizationLoading,
        hasOrg,
        switchOrg,
        refreshOrg,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
