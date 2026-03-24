import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ['active-season'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
  });
}

export function useCreateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (season: { name: string; start_date: string; end_date: string }) => {
      const { data, error } = await (supabase as any)
        .from('seasons')
        .insert(season)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

export function useUpdateSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, start_date, end_date }: { id: string; name: string; start_date: string; end_date: string }) => {
      const { error } = await (supabase as any)
        .from('seasons')
        .update({ name, start_date, end_date, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

export function useUpdateSeasonStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('seasons')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['active-season'] });
    },
  });
}

export function useDeleteSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('seasons')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}

// Fetch matches for a specific season
export function useSeasonMatches(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['season-matches', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('id, match_date, home_score, away_score, status, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), season_id')
        .eq('season_id', seasonId!)
        .order('match_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch matches NOT assigned to any season
export function useUnassignedMatches() {
  return useQuery({
    queryKey: ['unassigned-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('id, match_date, home_score, away_score, status, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), season_id')
        .is('season_id', null)
        .order('match_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

// Assign/unassign matches to a season
export function useAssignMatchToSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ matchId, seasonId }: { matchId: string; seasonId: string | null }) => {
      const { error } = await supabase
        .from('matches')
        .update({ season_id: seasonId } as any)
        .eq('id', matchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-matches'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-matches'] });
    },
  });
}
