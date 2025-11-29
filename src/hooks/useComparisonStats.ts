import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlayerMatchStats {
  goals: number;
  passCount: number;
  successfulPass: number;
  passAccuracy: number;
  shots: number;
  shotsOnTarget: number;
  tackles: number;
  fouls: number;
  saves: number;
  crosses: number;
  corners: number;
  cornerSuccess: number;
  penaltyAreaEntry: number;
  penaltyAreaPass: number;
  aerialDuelsWon: number;
  aerialDuelsLost: number;
  freeKicks: number;
  throwIns: number;
  tiSuccess: number;
  cutBacks: number;
  runInBehind: number;
  overlaps: number;
  minutesPlayed: number;
}

interface ComparisonPlayer {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  role: string;
  teamName: string;
  teamSlug: string;
  match1Stats: PlayerMatchStats;
  match2Stats: PlayerMatchStats;
}

export function useComparisonStats(match1Id: string, match2Id: string, teamSlug?: string) {
  return useQuery({
    queryKey: ['comparison-stats', match1Id, match2Id, teamSlug],
    queryFn: async (): Promise<ComparisonPlayer[]> => {
      if (!match1Id || !match2Id) return [];

      // Get player stats for both matches
      const { data: match1Stats, error: error1 } = await supabase
        .from('player_match_stats')
        .select(`
          player_id,
          pass_count,
          successful_pass,
          goals,
          shots_attempted,
          shots_on_target,
          tackles,
          fouls,
          saves,
          crosses,
          corners,
          corner_success,
          penalty_area_entry,
          penalty_area_pass,
          aerial_duels_won,
          aerial_duels_lost,
          free_kicks,
          throw_ins,
          ti_success,
          cut_backs,
          run_in_behind,
          overlaps,
          minutes_played,
          players!inner(
            id,
            name,
            jersey_number,
            role,
            team_id,
            teams!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('match_id', match1Id);

      const { data: match2Stats, error: error2 } = await supabase
        .from('player_match_stats')
        .select(`
          player_id,
          pass_count,
          successful_pass,
          goals,
          shots_attempted,
          shots_on_target,
          tackles,
          fouls,
          saves,
          crosses,
          corners,
          corner_success,
          penalty_area_entry,
          penalty_area_pass,
          aerial_duels_won,
          aerial_duels_lost,
          free_kicks,
          throw_ins,
          ti_success,
          cut_backs,
          run_in_behind,
          overlaps,
          minutes_played,
          players!inner(
            id,
            name,
            jersey_number,
            role,
            team_id,
            teams!inner(
              id,
              name,
              slug
            )
          )
        `)
        .eq('match_id', match2Id);

      if (error1 || error2) {
        console.error('Error fetching comparison stats:', error1 || error2);
        return [];
      }

      // Group stats by player and aggregate (a player might have multiple entries per match for different halves)
      const aggregateStats = (stats: any[]): Map<string, { player: any; stats: PlayerMatchStats }> => {
        const playerMap = new Map<string, { player: any; stats: PlayerMatchStats }>();
        
        stats?.forEach((stat: any) => {
          const playerId = stat.player_id;
          const existing = playerMap.get(playerId);
          
          if (existing) {
            existing.stats.goals += stat.goals || 0;
            existing.stats.passCount += stat.pass_count || 0;
            existing.stats.successfulPass += stat.successful_pass || 0;
            existing.stats.shots += stat.shots_attempted || 0;
            existing.stats.shotsOnTarget += stat.shots_on_target || 0;
            existing.stats.tackles += stat.tackles || 0;
            existing.stats.fouls += stat.fouls || 0;
            existing.stats.saves += stat.saves || 0;
            existing.stats.crosses += stat.crosses || 0;
            existing.stats.corners += stat.corners || 0;
            existing.stats.cornerSuccess += stat.corner_success || 0;
            existing.stats.penaltyAreaEntry += stat.penalty_area_entry || 0;
            existing.stats.penaltyAreaPass += stat.penalty_area_pass || 0;
            existing.stats.aerialDuelsWon += stat.aerial_duels_won || 0;
            existing.stats.aerialDuelsLost += stat.aerial_duels_lost || 0;
            existing.stats.freeKicks += stat.free_kicks || 0;
            existing.stats.throwIns += stat.throw_ins || 0;
            existing.stats.tiSuccess += stat.ti_success || 0;
            existing.stats.cutBacks += stat.cut_backs || 0;
            existing.stats.runInBehind += stat.run_in_behind || 0;
            existing.stats.overlaps += stat.overlaps || 0;
            existing.stats.minutesPlayed += stat.minutes_played || 0;
          } else {
            playerMap.set(playerId, {
              player: stat.players,
              stats: {
                goals: stat.goals || 0,
                passCount: stat.pass_count || 0,
                successfulPass: stat.successful_pass || 0,
                passAccuracy: 0,
                shots: stat.shots_attempted || 0,
                shotsOnTarget: stat.shots_on_target || 0,
                tackles: stat.tackles || 0,
                fouls: stat.fouls || 0,
                saves: stat.saves || 0,
                crosses: stat.crosses || 0,
                corners: stat.corners || 0,
                cornerSuccess: stat.corner_success || 0,
                penaltyAreaEntry: stat.penalty_area_entry || 0,
                penaltyAreaPass: stat.penalty_area_pass || 0,
                aerialDuelsWon: stat.aerial_duels_won || 0,
                aerialDuelsLost: stat.aerial_duels_lost || 0,
                freeKicks: stat.free_kicks || 0,
                throwIns: stat.throw_ins || 0,
                tiSuccess: stat.ti_success || 0,
                cutBacks: stat.cut_backs || 0,
                runInBehind: stat.run_in_behind || 0,
                overlaps: stat.overlaps || 0,
                minutesPlayed: stat.minutes_played || 0,
              }
            });
          }
        });

        // Calculate pass accuracy
        playerMap.forEach((value) => {
          value.stats.passAccuracy = value.stats.passCount > 0 
            ? Math.round((value.stats.successfulPass / value.stats.passCount) * 100)
            : 0;
        });

        return playerMap;
      };

      const match1Aggregated = aggregateStats(match1Stats || []);
      const match2Aggregated = aggregateStats(match2Stats || []);

      // Find players that appear in both matches
      const comparisonPlayers: ComparisonPlayer[] = [];
      const emptyStats: PlayerMatchStats = {
        goals: 0, passCount: 0, successfulPass: 0, passAccuracy: 0,
        shots: 0, shotsOnTarget: 0, tackles: 0, fouls: 0, saves: 0, crosses: 0, corners: 0,
        cornerSuccess: 0, penaltyAreaEntry: 0, penaltyAreaPass: 0, aerialDuelsWon: 0,
        aerialDuelsLost: 0, freeKicks: 0, throwIns: 0, tiSuccess: 0, cutBacks: 0,
        runInBehind: 0, overlaps: 0, minutesPlayed: 0
      };

      // Get all unique player IDs from both matches
      const allPlayerIds = new Set([...match1Aggregated.keys(), ...match2Aggregated.keys()]);

      allPlayerIds.forEach(playerId => {
        const match1Data = match1Aggregated.get(playerId);
        const match2Data = match2Aggregated.get(playerId);
        
        const playerInfo = match1Data?.player || match2Data?.player;
        if (!playerInfo) return;

        // Filter by team if specified
        if (teamSlug && teamSlug !== 'all' && playerInfo.teams?.slug !== teamSlug) {
          return;
        }

        comparisonPlayers.push({
          playerId,
          playerName: playerInfo.name,
          jerseyNumber: playerInfo.jersey_number,
          role: playerInfo.role || '',
          teamName: playerInfo.teams?.name || '',
          teamSlug: playerInfo.teams?.slug || '',
          match1Stats: match1Data?.stats || emptyStats,
          match2Stats: match2Data?.stats || emptyStats,
        });
      });

      // Sort by team name, then by jersey number
      return comparisonPlayers.sort((a, b) => {
        if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
        return a.jerseyNumber - b.jerseyNumber;
      });
    },
    enabled: !!match1Id && !!match2Id,
  });
}
