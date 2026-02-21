/**
 * Hook to fetch per-player match-by-match stats for trend visualization.
 * Returns an array of per-match stat snapshots ordered chronologically.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerMatchTrendPoint {
  matchId: string;
  matchDate: string;
  opponent: string;
  result: 'W' | 'D' | 'L';
  goals: number;
  passCount: number;
  passAccuracy: number;
  tackles: number;
  shotsAttempted: number;
  shotsOnTarget: number;
  minutesPlayed: number;
  aerialDuelsWon: number;
  clearance: number;
  fouls: number;
  foulWon: number;
  crosses: number;
  xG?: number;
}

export function usePlayerMatchTrends(teamSlug: string | undefined, playerName: string | undefined) {
  return useQuery({
    queryKey: ['player-match-trends', teamSlug, playerName],
    enabled: !!teamSlug && !!playerName,
    queryFn: async (): Promise<PlayerMatchTrendPoint[]> => {
      if (!teamSlug || !playerName) return [];

      // 1. Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id, slug, name')
        .eq('slug', teamSlug)
        .single();
      if (!team) return [];

      // 2. Get player
      const { data: players } = await supabase
        .from('players')
        .select('id, name')
        .eq('team_id', team.id)
        .eq('name', playerName)
        .or('hidden.is.null,hidden.eq.false');
      if (!players?.length) return [];
      const player = players[0];

      // 3. Get all team matches ordered by date
      const { data: matches } = await supabase
        .from('matches')
        .select('id, match_date, home_score, away_score, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name, slug), away_team:teams!matches_away_team_id_fkey(name, slug)')
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .eq('status', 'completed')
        .order('match_date', { ascending: true });
      if (!matches?.length) return [];

      const matchIds = matches.map(m => m.id);

      // 4. Get player_match_stats for this player across all matches
      const { data: stats } = await supabase
        .from('player_match_stats')
        .select('*')
        .eq('player_id', player.id)
        .in('match_id', matchIds);

      if (!stats?.length) return [];

      // 5. Aggregate halves per match and build trend points
      const statsByMatch = new Map<string, typeof stats>();
      for (const s of stats) {
        const arr = statsByMatch.get(s.match_id) || [];
        arr.push(s);
        statsByMatch.set(s.match_id, arr);
      }

      // 6. Optionally get xG from match_events (shots)
      const { data: shots } = await supabase
        .from('match_events')
        .select('match_id, x, y, shot_outcome')
        .eq('player_id', player.id)
        .eq('event_type', 'shot')
        .in('match_id', matchIds);

      const shotsByMatch = new Map<string, typeof shots>();
      if (shots) {
        for (const s of shots) {
          const arr = shotsByMatch.get(s.match_id) || [];
          arr.push(s);
          shotsByMatch.set(s.match_id, arr);
        }
      }

      const results: PlayerMatchTrendPoint[] = [];

      for (const match of matches) {
        const halfStats = statsByMatch.get(match.id);
        if (!halfStats) continue;

        const isHome = match.home_team_id === team.id;
        const opponent = isHome
          ? (match.away_team as any)?.name || 'Unknown'
          : (match.home_team as any)?.name || 'Unknown';
        const teamScore = isHome ? match.home_score : match.away_score;
        const oppScore = isHome ? match.away_score : match.home_score;
        const result: 'W' | 'D' | 'L' = teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D';

        // Sum across halves
        const sum = (key: string) => halfStats.reduce((a, h) => a + ((h as any)[key] ?? 0), 0);
        const passCount = sum('pass_count');
        const successfulPass = sum('successful_pass');
        const passAccuracy = passCount > 0 ? Math.round((successfulPass / passCount) * 100) : 0;

        // Simple xG calc from shot positions
        const matchShots = shotsByMatch.get(match.id) || [];
        let xG = 0;
        for (const shot of matchShots) {
          const dist = Math.sqrt(Math.pow(100 - Number(shot.x), 2) + Math.pow(50 - Number(shot.y), 2));
          xG += Math.max(0.02, 0.4 - dist * 0.006);
        }

        results.push({
          matchId: match.id,
          matchDate: match.match_date,
          opponent,
          result,
          goals: sum('goals'),
          passCount,
          passAccuracy,
          tackles: sum('tackles'),
          shotsAttempted: sum('shots_attempted'),
          shotsOnTarget: sum('shots_on_target'),
          minutesPlayed: sum('minutes_played'),
          aerialDuelsWon: sum('aerial_duels_won'),
          clearance: sum('clearance'),
          fouls: sum('fouls'),
          foulWon: sum('foul_won'),
          crosses: sum('crosses'),
          xG: Math.round(xG * 100) / 100,
        });
      }

      return results;
    },
  });
}
