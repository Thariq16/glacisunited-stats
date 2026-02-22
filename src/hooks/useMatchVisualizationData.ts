import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseEvent {
  id: string;
  event_type: string;
  x: number;
  y: number;
  end_x: number | null;
  end_y: number | null;
  successful: boolean;
  shot_outcome: string | null;
  half: number;
  minute: number;
  seconds: number | null;
  player: {
    name: string;
    jersey_number: number;
  } | null;
}

export interface AttackingPhase {
  id: string;
  phase_number: number;
  half: number;
  outcome: string;
  team_id: string;
  events: PhaseEvent[];
}

export interface PassesByThird {
  half: number;
  defensive: number;
  middle: number;
  final: number;
}

export interface TeamPassesByThird {
  teamName: string;
  teamId: string;
  halves: PassesByThird[];
}

export interface TeamEventStats {
  cornerSuccess: number;
  cornerFailed: number;
  throwInSuccess: number;
  throwInFailed: number;
  aerialDuelsWon: number;
  aerialDuelsLost: number;
  backwardPass: number;
  incompletePass: number;
}

const createEmptyTeamEventStats = (): TeamEventStats => ({
  cornerSuccess: 0,
  cornerFailed: 0,
  throwInSuccess: 0,
  throwInFailed: 0,
  aerialDuelsWon: 0,
  aerialDuelsLost: 0,
  backwardPass: 0,
  incompletePass: 0,
});

// Zone thresholds based on X coordinate (0-100 scale)
const DEFENSIVE_THIRD_MAX = 33.33;
const MIDDLE_THIRD_MAX = 66.66;

function getZone(x: number): 'defensive' | 'middle' | 'final' {
  if (x < DEFENSIVE_THIRD_MAX) return 'defensive';
  if (x < MIDDLE_THIRD_MAX) return 'middle';
  return 'final';
}

// Events that count as passes
const PASS_EVENTS = ['pass', 'key_pass', 'assist', 'cross', 'penalty_area_pass', 'long_ball', 'through_ball', 'throw_in', 'cut_back'];

export function useMatchVisualizationData(
  matchId: string | undefined,
  homeTeamId: string | undefined,
  awayTeamId: string | undefined,
  homeTeamName: string,
  awayTeamName: string
) {
  return useQuery({
    queryKey: ['match-visualization', matchId],
    queryFn: async () => {
      if (!matchId) throw new Error('Match ID required');

      // Fetch all attacking phases for this match
      const { data: phases, error: phasesError } = await supabase
        .from('attacking_phases')
        .select('*')
        .eq('match_id', matchId)
        .order('half', { ascending: true })
        .order('phase_number', { ascending: true });

      if (phasesError) throw phasesError;

      // Fetch all events with phase_id to get events per phase
      const PAGE_SIZE = 1000;
      let allEvents: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: events, error: eventsError } = await supabase
          .from('match_events')
          .select(`
            id,
            event_type,
            x,
            y,
            end_x,
            end_y,
            goal_mouth_x,
            goal_mouth_y,
            successful,
            shot_outcome,
            half,
            minute,
            seconds,
            phase_id,
            player:players!match_events_player_id_fkey(name, jersey_number, team_id)
          `)
          .eq('match_id', matchId)
          .range(offset, offset + PAGE_SIZE - 1);

        if (eventsError) throw eventsError;

        if (events && events.length > 0) {
          allEvents = [...allEvents, ...events];
          offset += events.length;
          hasMore = events.length === PAGE_SIZE;
        } else {
          hasMore = false;
        }
      }

      // Group events by phase
      const eventsByPhase = new Map<string, PhaseEvent[]>();
      allEvents.forEach((event) => {
        if (event.phase_id) {
          const existing = eventsByPhase.get(event.phase_id) || [];
          existing.push({
            id: event.id,
            event_type: event.event_type,
            x: event.x,
            y: event.y,
            end_x: event.end_x,
            end_y: event.end_y,
            successful: event.successful,
            shot_outcome: event.shot_outcome,
            half: event.half,
            minute: event.minute,
            seconds: event.seconds,
            player: event.player,
          });
          eventsByPhase.set(event.phase_id, existing);
        }
      });

      // Build attacking phases with events
      const homePhases: AttackingPhase[] = [];
      const awayPhases: AttackingPhase[] = [];

      phases?.forEach((phase) => {
        const phaseWithEvents: AttackingPhase = {
          id: phase.id,
          phase_number: phase.phase_number,
          half: phase.half,
          outcome: phase.outcome,
          team_id: phase.team_id || '',
          events: eventsByPhase.get(phase.id) || [],
        };

        if (phase.team_id === homeTeamId) {
          homePhases.push(phaseWithEvents);
        } else if (phase.team_id === awayTeamId) {
          awayPhases.push(phaseWithEvents);
        }
      });

      // Calculate passes by third for each team, separated by half
      const homePassesByThird: PassesByThird[] = [
        { half: 1, defensive: 0, middle: 0, final: 0 },
        { half: 2, defensive: 0, middle: 0, final: 0 },
      ];
      const awayPassesByThird: PassesByThird[] = [
        { half: 1, defensive: 0, middle: 0, final: 0 },
        { half: 2, defensive: 0, middle: 0, final: 0 },
      ];

      // New Stats Containers
      const shots: any[] = [];
      const defensiveEvents: any[] = [];
      const possessionLossEvents: any[] = [];
      const teamPassEvents: any[] = [];

      // Match Event Stats (per-team)
      const homeEventStats = createEmptyTeamEventStats();
      const awayEventStats = createEmptyTeamEventStats();

      // Lane Stats (Left, Center, Right) for Attacking Threat
      const createLaneStats = () => ({
        left: { passes: 0, xg: 0 },
        center: { passes: 0, xg: 0 },
        right: { passes: 0, xg: 0 }
      });

      const homeLaneStats = {
        all: createLaneStats(),
        firstHalf: createLaneStats(),
        secondHalf: createLaneStats()
      };

      const awayLaneStats = {
        all: createLaneStats(),
        firstHalf: createLaneStats(),
        secondHalf: createLaneStats()
      };

      // Enhanced Set Piece Tracking
      const createSetPieceTracker = () => new Map<string, { name: string, number: number, corners: number, freeKicks: number }>();

      const trackers = {
        all: createSetPieceTracker(),
        firstHalf: createSetPieceTracker(),
        secondHalf: createSetPieceTracker()
      };

      const awayTrackers = {
        all: createSetPieceTracker(),
        firstHalf: createSetPieceTracker(),
        secondHalf: createSetPieceTracker()
      };

      allEvents.forEach((event) => {
        const teamId = event.player?.team_id;
        const isHome = teamId === homeTeamId;
        const halfKey = event.half === 1 ? 'firstHalf' : 'secondHalf';

        // 0. Match Event Stats aggregation
        const eventStats = isHome ? homeEventStats : awayEventStats;

        if (event.event_type === 'corner') {
          if (event.successful) eventStats.cornerSuccess++;
          else eventStats.cornerFailed++;
        }

        if (event.event_type === 'throw_in') {
          if (event.successful) eventStats.throwInSuccess++;
          else eventStats.throwInFailed++;
        }

        if (event.event_type === 'aerial_duel') {
          // Use aerial_outcome if available (from the full event query it may not be fetched,
          // so fall back to successful)
          const won = (event as any).aerial_outcome === 'won' || ((event as any).aerial_outcome == null && event.successful);
          if (won) eventStats.aerialDuelsWon++;
          else eventStats.aerialDuelsLost++;
        }

        if (PASS_EVENTS.includes(event.event_type)) {
          if (!event.successful) {
            eventStats.incompletePass++;
          } else if (event.end_x != null && event.x != null && event.end_x < event.x) {
            eventStats.backwardPass++;
          }
        }

        // 1. Process Shots
        if (event.event_type === 'shot' || event.event_type === 'penalty') {
          shots.push({
            ...event,
            team_id: teamId,
            shot_outcome: event.shot_outcome || (event.successful ? 'goal' : 'miss'),
            player: event.player
          });
        }

        // 2. Defensive Events
        if (['tackle', 'interception', 'clearance', 'block', 'aerial_duel', 'recovery'].includes(event.event_type)) {
          // Only count successful actions typically, but for heatmap show all? Let's show all
          defensiveEvents.push({
            id: event.id,
            type: event.event_type,
            x: event.x,
            y: event.y,
            teamId: teamId,
            playerId: event.player?.jersey_number,
            half: event.half
          });
        }

        // 3. Possession Loss (failed passes, failed dribbles, offsides, bad touch, etc.)
        const isPossessionLoss =
          (PASS_EVENTS.includes(event.event_type) && !event.successful) ||
          (event.event_type === 'dribble' && !event.successful) ||
          event.event_type === 'offside' ||
          event.event_type === 'bad_touch';

        if (isPossessionLoss) {
          possessionLossEvents.push({
            id: event.id,
            x: event.x,
            y: event.y,
            player: event.player?.name,
            teamId: teamId,
            half: event.half
          });
        }

        // 4. Attacking Threat (Lane Stats)
        // Count successful passes in lanes
        if (PASS_EVENTS.includes(event.event_type) && event.successful) {
          const lane = event.y < 33.3 ? 'left' : event.y > 66.6 ? 'right' : 'center';
          const stats = isHome ? homeLaneStats : awayLaneStats;

          // Update All
          stats.all[lane].passes++;
          // Update Half (safe check for halfKey)
          if (stats[halfKey]) stats[halfKey][lane].passes++;

          // Simple Threat/xG Mock based on proximity to goal (x > 70)
          if (event.x > 70) {
            const xgVal = 0.02; // Arbitrary small value for threat
            stats.all[lane].xg += xgVal;
            if (stats[halfKey]) stats[halfKey][lane].xg += xgVal;
          }
        }

        // 5. Player Set Pieces — track both teams
        if (['corner', 'free_kick'].includes(event.event_type) && event.player) {
          const pid = event.player.name + event.player.jersey_number;
          const teamTrackers = isHome ? trackers : awayTrackers;

          // Update All, and specific Half tracker
          [teamTrackers.all, teamTrackers[halfKey]].forEach(tracker => {
            const current = tracker.get(pid) || {
              name: event.player!.name,
              number: event.player!.jersey_number,
              corners: 0,
              freeKicks: 0
            };

            if (event.event_type === 'corner') current.corners++;
            else current.freeKicks++;

            tracker.set(pid, current);
          });
        }

        // 6. Passes by Third
        if (PASS_EVENTS.includes(event.event_type) && event.successful) {
          const zone = getZone(event.x); // 'defensive' | 'middle' | 'final'
          const passesByThird = isHome ? homePassesByThird : awayPassesByThird;
          const halfIndex = event.half - 1;

          if (passesByThird[halfIndex]) {
            passesByThird[halfIndex][zone]++;
          }
        }

        // 7. Collect pass events for directional pass maps
        if (PASS_EVENTS.includes(event.event_type)) {
          teamPassEvents.push({
            id: event.id,
            x: Number(event.x) || 0,
            y: Number(event.y) || 0,
            endX: event.end_x !== null ? Number(event.end_x) : null,
            endY: event.end_y !== null ? Number(event.end_y) : null,
            successful: event.successful,
            eventType: event.event_type,
            half: event.half,
            teamId: teamId,
          });
        }
      });

      // Helper to aggregate stats from a tracker
      const aggregateSetPieces = (tracker: Map<string, { name: string, number: number, corners: number, freeKicks: number }>) => {
        const playerStats = Array.from(tracker.values()).map((p, i) => ({
          playerId: `p-${i}`,
          playerName: p.name,
          jerseyNumber: p.number,
          cornersTaken: p.corners,
          shotsCreated: Math.floor(p.corners * 0.3), // Mock logic derived from earlier
          goalsCreated: Math.floor(p.corners * 0.1)  // Mock logic derived from earlier
        }));

        const teamStats = [
          {
            type: 'corner',
            total: playerStats.reduce((sum, p) => sum + p.cornersTaken, 0),
            goals: playerStats.reduce((sum, p) => sum + p.goalsCreated, 0),
            shots: playerStats.reduce((sum, p) => sum + p.shotsCreated, 0),
            conversionRate: 0
          },
          {
            type: 'free_kick',
            total: playerStats.reduce((sum, p) => sum + (Array.from(tracker.values()).find(v => v.name === p.playerName)?.freeKicks || 0), 0),
            goals: 0,
            shots: 0,
            conversionRate: 0
          }
        ].map(stat => ({
          ...stat,
          conversionRate: stat.total > 0 ? Math.round((stat.goals / stat.total) * 100) : 0
        }));

        return { playerStats, teamStats };
      };

      // Generate results for all periods
      const allSetPiece = aggregateSetPieces(trackers.all);
      const firstSetPiece = aggregateSetPieces(trackers.firstHalf);
      const secondSetPiece = aggregateSetPieces(trackers.secondHalf);

      const allAwaySetPiece = aggregateSetPieces(awayTrackers.all);
      const firstAwaySetPiece = aggregateSetPieces(awayTrackers.firstHalf);
      const secondAwaySetPiece = aggregateSetPieces(awayTrackers.secondHalf);

      // Format Derived Stats
      const formatLaneStats = (stats: any) => {
        const totalPasses = stats.left.passes + stats.center.passes + stats.right.passes;
        return [
          { lane: 'left', passCount: stats.left.passes, threatPercent: totalPasses ? Math.round((stats.left.passes / totalPasses) * 100) : 0, xg: 0 },
          { lane: 'center', passCount: stats.center.passes, threatPercent: totalPasses ? Math.round((stats.center.passes / totalPasses) * 100) : 0, xg: 0 },
          { lane: 'right', passCount: stats.right.passes, threatPercent: totalPasses ? Math.round((stats.right.passes / totalPasses) * 100) : 0, xg: 0 },
        ];
      };

      const attackingThreat = {
        all: formatLaneStats(homeLaneStats.all),
        firstHalf: formatLaneStats(homeLaneStats.firstHalf),
        secondHalf: formatLaneStats(homeLaneStats.secondHalf),
      };

      const opponentAttackingThreat = {
        all: formatLaneStats(awayLaneStats.all),
        firstHalf: formatLaneStats(awayLaneStats.firstHalf),
        secondHalf: formatLaneStats(awayLaneStats.secondHalf),
      };

      return {
        homePhases,
        awayPhases,
        homePassesByThird: {
          teamName: homeTeamName,
          teamId: homeTeamId || '',
          halves: homePassesByThird,
        } as TeamPassesByThird,
        awayPassesByThird: {
          teamName: awayTeamName,
          teamId: awayTeamId || '',
          halves: awayPassesByThird,
        } as TeamPassesByThird,
        shots,
        defensiveEvents,
        possessionLossEvents,
        teamPassEvents,
        attackingThreat,
        opponentAttackingThreat,
        setPieceData: {
          all: { team: allSetPiece.teamStats, players: allSetPiece.playerStats },
          firstHalf: { team: firstSetPiece.teamStats, players: firstSetPiece.playerStats },
          secondHalf: { team: secondSetPiece.teamStats, players: secondSetPiece.playerStats }
        },
        opponentSetPieceData: {
          all: { team: allAwaySetPiece.teamStats, players: allAwaySetPiece.playerStats },
          firstHalf: { team: firstAwaySetPiece.teamStats, players: firstAwaySetPiece.playerStats },
          secondHalf: { team: secondAwaySetPiece.teamStats, players: secondAwaySetPiece.playerStats }
        },
        // Match Event Stats
        matchEventStats: {
          home: homeEventStats,
          away: awayEventStats,
        },
        // Legacy/Fallback support
        playerSetPieceStats: allSetPiece.playerStats,
        setPieceStats: allSetPiece.teamStats
      };
    },
    enabled: !!matchId && !!homeTeamId && !!awayTeamId,
  });
}
