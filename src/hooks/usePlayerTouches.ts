import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerTouch {
  x: number;
  y: number;
}

/**
 * Returns every on-ball event location (x,y on a 0–100 pitch grid)
 * for a given player. Used to render an "on ball events" heatmap.
 */
export function usePlayerTouches(
  teamSlug: string | undefined,
  playerName: string | undefined,
  matchIds?: string[]
) {
  return useQuery({
    queryKey: ['player-touches', teamSlug, playerName, matchIds],
    enabled: !!teamSlug && !!playerName,
    queryFn: async (): Promise<PlayerTouch[]> => {
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
        .select('x, y')
        .eq('player_id', players[0].id);

      if (matchIds?.length) {
        query = query.in('match_id', matchIds);
      }

      // paginated fetch to bypass 1k row default
      const all: PlayerTouch[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await query.range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        all.push(...data.map(d => ({ x: Number(d.x), y: Number(d.y) })));
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    },
  });
}
