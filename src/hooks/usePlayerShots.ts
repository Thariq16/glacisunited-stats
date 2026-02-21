import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerShotEvent {
  id: string;
  x: number;
  y: number;
  goal_mouth_x: number | null;
  goal_mouth_y: number | null;
  shot_outcome: string;
  half: number;
  minute: number;
  match_id: string;
}

export function usePlayerShots(teamSlug: string | undefined, playerName: string | undefined, matchIds?: string[]) {
  return useQuery({
    queryKey: ['player-shots', teamSlug, playerName, matchIds],
    enabled: !!teamSlug && !!playerName,
    queryFn: async (): Promise<PlayerShotEvent[]> => {
      if (!teamSlug || !playerName) return [];

      const { data: team } = await supabase
        .from('teams').select('id').eq('slug', teamSlug).single();
      if (!team) return [];

      const { data: players } = await supabase
        .from('players').select('id')
        .eq('team_id', team.id).eq('name', playerName)
        .or('hidden.is.null,hidden.eq.false');
      if (!players?.length) return [];

      let query = supabase
        .from('match_events')
        .select('id, x, y, goal_mouth_x, goal_mouth_y, shot_outcome, half, minute, match_id')
        .eq('player_id', players[0].id)
        .in('event_type', ['shot', 'penalty']);

      if (matchIds?.length) {
        query = query.in('match_id', matchIds);
      }

      const { data } = await query.order('minute');
      return (data || []) as PlayerShotEvent[];
    },
  });
}
