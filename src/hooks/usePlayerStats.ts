import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerStats } from '@/utils/parseCSV';

export type MatchFilter = 'all' | 'last1' | 'last3' | string; // string for specific match IDs

export interface MatchFilterOptions {
  filter: MatchFilter;
  matchId?: string;
}

export function usePlayerStats(teamSlug: string, matchFilter: MatchFilter = 'all') {
  const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);
  
  return useQuery({
    queryKey: ['player-stats', teamSlug, matchFilter],
    queryFn: async () => {
      // Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('slug', teamSlug)
        .single();

      if (!team) throw new Error('Team not found');

      let matchIds: string[] = [];

      if (isSpecificMatch) {
        // Specific match ID provided
        matchIds = [matchFilter];
      } else {
        // Get matches for the team based on filter
        const matchesQuery = supabase
          .from('matches')
          .select('id, match_date')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .order('match_date', { ascending: false });

        if (matchFilter === 'last1') {
          matchesQuery.limit(1);
        } else if (matchFilter === 'last3') {
          matchesQuery.limit(3);
        }

        const { data: matches } = await matchesQuery;
        if (!matches || matches.length === 0) return [];

        matchIds = matches.map(m => m.id);
      }

      // Get all players and their aggregated stats
      const { data: playersData } = await supabase
        .from('players')
        .select(`
          id,
          jersey_number,
          name,
          role,
          player_match_stats!inner(
            pass_count,
            successful_pass,
            miss_pass,
            forward_pass,
            backward_pass,
            goals,
            penalty_area_pass,
            penalty_area_entry,
            run_in_behind,
            overlaps,
            shots_attempted,
            shots_on_target,
            saves,
            defensive_errors,
            aerial_duels_won,
            aerial_duels_lost,
            tackles,
            clearance,
            fouls,
            fouls_final_third,
            fouls_middle_third,
            fouls_defensive_third,
            foul_won,
            fw_final_3rd,
            fw_middle_3rd,
            fw_defensive_3rd,
            cut_backs,
            crosses,
            free_kicks,
            corners,
            corner_failed,
            corner_success,
            throw_ins,
            ti_failed,
            ti_success,
            offside,
            minutes_played
          )
        `)
        .eq('team_id', team.id)
        .in('player_match_stats.match_id', matchIds);

      if (!playersData) return [];

      // Aggregate stats for each player
      const aggregatedPlayers: PlayerStats[] = playersData.map((player: any) => {
        const stats = player.player_match_stats;
        
        const aggregated = stats.reduce((acc: any, stat: any) => ({
          passCount: acc.passCount + (stat.pass_count || 0),
          successfulPass: acc.successfulPass + (stat.successful_pass || 0),
          missPass: acc.missPass + (stat.miss_pass || 0),
          forwardPass: acc.forwardPass + (stat.forward_pass || 0),
          backwardPass: acc.backwardPass + (stat.backward_pass || 0),
          goals: acc.goals + (stat.goals || 0),
          penaltyAreaPass: acc.penaltyAreaPass + (stat.penalty_area_pass || 0),
          penaltyAreaEntry: acc.penaltyAreaEntry + (stat.penalty_area_entry || 0),
          runInBehind: acc.runInBehind + (stat.run_in_behind || 0),
          overlaps: acc.overlaps + (stat.overlaps || 0),
          shotsAttempted: acc.shotsAttempted + (stat.shots_attempted || 0),
          shotsOnTarget: acc.shotsOnTarget + (stat.shots_on_target || 0),
          saves: acc.saves + (stat.saves || 0),
          defensiveErrors: acc.defensiveErrors + (stat.defensive_errors || 0),
          aerialDuelsWon: acc.aerialDuelsWon + (stat.aerial_duels_won || 0),
          aerialDuelsLost: acc.aerialDuelsLost + (stat.aerial_duels_lost || 0),
          tackles: acc.tackles + (stat.tackles || 0),
          clearance: acc.clearance + (stat.clearance || 0),
          fouls: acc.fouls + (stat.fouls || 0),
          foulsInFinalThird: acc.foulsInFinalThird + (stat.fouls_final_third || 0),
          foulsInMiddleThird: acc.foulsInMiddleThird + (stat.fouls_middle_third || 0),
          foulsInDefensiveThird: acc.foulsInDefensiveThird + (stat.fouls_defensive_third || 0),
          foulWon: acc.foulWon + (stat.foul_won || 0),
          fwFinalThird: acc.fwFinalThird + (stat.fw_final_3rd || 0),
          fwMiddleThird: acc.fwMiddleThird + (stat.fw_middle_3rd || 0),
          fwDefensiveThird: acc.fwDefensiveThird + (stat.fw_defensive_3rd || 0),
          cutBacks: acc.cutBacks + (stat.cut_backs || 0),
          crosses: acc.crosses + (stat.crosses || 0),
          freeKicks: acc.freeKicks + (stat.free_kicks || 0),
          corners: acc.corners + (stat.corners || 0),
          cornerFailed: acc.cornerFailed + (stat.corner_failed || 0),
          cornerSuccess: acc.cornerSuccess + (stat.corner_success || 0),
          throwIns: acc.throwIns + (stat.throw_ins || 0),
          tiFailed: acc.tiFailed + (stat.ti_failed || 0),
          tiSuccess: acc.tiSuccess + (stat.ti_success || 0),
          offside: acc.offside + (stat.offside || 0),
          minutesPlayed: acc.minutesPlayed + (stat.minutes_played || 0),
        }), {
          passCount: 0, successfulPass: 0, missPass: 0, forwardPass: 0, backwardPass: 0,
          goals: 0, penaltyAreaPass: 0, penaltyAreaEntry: 0, runInBehind: 0, overlaps: 0,
          shotsAttempted: 0, shotsOnTarget: 0, saves: 0, defensiveErrors: 0, 
          aerialDuelsWon: 0, aerialDuelsLost: 0, tackles: 0, clearance: 0, 
          fouls: 0, foulsInFinalThird: 0, foulsInMiddleThird: 0, foulsInDefensiveThird: 0,
          foulWon: 0, fwFinalThird: 0, fwMiddleThird: 0, fwDefensiveThird: 0, cutBacks: 0,
          crosses: 0, freeKicks: 0, corners: 0, cornerFailed: 0, cornerSuccess: 0,
          throwIns: 0, tiFailed: 0, tiSuccess: 0, offside: 0, minutesPlayed: 0,
        });

        // Calculate percentages
        const successPassPercent = aggregated.passCount > 0 
          ? `${((aggregated.successfulPass / aggregated.passCount) * 100).toFixed(2)}%` 
          : '0%';
        const missPassPercent = aggregated.passCount > 0 
          ? `${((aggregated.missPass / aggregated.passCount) * 100).toFixed(2)}%` 
          : '0%';
        const forwardPassPercent = aggregated.passCount > 0 
          ? `${((aggregated.forwardPass / aggregated.passCount) * 100).toFixed(2)}%` 
          : '0%';
        const backwardPassPercent = aggregated.passCount > 0 
          ? `${((aggregated.backwardPass / aggregated.passCount) * 100).toFixed(2)}%` 
          : '0%';

        return {
          jerseyNumber: String(player.jersey_number),
          playerName: player.name,
          role: player.role || '',
          ...aggregated,
          successPassPercent,
          missPassPercent,
          forwardPassPercent,
          backwardPassPercent,
        };
      });

      return aggregatedPlayers;
    },
  });
}

export function useMatches(teamSlug?: string) {
  return useQuery({
    queryKey: ['matches', teamSlug],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          venue,
          competition,
          home_team:teams!matches_home_team_id_fkey(id, name, slug),
          away_team:teams!matches_away_team_id_fkey(id, name, slug)
        `)
        .order('match_date', { ascending: false });

      if (teamSlug) {
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .eq('slug', teamSlug)
          .single();

        if (team) {
          query = query.or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllMatches() {
  return useQuery({
    queryKey: ['all-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          venue,
          competition,
          home_team:teams!matches_home_team_id_fkey(id, name, slug),
          away_team:teams!matches_away_team_id_fkey(id, name, slug)
        `)
        .order('match_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}
