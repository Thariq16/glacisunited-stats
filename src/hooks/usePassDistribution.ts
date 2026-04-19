import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PassGridPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  role: string | null;
}

export interface PassDistributionHalf {
  players: PassGridPlayer[];
  // matrix[fromIdx][toIdx] = pass count
  matrix: number[][];
  // averageX/Y per player (0-100), for the map; null when player has no logged passes
  positions: Array<{ x: number; y: number; count: number } | null>;
}

export interface PassDistributionData {
  all: PassDistributionHalf;
  firstHalf: PassDistributionHalf;
  secondHalf: PassDistributionHalf;
}

const PASS_EVENTS = ['pass', 'penalty_area_pass', 'cross', 'throw_in', 'cut_back', 'long_ball', 'through_ball', 'key_pass', 'assist'];

export function usePassDistribution(
  matchId: string | undefined,
  teamId: string | undefined,
) {
  return useQuery<PassDistributionData>({
    queryKey: ['pass-distribution', matchId, teamId],
    enabled: !!matchId && !!teamId,
    queryFn: async () => {
      // Fetch all team players (squad-aware: include any player who logged an event for this team)
      const PAGE = 1000;
      let offset = 0;
      let all: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from('match_events')
          .select(`
            id, event_type, half, successful, x, y, end_x, end_y,
            player_id, target_player_id,
            player:players!match_events_player_id_fkey(id, name, jersey_number, role, team_id),
            target:players!match_events_target_player_id_fkey(id, name, jersey_number, role, team_id)
          `)
          .eq('match_id', matchId!)
          .range(offset, offset + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        offset += PAGE;
      }

      // Collect roster from team
      const roster = new Map<string, PassGridPlayer>();
      all.forEach((e) => {
        if (e.player && e.player.team_id === teamId) {
          roster.set(e.player.id, {
            id: e.player.id,
            name: e.player.name,
            jerseyNumber: e.player.jersey_number,
            role: e.player.role,
          });
        }
      });

      // Order players by role (GK, defenders, midfielders, forwards) then jersey
      const roleOrder = (r: string | null) => {
        const x = (r || '').toUpperCase();
        if (x.includes('GK')) return 0;
        if (x.startsWith('L') || x.startsWith('R') || x.startsWith('C')) {
          if (x.includes('D')) return 1;
          if (x.includes('M')) return 2;
          if (x.includes('AM') || x === 'LAM' || x === 'RAM' || x === 'CAM') return 3;
          if (x.includes('F') || x === 'ST' || x === 'CF') return 4;
        }
        if (x.includes('D')) return 1;
        if (x.includes('M')) return 2;
        if (x.includes('F') || x === 'ST') return 4;
        return 5;
      };
      const players = Array.from(roster.values()).sort((a, b) => {
        const ra = roleOrder(a.role);
        const rb = roleOrder(b.role);
        if (ra !== rb) return ra - rb;
        return a.jerseyNumber - b.jerseyNumber;
      });
      const idxMap = new Map(players.map((p, i) => [p.id, i]));

      const buildHalf = (filter: (e: any) => boolean): PassDistributionHalf => {
        const n = players.length;
        const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
        const posSums = players.map(() => ({ sx: 0, sy: 0, n: 0 }));
        all.forEach((e) => {
          if (!PASS_EVENTS.includes(e.event_type)) return;
          if (!e.successful) return;
          if (!e.player || e.player.team_id !== teamId) return;
          if (!filter(e)) return;
          const fromIdx = idxMap.get(e.player_id);
          if (fromIdx == null) return;
          // Track avg position
          if (e.x != null && e.y != null) {
            posSums[fromIdx].sx += Number(e.x);
            posSums[fromIdx].sy += Number(e.y);
            posSums[fromIdx].n += 1;
          }
          if (e.target && e.target.team_id === teamId) {
            const toIdx = idxMap.get(e.target_player_id);
            if (toIdx != null) matrix[fromIdx][toIdx] += 1;
          }
        });
        const positions = posSums.map((p) =>
          p.n > 0 ? { x: p.sx / p.n, y: p.sy / p.n, count: p.n } : null
        );
        return { players, matrix, positions };
      };

      return {
        all: buildHalf(() => true),
        firstHalf: buildHalf((e) => e.half === 1),
        secondHalf: buildHalf((e) => e.half === 2),
      };
    },
  });
}
