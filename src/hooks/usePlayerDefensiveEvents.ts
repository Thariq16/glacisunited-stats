import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DefensiveEvent } from '@/components/views/DefensiveHeatmap';

const DEFENSIVE_EVENT_TYPES = ['tackle', 'clearance', 'block', 'aerial_duel', 'interception', 'recovery'];

export function usePlayerDefensiveEvents(
  teamSlug: string | undefined,
  playerName: string | undefined,
  matchIds?: string[]
) {
  return useQuery({
    queryKey: ['player-defensive-events', teamSlug, playerName, matchIds],
    enabled: !!teamSlug && !!playerName,
    queryFn: async (): Promise<DefensiveEvent[]> => {
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
        .select('id, x, y, event_type, successful')
        .eq('player_id', players[0].id)
        .in('event_type', DEFENSIVE_EVENT_TYPES);

      if (matchIds?.length) {
        query = query.in('match_id', matchIds);
      }

      const { data } = await query;
      return (data || []).map(e => ({
        id: e.id,
        x: Number(e.x),
        y: Number(e.y),
        type: e.event_type,
      }));
    },
  });
}
