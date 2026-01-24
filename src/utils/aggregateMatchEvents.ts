import { PlayerStats } from './parseCSV';
import { supabase } from '@/integrations/supabase/client';

interface MatchEvent {
  id: string;
  player_id: string;
  event_type: string;
  x: number;
  y: number;
  end_x?: number;
  end_y?: number;
  successful: boolean;
  shot_outcome?: string;
  aerial_outcome?: string;
  half: number;
  minute: number;
  seconds?: number;
  player?: {
    id: string;
    name: string;
    jersey_number: number;
    role?: string;
    team_id: string;
  };
}

// Zone thresholds based on X coordinate (0-100 scale)
const DEFENSIVE_THIRD_MAX = 33.33;
const MIDDLE_THIRD_MAX = 66.66;
const PENALTY_AREA_X_START = 83; // Approximate penalty area start

function getZone(x: number): 'defensive' | 'middle' | 'final' {
  if (x < DEFENSIVE_THIRD_MAX) return 'defensive';
  if (x < MIDDLE_THIRD_MAX) return 'middle';
  return 'final';
}

function isInPenaltyArea(x: number, y: number): boolean {
  return x >= PENALTY_AREA_X_START && y >= 21 && y <= 79;
}

// Events that count as passes for pass count
const PASS_EVENTS = ['pass', 'key_pass', 'assist', 'cross', 'penalty_area_pass', 'long_ball', 'through_ball', 'throw_in'];

// Events that should not be counted as passes
const NON_PASS_EVENTS = ['shot', 'goal', 'tackle', 'tackle_won', 'interception', 'clearance', 'save', 
  'foul_committed', 'foul_won', 'card', 'aerial_duel', 'block', 'offside', 'run_in_behind', 
  'overlap', 'carry', 'dribble', 'defensive_error', 'substitution', 'penalty_area_entry',
  'corner', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart', 'cut_back'];

export function aggregateEventsToPlayerStats(
  events: MatchEvent[],
  teamIdFilter?: string
): Map<string, PlayerStats> {
  const playersMap = new Map<string, PlayerStats>();

  events.forEach((event) => {
    const player = event.player;
    if (!player) return;
    
    // Filter by team if specified
    if (teamIdFilter && player.team_id !== teamIdFilter) return;

    const playerId = player.id;
    
    // Initialize player if not exists
    if (!playersMap.has(playerId)) {
      playersMap.set(playerId, createEmptyPlayerStats(
        String(player.jersey_number),
        player.name,
        player.role || ''
      ));
    }

    const stats = playersMap.get(playerId)!;
    const eventType = event.event_type;
    const successful = event.successful;
    const x = event.x;
    const endX = event.end_x;
    const endY = event.end_y;

    // Process event based on type
    switch (eventType) {
      case 'pass':
      case 'key_pass':
      case 'assist':
      case 'long_ball':
      case 'through_ball':
        stats.passCount++;
        if (successful) {
          stats.successfulPass++;
          // Determine pass direction based on end position
          if (endX !== undefined && endX > x) {
            stats.forwardPass++;
          } else if (endX !== undefined && endX < x) {
            stats.backwardPass++;
          }
        } else {
          stats.missPass++;
        }
        break;

      case 'cross':
        stats.crosses++;
        stats.passCount++;
        if (successful) {
          stats.successfulPass++;
          stats.forwardPass++;
        } else {
          stats.missPass++;
        }
        break;

      case 'penalty_area_pass':
        stats.penaltyAreaPass++;
        stats.passCount++;
        if (successful) {
          stats.successfulPass++;
          stats.forwardPass++;
        } else {
          stats.missPass++;
        }
        break;

      case 'cut_back':
        stats.cutBacks++;
        break;

      case 'shot':
        stats.shotsAttempted++;
        if (event.shot_outcome === 'goal' || event.shot_outcome === 'on_target') {
          stats.shotsOnTarget++;
        }
        if (event.shot_outcome === 'goal') {
          stats.goals++;
        }
        break;

      case 'goal':
        stats.goals++;
        stats.shotsAttempted++;
        stats.shotsOnTarget++;
        break;

      case 'tackle':
      case 'tackle_won':
        stats.tackles++;
        break;

      case 'clearance':
        stats.clearance++;
        break;

      case 'save':
        stats.saves++;
        break;

      case 'foul_committed':
        stats.fouls++;
        const foulZone = getZone(x);
        if (foulZone === 'final') stats.foulsInFinalThird++;
        else if (foulZone === 'middle') stats.foulsInMiddleThird++;
        else stats.foulsInDefensiveThird++;
        break;

      case 'foul_won':
        stats.foulWon++;
        const fwZone = getZone(x);
        if (fwZone === 'final') stats.fwFinalThird++;
        else if (fwZone === 'middle') stats.fwMiddleThird++;
        else stats.fwDefensiveThird++;
        break;

      case 'aerial_duel':
        if (event.aerial_outcome === 'won') {
          stats.aerialDuelsWon++;
        } else {
          stats.aerialDuelsLost++;
        }
        break;

      case 'corner':
        stats.corners++;
        if (successful) stats.cornerSuccess++;
        else stats.cornerFailed++;
        break;

      case 'throw_in':
        stats.throwIns++;
        stats.passCount++;
        if (successful) {
          stats.tiSuccess++;
          stats.successfulPass++;
          stats.forwardPass++;
        } else {
          stats.tiFailed++;
          stats.missPass++;
        }
        break;

      case 'free_kick':
        stats.freeKicks++;
        break;

      case 'penalty_area_entry':
        stats.penaltyAreaEntry++;
        break;

      case 'run_in_behind':
        stats.runInBehind++;
        break;

      case 'overlap':
        stats.overlaps++;
        break;

      case 'offside':
        stats.offside++;
        break;

      case 'defensive_error':
        stats.defensiveErrors++;
        break;

      case 'block':
      case 'interception':
        // These contribute to defensive actions but aren't specifically tracked
        break;

      default:
        // Handle any unrecognized events
        break;
    }

    // Update the map
    playersMap.set(playerId, stats);
  });

  // Calculate percentages for all players
  playersMap.forEach((stats, playerId) => {
    if (stats.passCount > 0) {
      stats.successPassPercent = `${((stats.successfulPass / stats.passCount) * 100).toFixed(2)}%`;
      stats.missPassPercent = `${((stats.missPass / stats.passCount) * 100).toFixed(2)}%`;
      stats.forwardPassPercent = `${((stats.forwardPass / stats.passCount) * 100).toFixed(2)}%`;
      stats.backwardPassPercent = `${((stats.backwardPass / stats.passCount) * 100).toFixed(2)}%`;
    }
    playersMap.set(playerId, stats);
  });

  return playersMap;
}

export function createEmptyPlayerStats(
  jerseyNumber: string,
  playerName: string,
  role: string
): PlayerStats {
  return {
    jerseyNumber,
    playerName,
    role,
    passCount: 0,
    successfulPass: 0,
    successPassPercent: '0%',
    missPass: 0,
    missPassPercent: '0%',
    forwardPass: 0,
    forwardPassPercent: '0%',
    backwardPass: 0,
    backwardPassPercent: '0%',
    goals: 0,
    penaltyAreaPass: 0,
    penaltyAreaEntry: 0,
    runInBehind: 0,
    overlaps: 0,
    shotsAttempted: 0,
    shotsOnTarget: 0,
    saves: 0,
    defensiveErrors: 0,
    aerialDuelsWon: 0,
    aerialDuelsLost: 0,
    tackles: 0,
    clearance: 0,
    fouls: 0,
    foulsInFinalThird: 0,
    foulsInMiddleThird: 0,
    foulsInDefensiveThird: 0,
    foulWon: 0,
    fwFinalThird: 0,
    fwMiddleThird: 0,
    fwDefensiveThird: 0,
    cutBacks: 0,
    crosses: 0,
    freeKicks: 0,
    corners: 0,
    cornerFailed: 0,
    cornerSuccess: 0,
    throwIns: 0,
    tiFailed: 0,
    tiSuccess: 0,
    offside: 0,
    minutesPlayed: 0,
  };
}

// Fetch match events and aggregate for a specific match
export async function fetchAndAggregateMatchEvents(
  matchId: string,
  homeTeamId?: string,
  awayTeamId?: string
): Promise<{ homePlayers: PlayerStats[]; awayPlayers: PlayerStats[]; homeGoals: number; awayGoals: number }> {
  const { data: events, error } = await supabase
    .from('match_events')
    .select(`
      id,
      player_id,
      event_type,
      x,
      y,
      end_x,
      end_y,
      successful,
      shot_outcome,
      aerial_outcome,
      half,
      minute,
      seconds,
      player:players!match_events_player_id_fkey(id, name, jersey_number, role, team_id)
    `)
    .eq('match_id', matchId);

  if (error) throw error;
  if (!events || events.length === 0) {
    return { homePlayers: [], awayPlayers: [], homeGoals: 0, awayGoals: 0 };
  }

  // Get all events and separate by team
  const homeEvents = events.filter((e: any) => e.player?.team_id === homeTeamId);
  const awayEvents = events.filter((e: any) => e.player?.team_id === awayTeamId);

  const homePlayersMap = aggregateEventsToPlayerStats(homeEvents as MatchEvent[]);
  const awayPlayersMap = aggregateEventsToPlayerStats(awayEvents as MatchEvent[]);

  // Calculate goals from shot events with 'goal' outcome
  const homeGoals = events.filter(
    (e: any) => e.player?.team_id === homeTeamId && e.event_type === 'shot' && e.shot_outcome === 'goal'
  ).length;
  const awayGoals = events.filter(
    (e: any) => e.player?.team_id === awayTeamId && e.event_type === 'shot' && e.shot_outcome === 'goal'
  ).length;

  return {
    homePlayers: Array.from(homePlayersMap.values()),
    awayPlayers: Array.from(awayPlayersMap.values()),
    homeGoals,
    awayGoals,
  };
}

// Fetch and aggregate events for multiple matches for a specific team
export async function fetchAndAggregateEventsForTeam(
  matchIds: string[],
  teamId: string
): Promise<Map<string, PlayerStats>> {
  if (matchIds.length === 0) return new Map();

  const { data: events, error } = await supabase
    .from('match_events')
    .select(`
      id,
      player_id,
      event_type,
      x,
      y,
      end_x,
      end_y,
      successful,
      shot_outcome,
      aerial_outcome,
      half,
      minute,
      seconds,
      player:players!match_events_player_id_fkey(id, name, jersey_number, role, team_id)
    `)
    .in('match_id', matchIds);

  if (error) throw error;
  if (!events || events.length === 0) return new Map();

  // Filter to only team's events
  const teamEvents = events.filter((e: any) => e.player?.team_id === teamId);
  
  return aggregateEventsToPlayerStats(teamEvents as MatchEvent[]);
}

// Check if a match has events logged (to determine data source)
export async function hasMatchEvents(matchId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('match_events')
    .select('*', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (error) return false;
  return (count || 0) > 0;
}

// Check if a match has player_match_stats (legacy data)
export async function hasPlayerMatchStats(matchId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('player_match_stats')
    .select('*', { count: 'exact', head: true })
    .eq('match_id', matchId);

  if (error) return false;
  return (count || 0) > 0;
}
