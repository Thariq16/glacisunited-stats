import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlayerStats } from '@/utils/parseCSV';
import { MatchFilter } from './usePlayerStats';
import { fetchAndAggregateEventsForTeam, createEmptyPlayerStats } from '@/utils/aggregateMatchEvents';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

// Helper type for substitution data
type SubmissionMap = {
  [matchId: string]: {
    [playerId: string]: { type: 'on' | 'off', minute: number }
  }
};

function aggregatePlayerStats(stats: any[], substitutions: SubmissionMap = {}): any {
  return stats.reduce((acc: any, stat: any) => {
    let minutesInMatch = 90; // Default to full match

    const relevantSub = substitutions[stat.match_id]?.[stat.player_id];

    if (relevantSub) {
      if (relevantSub.type === 'off') {
        minutesInMatch = relevantSub.minute;
      } else if (relevantSub.type === 'on') {
        minutesInMatch = 90 - relevantSub.minute;
      }
    }

    return {
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
      minutesPlayed: acc.minutesPlayed + minutesInMatch,
      substituteAppearances: acc.substituteAppearances + (stat.substitute_appearances || 0),
    }
  }, {
    passCount: 0, successfulPass: 0, missPass: 0, forwardPass: 0, backwardPass: 0,
    goals: 0, penaltyAreaPass: 0, penaltyAreaEntry: 0, runInBehind: 0, overlaps: 0,
    shotsAttempted: 0, shotsOnTarget: 0, saves: 0, defensiveErrors: 0,
    aerialDuelsWon: 0, aerialDuelsLost: 0, tackles: 0, clearance: 0,
    fouls: 0, foulsInFinalThird: 0, foulsInMiddleThird: 0, foulsInDefensiveThird: 0,
    foulWon: 0, fwFinalThird: 0, fwMiddleThird: 0, fwDefensiveThird: 0, cutBacks: 0,
    crosses: 0, freeKicks: 0, corners: 0, cornerFailed: 0, cornerSuccess: 0,
    throwIns: 0, tiFailed: 0, tiSuccess: 0, offside: 0, minutesPlayed: 0, substituteAppearances: 0,
  });
}

function calculatePercentages(aggregated: any) {
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

  return { successPassPercent, missPassPercent, forwardPassPercent, backwardPassPercent };
}

export function useTeamWithPlayers(teamSlug: string | undefined, matchFilter: MatchFilter = 'all') {
  const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);

  return useQuery({
    queryKey: ['team-with-players', teamSlug, matchFilter],
    queryFn: async () => {
      if (!teamSlug) throw new Error('Team slug required');

      // Get team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, slug')
        .eq('slug', teamSlug)
        .maybeSingle();

      if (teamError) throw teamError;
      if (!team) return null;

      // Determine which match IDs to filter by
      let matchIds: string[] = [];

      if (isSpecificMatch) {
        matchIds = [matchFilter];
      } else if (matchFilter === 'last1' || matchFilter === 'last3') {
        const matchesQuery = supabase
          .from('matches')
          .select('id')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .in('status', ['completed', 'in_progress'])
          .order('match_date', { ascending: false });

        if (matchFilter === 'last1') {
          matchesQuery.limit(1);
        } else if (matchFilter === 'last3') {
          matchesQuery.limit(3);
        }

        const { data: matches } = await matchesQuery;
        matchIds = matches?.map(m => m.id) || [];
      } else {
        // Get all matches for the team
        const { data: matches } = await supabase
          .from('matches')
          .select('id')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .in('status', ['completed', 'in_progress']);
        matchIds = matches?.map(m => m.id) || [];
      }

      // Fetch substitution events for these matches
      const { data: subEvents } = await supabase
        .from('match_events')
        .select('*')
        .in('match_id', matchIds)
        .eq('event_type', 'substitution');

      const substitutions: SubmissionMap = {};
      subEvents?.forEach((event: any) => {
        if (!substitutions[event.match_id]) substitutions[event.match_id] = {};

        // Player OFF
        if (event.player_id) {
          substitutions[event.match_id][event.player_id] = { type: 'off', minute: event.minute };
        }
        // Player ON (substitute)
        if (event.substitute_player_id) {
          substitutions[event.match_id][event.substitute_player_id] = { type: 'on', minute: event.minute };
        }
      });

      // Get all players with their stats (excluding hidden players)
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          jersey_number,
          name,
          role,
          hidden,
          player_match_stats(
            match_id,
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
        .eq('hidden', false);

      if (playersError) throw playersError;

      // Check if any player has legacy stats for the filtered matches
      let hasLegacyStats = false;
      (playersData || []).forEach((player: any) => {
        const filteredStats = (player.player_match_stats || []).filter(
          (stat: any) => matchIds.length === 0 || matchIds.includes(stat.match_id)
        );
        if (filteredStats.length > 0) {
          hasLegacyStats = true;
        }
      });

      let players: PlayerStats[] = [];

      if (hasLegacyStats) {
        // Use legacy player_match_stats data
        players = (playersData || []).map((player: any) => {
          let stats = player.player_match_stats || [];

          // Filter stats by match IDs if we have a filter
          if (matchIds.length > 0) {
            stats = stats.filter((stat: any) => matchIds.includes(stat.match_id));
          }

          // Deduplicate by match_id
          const uniqueStatsMap = new Map();
          stats.forEach((stat: any) => {
            if (!uniqueStatsMap.has(stat.match_id)) {
              uniqueStatsMap.set(stat.match_id, stat);
            }
          });
          const uniqueStats = Array.from(uniqueStatsMap.values());

          const aggregated = aggregatePlayerStats(uniqueStats, substitutions);
          const percentages = calculatePercentages(aggregated);

          return {
            jerseyNumber: String(player.jersey_number),
            playerName: player.name,
            role: player.role || '',
            ...aggregated,
            ...percentages,
          };
        });
      } else if (matchIds.length > 0) {
        // Fallback: Aggregate from match_events
        const eventsStatsMap = await fetchAndAggregateEventsForTeam(matchIds, team.id);

        // Merge event-based stats with player list
        players = (playersData || []).map((player: any) => {
          const eventStats = eventsStatsMap.get(player.id);
          if (eventStats) {
            return eventStats;
          }
          // Return empty stats for players with no events
          return {
            jerseyNumber: String(player.jersey_number),
            playerName: player.name,
            role: player.role || '',
            ...createEmptyPlayerStats(String(player.jersey_number), player.name, player.role || ''),
          };
        });
      } else {
        // No matches, return empty stats
        players = (playersData || []).map((player: any) => ({
          jerseyNumber: String(player.jersey_number),
          playerName: player.name,
          role: player.role || '',
          ...createEmptyPlayerStats(String(player.jersey_number), player.name, player.role || ''),
        }));
      }

      return {
        ...team,
        players,
      };
    },
    enabled: !!teamSlug,
  });
}

export function useOppositionTeams(excludeSlug: string = 'glacis-united-fc', matchFilter: MatchFilter = 'all') {
  const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);

  return useQuery({
    queryKey: ['opposition-teams', excludeSlug, matchFilter],
    queryFn: async () => {
      // Get all teams except the excluded one
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, slug')
        .neq('slug', excludeSlug)
        .order('name');

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [];

      // Get players with stats for each team
      const teamsWithPlayers = await Promise.all(
        teams.map(async (team) => {
          // Determine which match IDs to filter by for this team
          let matchIds: string[] = [];

          if (isSpecificMatch) {
            matchIds = [matchFilter];
          } else if (matchFilter === 'last1' || matchFilter === 'last3') {
            const matchesQuery = supabase
              .from('matches')
              .select('id')
              .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
              .in('status', ['completed', 'in_progress'])
              .order('match_date', { ascending: false });

            if (matchFilter === 'last1') {
              matchesQuery.limit(1);
            } else if (matchFilter === 'last3') {
              matchesQuery.limit(3);
            }

            const { data: matches } = await matchesQuery;
            matchIds = matches?.map(m => m.id) || [];
          } else {
            const { data: matches } = await supabase
              .from('matches')
              .select('id')
              .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
              .in('status', ['completed', 'in_progress']);
            matchIds = matches?.map(m => m.id) || [];
          }

          // Fetch substitution events for these matches
          const { data: subEvents } = await supabase
            .from('match_events')
            .select('*')
            .in('match_id', matchIds)
            .eq('event_type', 'substitution');

          const substitutions: SubmissionMap = {};
          subEvents?.forEach((event: any) => {
            if (!substitutions[event.match_id]) substitutions[event.match_id] = {};
            if (event.player_id) substitutions[event.match_id][event.player_id] = { type: 'off', minute: event.minute };
            if (event.substitute_player_id) substitutions[event.match_id][event.substitute_player_id] = { type: 'on', minute: event.minute };
          });

          const { data: playersData } = await supabase
            .from('players')
            .select(`
              id,
              jersey_number,
              name,
              role,
              hidden,
              player_match_stats(
                match_id,
                pass_count, successful_pass, miss_pass, forward_pass, backward_pass,
                goals, penalty_area_pass, penalty_area_entry, run_in_behind, overlaps,
                shots_attempted, shots_on_target, saves, defensive_errors, 
                aerial_duels_won, aerial_duels_lost, tackles, clearance,
                fouls, fouls_final_third, fouls_middle_third, fouls_defensive_third, foul_won,
                fw_final_3rd, fw_middle_3rd, fw_defensive_3rd, cut_backs, crosses, free_kicks,
                corners, corner_failed, corner_success, throw_ins, ti_failed, ti_success, 
                offside, minutes_played
              )
            `)
            .eq('team_id', team.id)
            .eq('hidden', false);

          // Check if we have legacy stats
          let hasLegacyStats = false;
          (playersData || []).forEach((player: any) => {
            const filteredStats = (player.player_match_stats || []).filter(
              (stat: any) => matchIds.length === 0 || matchIds.includes(stat.match_id)
            );
            if (filteredStats.length > 0) {
              hasLegacyStats = true;
            }
          });

          let players: PlayerStats[];

          if (hasLegacyStats) {
            players = (playersData || []).map((player: any) => {
              let stats = player.player_match_stats || [];

              if (matchIds.length > 0) {
                stats = stats.filter((stat: any) => matchIds.includes(stat.match_id));
              }

              if (matchIds.length > 0) {
                stats = stats.filter((stat: any) => matchIds.includes(stat.match_id));
              }

              // Deduplicate by match_id
              const uniqueStatsMap = new Map();
              stats.forEach((stat: any) => {
                if (!uniqueStatsMap.has(stat.match_id)) {
                  uniqueStatsMap.set(stat.match_id, stat);
                }
              });
              const uniqueStats = Array.from(uniqueStatsMap.values());

              const aggregated = aggregatePlayerStats(uniqueStats, substitutions);
              const percentages = calculatePercentages(aggregated);

              return {
                jerseyNumber: String(player.jersey_number),
                playerName: player.name,
                role: player.role || '',
                ...aggregated,
                ...percentages,
              };
            });
          } else if (matchIds.length > 0) {
            // Fallback to match_events
            const eventsStatsMap = await fetchAndAggregateEventsForTeam(matchIds, team.id);

            players = (playersData || []).map((player: any) => {
              const eventStats = eventsStatsMap.get(player.id);
              if (eventStats) {
                return eventStats;
              }
              return {
                jerseyNumber: String(player.jersey_number),
                playerName: player.name,
                role: player.role || '',
                ...createEmptyPlayerStats(String(player.jersey_number), player.name, player.role || ''),
              };
            });
          } else {
            players = (playersData || []).map((player: any) => ({
              jerseyNumber: String(player.jersey_number),
              playerName: player.name,
              role: player.role || '',
              ...createEmptyPlayerStats(String(player.jersey_number), player.name, player.role || ''),
            }));
          }

          return { ...team, players };
        })
      );

      return teamsWithPlayers;
    },
  });
}
