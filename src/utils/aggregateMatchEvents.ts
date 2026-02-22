import { PlayerStats } from './parseCSV';
import { supabase } from '@/integrations/supabase/client';

interface MatchEvent {
  id: string;
  match_id?: string;
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
  substitute_player_id?: string;
  player?: {
    id: string;
    name: string;
    jersey_number: number;
    role?: string;
    team_id: string;
  };
  substitute?: {
    id: string;
    name: string;
    jersey_number: number;
    role?: string;
    team_id?: string;
  };
}

// Zone thresholds based on X coordinate (0-100 scale)
const DEFENSIVE_THIRD_MAX = 33.33;
const MIDDLE_THIRD_MAX = 66.66;
const PENALTY_AREA_X_START = 83; // Approximate penalty area start

/**
 * Determine which third of the pitch an event is in, relative to the player's team.
 * @param x - Raw X coordinate (0-100)
 * @param attacksRight - Whether the player's team attacks toward high X in this half.
 *   If true:  high X = final third (opponent's end), low X = defensive third
 *   If false: low X = final third, high X = defensive third
 */
function getZone(x: number, attacksRight: boolean): 'defensive' | 'middle' | 'final' {
  if (attacksRight) {
    // Standard: team attacks right, high X = final third
    if (x < DEFENSIVE_THIRD_MAX) return 'defensive';
    if (x < MIDDLE_THIRD_MAX) return 'middle';
    return 'final';
  } else {
    // Inverted: team attacks left, low X = final third
    if (x > MIDDLE_THIRD_MAX) return 'defensive';
    if (x > DEFENSIVE_THIRD_MAX) return 'middle';
    return 'final';
  }
}

/**
 * Determine if a team attacks right (toward high X) for a given half.
 * @param half - 1 or 2
 * @param isHomeTeam - Whether the player belongs to the home team
 * @param homeAttacksLeft - The match's home_attacks_left setting for the 1st half.
 *   If null/undefined, defaults to true (home attacks left in H1).
 */
function doesTeamAttackRight(half: number, isHomeTeam: boolean, homeAttacksLeft: boolean | null): boolean {
  // Default: home attacks left in H1 (i.e., home attacks right = false in H1)
  const hal = homeAttacksLeft ?? true;

  if (isHomeTeam) {
    // H1: home attacks left => attacksRight = false
    // H2: direction flips => attacksRight = true
    return half === 1 ? !hal : hal;
  } else {
    // Away is opposite of home
    // H1: if home attacks left, away attacks right
    return half === 1 ? hal : !hal;
  }
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
  teamIdFilter?: string,
  totalMatchMinutes: number = 90,
  homeAttacksLeft: boolean | null = true,
  isHomeTeam: boolean = true
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
        player.role || '',
      ));
      // Assume started => full match time by default, corrected by substitutions
      const s = playersMap.get(playerId)!;
      s.minutesPlayed = totalMatchMinutes;
      playersMap.set(playerId, s);
    }

    // For substitution events, also track the substitute player coming ON
    if (event.event_type === 'substitution' && event.substitute_player_id && event.substitute) {
      const subPlayerId = event.substitute_player_id;
      const subPlayer = event.substitute;

      // Initialize substitute player if not exists
      if (!playersMap.has(subPlayerId)) {
        playersMap.set(subPlayerId, createEmptyPlayerStats(
          String(subPlayer.jersey_number),
          subPlayer.name,
          subPlayer.role || ''
        ));
      }

      // Increment substitute appearances for the player coming ON
      const subStats = playersMap.get(subPlayerId)!;
      subStats.substituteAppearances++;
      playersMap.set(subPlayerId, subStats);
    }

    const stats = playersMap.get(playerId)!;
    const eventType = event.event_type;
    const successful = event.successful;
    const x = event.x;
    const endX = event.end_x;
    const endY = event.end_y;

    // Determine attack direction for this event based on half
    const attacksRight = doesTeamAttackRight(event.half, isHomeTeam, homeAttacksLeft);
    const zone = getZone(x, attacksRight);

    // Determine forward/backward pass direction relative to attack direction
    const isForwardPass = (endX !== undefined) && (attacksRight ? endX > x : endX < x);
    const isBackwardPass = (endX !== undefined) && (attacksRight ? endX < x : endX > x);

    // Process event based on type
    switch (eventType) {
      case 'pass':
      case 'key_pass':
      case 'assist':
      case 'long_ball':
      case 'through_ball':
        stats.passCount++;
        if (zone === 'final') stats.passesFinalThird++;
        else if (zone === 'middle') stats.passesMiddleThird++;
        else stats.passesDefensiveThird++;
        if (successful) {
          stats.successfulPass++;
          if (isForwardPass) stats.forwardPass++;
          else if (isBackwardPass) stats.backwardPass++;
        } else {
          stats.missPass++;
        }
        break;

      case 'cross':
        stats.crosses++;
        stats.passCount++;
        if (zone === 'final') stats.passesFinalThird++;
        else if (zone === 'middle') stats.passesMiddleThird++;
        else stats.passesDefensiveThird++;
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
        stats.passesFinalThird++; // PA passes are always in the final third
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
        if (zone === 'final') stats.shotsFinalThird++;
        else if (zone === 'middle') stats.shotsMiddleThird++;
        else stats.shotsDefensiveThird++;
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
        stats.shotsFinalThird++;
        break;

      case 'tackle':
      case 'tackle_won':
        stats.tackles++;
        if (zone === 'final') stats.tacklesFinalThird++;
        else if (zone === 'middle') stats.tacklesMiddleThird++;
        else stats.tacklesDefensiveThird++;
        break;

      case 'clearance':
        stats.clearance++;
        if (zone === 'final') stats.clearancesFinalThird++;
        else if (zone === 'middle') stats.clearancesMiddleThird++;
        else stats.clearancesDefensiveThird++;
        break;

      case 'save':
        stats.saves++;
        break;

      case 'foul_committed':
        stats.fouls++;
        if (zone === 'final') stats.foulsInFinalThird++;
        else if (zone === 'middle') stats.foulsInMiddleThird++;
        else stats.foulsInDefensiveThird++;
        break;

      case 'foul_won':
        stats.foulWon++;
        if (zone === 'final') stats.fwFinalThird++;
        else if (zone === 'middle') stats.fwMiddleThird++;
        else stats.fwDefensiveThird++;
        break;

      case 'aerial_duel':
        if (event.aerial_outcome === 'won') {
          stats.aerialDuelsWon++;
        } else {
          stats.aerialDuelsLost++;
        }
        if (zone === 'final') stats.aerialsFinalThird++;
        else if (zone === 'middle') stats.aerialsMiddleThird++;
        else stats.aerialsDefensiveThird++;
        break;

      case 'corner':
        stats.corners++;
        if (successful) stats.cornerSuccess++;
        else stats.cornerFailed++;
        break;

      case 'throw_in':
        stats.throwIns++;
        stats.passCount++;
        if (zone === 'final') stats.passesFinalThird++;
        else if (zone === 'middle') stats.passesMiddleThird++;
        else stats.passesDefensiveThird++;
        if (successful) {
          stats.tiSuccess++;
          stats.successfulPass++;
          if (isForwardPass) stats.forwardPass++;
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

      case 'yellow_card':
        stats.yellowCards++;
        break;

      case 'red_card':
        stats.redCards++;
        break;

      case 'block':
        stats.blocks++;
        if (zone === 'final') stats.blocksFinalThird++;
        else if (zone === 'middle') stats.blocksMiddleThird++;
        else stats.blocksDefensiveThird++;
        break;

      case 'interception':
        stats.interceptions++;
        if (zone === 'final') stats.interceptionsFinalThird++;
        else if (zone === 'middle') stats.interceptionsMiddleThird++;
        else stats.interceptionsDefensiveThird++;
        break;

      case 'bad_touch':
        stats.badTouches++;
        if (zone === 'final') stats.badTouchesFinalThird++;
        else if (zone === 'middle') stats.badTouchesMiddleThird++;
        else stats.badTouchesFinalThird++;
        break;

      default:
        break;

      case 'substitution':
        // Player OFF (current player) - played until this minute
        stats.minutesPlayed = event.minute;

        // Player ON (substitute) - played from this minute until end
        if (event.substitute_player_id) {
          const subStats = playersMap.get(event.substitute_player_id);
          if (subStats) {
            subStats.minutesPlayed = totalMatchMinutes - event.minute;
            subStats.minutesPlayed = 90 - event.minute;
            playersMap.set(event.substitute_player_id, subStats);
          }
        }
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
    substituteAppearances: 0,
    yellowCards: 0,
    redCards: 0,
    blocks: 0,
    interceptions: 0,
    badTouches: 0,
    tacklesDefensiveThird: 0,
    tacklesMiddleThird: 0,
    tacklesFinalThird: 0,
    passesDefensiveThird: 0,
    passesMiddleThird: 0,
    passesFinalThird: 0,
    clearancesDefensiveThird: 0,
    clearancesMiddleThird: 0,
    clearancesFinalThird: 0,
    blocksDefensiveThird: 0,
    blocksMiddleThird: 0,
    blocksFinalThird: 0,
    interceptionsDefensiveThird: 0,
    interceptionsMiddleThird: 0,
    interceptionsFinalThird: 0,
    shotsDefensiveThird: 0,
    shotsMiddleThird: 0,
    shotsFinalThird: 0,
    aerialsDefensiveThird: 0,
    aerialsMiddleThird: 0,
    aerialsFinalThird: 0,
    badTouchesDefensiveThird: 0,
    badTouchesMiddleThird: 0,
    badTouchesFinalThird: 0,
  };
}

// Helper to fetch all events with pagination (Supabase limits to 1000 per request)
async function fetchAllMatchEvents(matchId: string): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let allEvents: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
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
        substitute_player_id,
        player:players!match_events_player_id_fkey(id, name, jersey_number, role, team_id),
        substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number, role, team_id)
      `)
      .eq('match_id', matchId)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    if (events && events.length > 0) {
      allEvents = [...allEvents, ...events];
      offset += events.length;
      hasMore = events.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allEvents;
}

// Fetch match events and aggregate for a specific match
export async function fetchAndAggregateMatchEvents(
  matchId: string,
  homeTeamId?: string,
  awayTeamId?: string
): Promise<{ homePlayers: PlayerStats[]; awayPlayers: PlayerStats[]; homeGoals: number; awayGoals: number }> {
  // Fetch events and match playing time in parallel
  const [events, matchTimeResult] = await Promise.all([
    fetchAllMatchEvents(matchId),
    supabase
      .from('matches')
      .select('h1_playing_time_seconds, h2_playing_time_seconds, h1_injury_time_seconds, h2_injury_time_seconds, home_attacks_left')
      .eq('id', matchId)
      .maybeSingle()
  ]);

  if (!events || events.length === 0) {
    return { homePlayers: [], awayPlayers: [], homeGoals: 0, awayGoals: 0 };
  }

  // Calculate total match minutes from actual playing time + injury time
  const h1Seconds = matchTimeResult.data?.h1_playing_time_seconds ?? 2700;
  const h2Seconds = matchTimeResult.data?.h2_playing_time_seconds ?? 2700;
  const h1InjurySeconds = matchTimeResult.data?.h1_injury_time_seconds ?? 0;
  const h2InjurySeconds = matchTimeResult.data?.h2_injury_time_seconds ?? 0;
  const totalMatchMinutes = Math.round((h1Seconds + h1InjurySeconds + h2Seconds + h2InjurySeconds) / 60);
  const homeAttacksLeft = matchTimeResult.data?.home_attacks_left ?? true;

  // Get all events and separate by team
  const homeEvents = events.filter((e: any) => e.player?.team_id === homeTeamId);
  const awayEvents = events.filter((e: any) => e.player?.team_id === awayTeamId);

  const homePlayersMap = aggregateEventsToPlayerStats(homeEvents as MatchEvent[], undefined, totalMatchMinutes, homeAttacksLeft, true);
  const awayPlayersMap = aggregateEventsToPlayerStats(awayEvents as MatchEvent[], undefined, totalMatchMinutes, homeAttacksLeft, false);

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

// Helper to fetch all events for multiple matches with pagination
async function fetchAllEventsForMatches(matchIds: string[]): Promise<any[]> {
  const PAGE_SIZE = 1000;
  let allEvents: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: events, error } = await supabase
      .from('match_events')
      .select(`
        id,
        match_id,
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
        substitute_player_id,
        player:players!match_events_player_id_fkey(id, name, jersey_number, role, team_id),
        substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number, role, team_id)
      `)
      .in('match_id', matchIds)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;

    if (events && events.length > 0) {
      allEvents = [...allEvents, ...events];
      offset += events.length;
      hasMore = events.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allEvents;
}

// Fetch and aggregate events for multiple matches for a specific team
export async function fetchAndAggregateEventsForTeam(
  matchIds: string[],
  teamId: string
): Promise<Map<string, PlayerStats>> {
  if (matchIds.length === 0) return new Map();

  // Fetch events and match directions in parallel
  const [events, matchDirections] = await Promise.all([
    fetchAllEventsForMatches(matchIds),
    supabase
      .from('matches')
      .select('id, home_team_id, home_attacks_left')
      .in('id', matchIds)
  ]);

  if (!events || events.length === 0) return new Map();

  // Build direction lookup: matchId -> { homeAttacksLeft, isHomeTeam }
  const directionMap = new Map<string, { homeAttacksLeft: boolean | null; isHomeTeam: boolean }>();
  matchDirections.data?.forEach((m: any) => {
    directionMap.set(m.id, {
      homeAttacksLeft: m.home_attacks_left ?? true,
      isHomeTeam: m.home_team_id === teamId,
    });
  });

  // Filter to only team's events
  const teamEvents = events.filter((e: any) => e.player?.team_id === teamId);

  // Process events per match to use correct direction, then merge
  const eventsByMatch = new Map<string, MatchEvent[]>();
  teamEvents.forEach((e: any) => {
    const mid = e.match_id;
    if (!eventsByMatch.has(mid)) eventsByMatch.set(mid, []);
    eventsByMatch.get(mid)!.push(e as MatchEvent);
  });

  // Aggregate per-match with correct direction, then merge all players
  const mergedPlayers = new Map<string, PlayerStats>();

  eventsByMatch.forEach((matchEvents, matchId) => {
    const dir = directionMap.get(matchId) || { homeAttacksLeft: true, isHomeTeam: true };
    const matchPlayersMap = aggregateEventsToPlayerStats(
      matchEvents, undefined, 90, dir.homeAttacksLeft, dir.isHomeTeam
    );

    // Merge into overall map
    matchPlayersMap.forEach((stats, playerId) => {
      if (!mergedPlayers.has(playerId)) {
        mergedPlayers.set(playerId, { ...stats });
      } else {
        const existing = mergedPlayers.get(playerId)!;
        // Sum all numeric fields
        Object.keys(stats).forEach((key) => {
          if (typeof (stats as any)[key] === 'number') {
            (existing as any)[key] = ((existing as any)[key] || 0) + ((stats as any)[key] || 0);
          }
        });
        // Recalculate percentages
        if (existing.passCount > 0) {
          existing.successPassPercent = `${((existing.successfulPass / existing.passCount) * 100).toFixed(2)}%`;
          existing.missPassPercent = `${((existing.missPass / existing.passCount) * 100).toFixed(2)}%`;
          existing.forwardPassPercent = `${((existing.forwardPass / existing.passCount) * 100).toFixed(2)}%`;
          existing.backwardPassPercent = `${((existing.backwardPass / existing.passCount) * 100).toFixed(2)}%`;
        }
        mergedPlayers.set(playerId, existing);
      }
    });
  });

  return mergedPlayers;
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
