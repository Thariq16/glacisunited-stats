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

export function useUpdateSeasonStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
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
      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seasons'] }),
  });
}
