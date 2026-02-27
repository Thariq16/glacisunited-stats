import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

interface PrimaryTeam {
  id: string;
  name: string;
  slug: string;
}

export function usePrimaryTeam() {
  const { currentOrg, loading: orgLoading } = useOrganization();
  const orgId = currentOrg?.id;

  const query = useQuery({
    queryKey: ['primary-team', orgId],
    queryFn: async (): Promise<PrimaryTeam | null> => {
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  return {
    ...query,
    primaryTeam: query.data ?? null,
    teamSlug: query.data?.slug ?? '',
    teamName: query.data?.name ?? currentOrg?.name ?? 'My Team',
    isReady: !orgLoading && !query.isLoading,
  };
}
