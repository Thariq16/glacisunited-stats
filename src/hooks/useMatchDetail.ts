import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerStats } from '@/utils/parseCSV';
import { fetchAndAggregateMatchEvents } from '@/utils/aggregateMatchEvents';

export function useMatchDetail(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match-detail', matchId],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID required');

      // Get match with teams
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          home_score,
          away_score,
          venue,
          competition,
          home_team_id,
          away_team_id,
          home_team:teams!matches_home_team_id_fkey(id, name, slug),
          away_team:teams!matches_away_team_id_fkey(id, name, slug)
        `)
        .eq('id', matchId)
        .maybeSingle();

      if (matchError) throw matchError;
      if (!match) return null;

      // First try to get player stats from player_match_stats table (legacy data)
      const { data: playerStats, error: statsError } = await supabase
        .from('player_match_stats')
        .select(`
          *,
          player:players(id, jersey_number, name, role, team_id)
        `)
        .eq('match_id', matchId);

      if (statsError) throw statsError;

      // Check if we have legacy stats
      const hasLegacyStats = playerStats && playerStats.length > 0;

      let homePlayers: PlayerStats[] = [];
      let awayPlayers: PlayerStats[] = [];
      let calculatedHomeScore = match.home_score;
      let calculatedAwayScore = match.away_score;

      if (hasLegacyStats) {
        // Use legacy player_match_stats data
        const homePlayersMap = new Map<string, PlayerStats>();
        const awayPlayersMap = new Map<string, PlayerStats>();

        playerStats?.forEach((stat: any) => {
          const player = stat.player;
          if (!player) return;

          const isHomeTeam = player.team_id === match.home_team_id;
          const playersMap = isHomeTeam ? homePlayersMap : awayPlayersMap;
          const key = player.id;

          const existing = playersMap.get(key) || {
            jerseyNumber: String(player.jersey_number),
            playerName: player.name,
            role: player.role || '',
            passCount: 0, successfulPass: 0, successPassPercent: '0%',
            missPass: 0, missPassPercent: '0%',
            forwardPass: 0, forwardPassPercent: '0%',
            backwardPass: 0, backwardPassPercent: '0%',
            goals: 0, penaltyAreaPass: 0, penaltyAreaEntry: 0, 
            runInBehind: 0, overlaps: 0,
            shotsAttempted: 0, shotsOnTarget: 0,
            saves: 0, defensiveErrors: 0, aerialDuelsWon: 0, aerialDuelsLost: 0, tackles: 0,
            clearance: 0, fouls: 0, foulsInFinalThird: 0, foulsInMiddleThird: 0, foulsInDefensiveThird: 0,
            foulWon: 0, fwFinalThird: 0, fwMiddleThird: 0, fwDefensiveThird: 0, cutBacks: 0,
            crosses: 0, freeKicks: 0, corners: 0, cornerFailed: 0, cornerSuccess: 0,
            throwIns: 0, tiFailed: 0, tiSuccess: 0, offside: 0, minutesPlayed: 0, substituteAppearances: 0,
            yellowCards: 0, redCards: 0, blocks: 0, interceptions: 0, badTouches: 0,
            tacklesDefensiveThird: 0, tacklesMiddleThird: 0, tacklesFinalThird: 0,
            passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0,
            clearancesDefensiveThird: 0, clearancesMiddleThird: 0, clearancesFinalThird: 0,
            blocksDefensiveThird: 0, blocksMiddleThird: 0, blocksFinalThird: 0,
            interceptionsDefensiveThird: 0, interceptionsMiddleThird: 0, interceptionsFinalThird: 0,
            shotsDefensiveThird: 0, shotsMiddleThird: 0, shotsFinalThird: 0,
            aerialsDefensiveThird: 0, aerialsMiddleThird: 0, aerialsFinalThird: 0,
            badTouchesDefensiveThird: 0, badTouchesMiddleThird: 0, badTouchesFinalThird: 0,
          };

          const updated: PlayerStats = {
            ...existing,
            passCount: existing.passCount + (stat.pass_count || 0),
            successfulPass: existing.successfulPass + (stat.successful_pass || 0),
            missPass: existing.missPass + (stat.miss_pass || 0),
            forwardPass: existing.forwardPass + (stat.forward_pass || 0),
            backwardPass: existing.backwardPass + (stat.backward_pass || 0),
            goals: existing.goals + (stat.goals || 0),
            penaltyAreaPass: existing.penaltyAreaPass + (stat.penalty_area_pass || 0),
            penaltyAreaEntry: existing.penaltyAreaEntry + (stat.penalty_area_entry || 0),
            runInBehind: existing.runInBehind + (stat.run_in_behind || 0),
            overlaps: existing.overlaps + (stat.overlaps || 0),
            shotsAttempted: existing.shotsAttempted + (stat.shots_attempted || 0),
            shotsOnTarget: existing.shotsOnTarget + (stat.shots_on_target || 0),
            saves: existing.saves + (stat.saves || 0),
            defensiveErrors: existing.defensiveErrors + (stat.defensive_errors || 0),
            aerialDuelsWon: existing.aerialDuelsWon + (stat.aerial_duels_won || 0),
            aerialDuelsLost: existing.aerialDuelsLost + (stat.aerial_duels_lost || 0),
            tackles: existing.tackles + (stat.tackles || 0),
            clearance: existing.clearance + (stat.clearance || 0),
            fouls: existing.fouls + (stat.fouls || 0),
            foulsInFinalThird: existing.foulsInFinalThird + (stat.fouls_final_third || 0),
            foulsInMiddleThird: existing.foulsInMiddleThird + (stat.fouls_middle_third || 0),
            foulsInDefensiveThird: existing.foulsInDefensiveThird + (stat.fouls_defensive_third || 0),
            foulWon: existing.foulWon + (stat.foul_won || 0),
            fwFinalThird: existing.fwFinalThird + (stat.fw_final_3rd || 0),
            fwMiddleThird: existing.fwMiddleThird + (stat.fw_middle_3rd || 0),
            fwDefensiveThird: existing.fwDefensiveThird + (stat.fw_defensive_3rd || 0),
            cutBacks: existing.cutBacks + (stat.cut_backs || 0),
            crosses: existing.crosses + (stat.crosses || 0),
            freeKicks: existing.freeKicks + (stat.free_kicks || 0),
            corners: existing.corners + (stat.corners || 0),
            cornerFailed: existing.cornerFailed + (stat.corner_failed || 0),
            cornerSuccess: existing.cornerSuccess + (stat.corner_success || 0),
            throwIns: existing.throwIns + (stat.throw_ins || 0),
            tiFailed: existing.tiFailed + (stat.ti_failed || 0),
            tiSuccess: existing.tiSuccess + (stat.ti_success || 0),
            offside: existing.offside + (stat.offside || 0),
            minutesPlayed: existing.minutesPlayed + (stat.minutes_played || 0),
            blocks: existing.blocks,
            interceptions: existing.interceptions,
            badTouches: existing.badTouches,
          };

          // Recalculate percentages
          updated.successPassPercent = updated.passCount > 0 
            ? `${((updated.successfulPass / updated.passCount) * 100).toFixed(2)}%` 
            : '0%';
          updated.missPassPercent = updated.passCount > 0 
            ? `${((updated.missPass / updated.passCount) * 100).toFixed(2)}%` 
            : '0%';
          updated.forwardPassPercent = updated.passCount > 0 
            ? `${((updated.forwardPass / updated.passCount) * 100).toFixed(2)}%` 
            : '0%';
          updated.backwardPassPercent = updated.passCount > 0 
            ? `${((updated.backwardPass / updated.passCount) * 100).toFixed(2)}%` 
            : '0%';

          playersMap.set(key, updated);
        });

        homePlayers = Array.from(homePlayersMap.values());
        awayPlayers = Array.from(awayPlayersMap.values());
      } else {
        // Fallback: Aggregate from match_events table (new event logging system)
        const homeTeam = match.home_team as { id: string; name: string; slug: string } | null;
        const awayTeam = match.away_team as { id: string; name: string; slug: string } | null;
        
        const aggregatedData = await fetchAndAggregateMatchEvents(
          matchId,
          homeTeam?.id,
          awayTeam?.id
        );

        homePlayers = aggregatedData.homePlayers;
        awayPlayers = aggregatedData.awayPlayers;

        // Always use calculated scores from events when we have event data
        // The database trigger keeps scores in sync, but this ensures UI consistency
        calculatedHomeScore = aggregatedData.homeGoals;
        calculatedAwayScore = aggregatedData.awayGoals;
      }

      return {
        ...match,
        home_score: calculatedHomeScore,
        away_score: calculatedAwayScore,
        homePlayers,
        awayPlayers,
      };
    },
    enabled: !!matchId,
  });
}
