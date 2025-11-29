import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MatchComment {
  id: string;
  match_id: string;
  comment: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useMatchComments(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match-comments', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      
      const { data, error } = await supabase
        .from('match_comments')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as MatchComment[];
    },
    enabled: !!matchId,
  });
}

export function useAddMatchComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ matchId, comment }: { matchId: string; comment: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('match_comments')
        .insert({
          match_id: matchId,
          comment,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['match-comments', matchId] });
    },
  });
}

export function useUpdateMatchComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, comment, matchId }: { id: string; comment: string; matchId: string }) => {
      const { data, error } = await supabase
        .from('match_comments')
        .update({ comment })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['match-comments', matchId] });
    },
  });
}

export function useDeleteMatchComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, matchId }: { id: string; matchId: string }) => {
      const { error } = await supabase
        .from('match_comments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { matchId }) => {
      queryClient.invalidateQueries({ queryKey: ['match-comments', matchId] });
    },
  });
}