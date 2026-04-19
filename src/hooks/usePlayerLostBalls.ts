import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LostBallEvent {
  id: string;
  x: number;       // origin
  y: number;
  endX: number;    // destination (where ball ended)
  endY: number;
  eventType: string;
  half: number;
}

export interface LostBallsData {
  from: LostBallEvent[]; // failed passes the player attempted
  to: LostBallEvent[];   // failed passes intended for this player
}

const PASS_EVENTS = [
  'pass', 'key_pass', 'assist', 'cross', 'penalty_area_pass',
  'long_ball', 'through_ball', 'throw_in', 'cut_back',
];

/**
 * Returns failed passes split into FROM (player as passer) and TO (player as
 * intended receiver), used by the Lost Balls zone-grid visualizations.
 */
export function usePlayerLostBalls(
  teamSlug: string | undefined,
  playerName: string | undefined,
  matchIds?: string[],
) {
  return useQuery({
    queryKey: ['player-lost-balls', teamSlug, playerName, matchIds],
    enabled: !!teamSlug && !!playerName,
    queryFn: async (): Promise<LostBallsData> => {
      if (!teamSlug || !playerName) return { from: [], to: [] };

      const { data: team } = await supabase
        .from('teams').select('id').eq('slug', teamSlug).single();
      if (!team) return { from: [], to: [] };

      const { data: players } = await supabase
        .from('players').select('id')
        .eq('team_id', team.id)
        .eq('name', decodeURIComponent(playerName))
        .or('hidden.is.null,hidden.eq.false');
      if (!players?.length) return { from: [], to: [] };
      const playerId = players[0].id;

      const fetchPaginated = async (
        builder: (q: any) => any,
      ): Promise<any[]> => {
        const PAGE = 1000;
        const all: any[] = [];
        let offset = 0;
        while (true) {
          const base = supabase
            .from('match_events')
            .select('id, x, y, end_x, end_y, event_type, half, successful, player_id, target_player_id, match_id')
            .in('event_type', PASS_EVENTS)
            .eq('successful', false);
          let q = builder(base);
          if (matchIds?.length) q = q.in('match_id', matchIds);
          const { data, error } = await q.range(offset, offset + PAGE - 1);
          if (error || !data || data.length === 0) break;
          all.push(...data);
          if (data.length < PAGE) break;
          offset += PAGE;
        }
        return all;
      };

      const [fromRows, toRows] = await Promise.all([
        fetchPaginated((q: any) => q.eq('player_id', playerId)),
        fetchPaginated((q: any) => q.eq('target_player_id', playerId)),
      ]);

      const map = (r: any): LostBallEvent => ({
        id: r.id,
        x: Number(r.x),
        y: Number(r.y),
        endX: r.end_x != null ? Number(r.end_x) : Number(r.x),
        endY: r.end_y != null ? Number(r.end_y) : Number(r.y),
        eventType: r.event_type,
        half: r.half,
      });

      return {
        from: fromRows.map(map),
        to: toRows.map(map),
      };
    },
  });
}
