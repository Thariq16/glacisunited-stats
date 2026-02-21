import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { aggregateEventsToPlayerStats } from '@/utils/aggregateMatchEvents';

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

const emptyStats: PlayerMatchStats = {
  goals: 0, passCount: 0, successfulPass: 0, passAccuracy: 0,
  shots: 0, shotsOnTarget: 0, tackles: 0, fouls: 0, saves: 0, crosses: 0, corners: 0,
  cornerSuccess: 0, penaltyAreaEntry: 0, penaltyAreaPass: 0, aerialDuelsWon: 0,
  aerialDuelsLost: 0, freeKicks: 0, throwIns: 0, tiSuccess: 0, cutBacks: 0,
  runInBehind: 0, overlaps: 0, minutesPlayed: 0
};

async function fetchStatsFromPMS(matchId: string) {
  const { data, error } = await supabase
    .from('player_match_stats')
    .select(`
      player_id,
      pass_count, successful_pass, goals, shots_attempted, shots_on_target,
      tackles, fouls, saves, crosses, corners, corner_success,
      penalty_area_entry, penalty_area_pass, aerial_duels_won, aerial_duels_lost,
      free_kicks, throw_ins, ti_success, cut_backs, run_in_behind, overlaps, minutes_played,
      players!inner(id, name, jersey_number, role, team_id, teams!inner(id, name, slug))
    `)
    .eq('match_id', matchId);

  if (error) throw error;
  return data || [];
}

async function fetchStatsFromEvents(matchId: string): Promise<Map<string, { player: any; stats: PlayerMatchStats }>> {
  const PAGE_SIZE = 1000;
  let allEvents: any[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('match_events')
      .select(`*, player:players!match_events_player_id_fkey(id, name, jersey_number, team_id, role, teams!players_team_id_fkey(id, name, slug))`)
      .eq('match_id', matchId)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allEvents = allEvents.concat(data || []);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const aggregated = aggregateEventsToPlayerStats(allEvents);
  const result = new Map<string, { player: any; stats: PlayerMatchStats }>();

  aggregated.forEach((ps, key) => {
    // Find a matching event to get team info
    const ev = allEvents.find(e => e.player_id === key);
    const playerInfo = ev?.player || { id: key, name: ps.playerName, jersey_number: parseInt(ps.jerseyNumber) || 0, role: ps.role || '', teams: null };

    result.set(key, {
      player: playerInfo,
      stats: {
        goals: ps.goals,
        passCount: ps.passCount,
        successfulPass: ps.successfulPass,
        passAccuracy: ps.passCount > 0 ? Math.round((ps.successfulPass / ps.passCount) * 100) : 0,
        shots: ps.shotsAttempted,
        shotsOnTarget: ps.shotsOnTarget,
        tackles: ps.tackles,
        fouls: ps.fouls,
        saves: ps.saves,
        crosses: ps.crosses,
        corners: ps.corners,
        cornerSuccess: ps.cornerSuccess,
        penaltyAreaEntry: ps.penaltyAreaEntry,
        penaltyAreaPass: ps.penaltyAreaPass,
        aerialDuelsWon: ps.aerialDuelsWon,
        aerialDuelsLost: ps.aerialDuelsLost,
        freeKicks: ps.freeKicks,
        throwIns: ps.throwIns,
        tiSuccess: ps.tiSuccess,
        cutBacks: ps.cutBacks,
        runInBehind: ps.runInBehind,
        overlaps: ps.overlaps,
        minutesPlayed: ps.minutesPlayed,
      }
    });
  });

  return result;
}

function aggregatePMS(stats: any[]): Map<string, { player: any; stats: PlayerMatchStats }> {
  const playerMap = new Map<string, { player: any; stats: PlayerMatchStats }>();

  stats.forEach((stat: any) => {
    const playerId = stat.player_id;
    const existing = playerMap.get(playerId);

    const add = (a: number, b: number | null) => a + (b || 0);

    if (existing) {
      const s = existing.stats;
      s.goals = add(s.goals, stat.goals);
      s.passCount = add(s.passCount, stat.pass_count);
      s.successfulPass = add(s.successfulPass, stat.successful_pass);
      s.shots = add(s.shots, stat.shots_attempted);
      s.shotsOnTarget = add(s.shotsOnTarget, stat.shots_on_target);
      s.tackles = add(s.tackles, stat.tackles);
      s.fouls = add(s.fouls, stat.fouls);
      s.saves = add(s.saves, stat.saves);
      s.crosses = add(s.crosses, stat.crosses);
      s.corners = add(s.corners, stat.corners);
      s.cornerSuccess = add(s.cornerSuccess, stat.corner_success);
      s.penaltyAreaEntry = add(s.penaltyAreaEntry, stat.penalty_area_entry);
      s.penaltyAreaPass = add(s.penaltyAreaPass, stat.penalty_area_pass);
      s.aerialDuelsWon = add(s.aerialDuelsWon, stat.aerial_duels_won);
      s.aerialDuelsLost = add(s.aerialDuelsLost, stat.aerial_duels_lost);
      s.freeKicks = add(s.freeKicks, stat.free_kicks);
      s.throwIns = add(s.throwIns, stat.throw_ins);
      s.tiSuccess = add(s.tiSuccess, stat.ti_success);
      s.cutBacks = add(s.cutBacks, stat.cut_backs);
      s.runInBehind = add(s.runInBehind, stat.run_in_behind);
      s.overlaps = add(s.overlaps, stat.overlaps);
      s.minutesPlayed = add(s.minutesPlayed, stat.minutes_played);
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

  playerMap.forEach((value) => {
    value.stats.passAccuracy = value.stats.passCount > 0
      ? Math.round((value.stats.successfulPass / value.stats.passCount) * 100)
      : 0;
  });

  return playerMap;
}

export function useComparisonStats(match1Id: string, match2Id: string, teamSlug?: string) {
  return useQuery({
    queryKey: ['comparison-stats', match1Id, match2Id, teamSlug],
    queryFn: async (): Promise<ComparisonPlayer[]> => {
      if (!match1Id || !match2Id) return [];

      // Try player_match_stats first, fall back to match_events
      const [pms1, pms2] = await Promise.all([
        fetchStatsFromPMS(match1Id),
        fetchStatsFromPMS(match2Id),
      ]);

      let match1Aggregated: Map<string, { player: any; stats: PlayerMatchStats }>;
      let match2Aggregated: Map<string, { player: any; stats: PlayerMatchStats }>;

      if (pms1.length > 0) {
        match1Aggregated = aggregatePMS(pms1);
      } else {
        match1Aggregated = await fetchStatsFromEvents(match1Id);
      }

      if (pms2.length > 0) {
        match2Aggregated = aggregatePMS(pms2);
      } else {
        match2Aggregated = await fetchStatsFromEvents(match2Id);
      }

      const comparisonPlayers: ComparisonPlayer[] = [];
      const allPlayerIds = new Set([...match1Aggregated.keys(), ...match2Aggregated.keys()]);

      allPlayerIds.forEach(playerId => {
        const match1Data = match1Aggregated.get(playerId);
        const match2Data = match2Aggregated.get(playerId);

        const playerInfo = match1Data?.player || match2Data?.player;
        if (!playerInfo) return;

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

      return comparisonPlayers.sort((a, b) => {
        if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName);
        return a.jerseyNumber - b.jerseyNumber;
      });
    },
    enabled: !!match1Id && !!match2Id,
  });
}
