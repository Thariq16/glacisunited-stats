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

      allEvents.forEach((event) => {
        if (!PASS_EVENTS.includes(event.event_type)) return;
        
        const zone = getZone(event.x);
        const halfIndex = event.half === 1 ? 0 : 1;
        const teamId = event.player?.team_id;

        if (teamId === homeTeamId) {
          homePassesByThird[halfIndex][zone]++;
        } else if (teamId === awayTeamId) {
          awayPassesByThird[halfIndex][zone]++;
        }
      });

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
      };
    },
    enabled: !!matchId && !!homeTeamId && !!awayTeamId,
  });
}
