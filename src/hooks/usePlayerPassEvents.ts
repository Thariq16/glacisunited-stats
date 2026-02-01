import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PassEvent {
  id: string;
  x: number;
  y: number;
  endX: number | null;
  endY: number | null;
  successful: boolean;
  eventType: string;
  half: number;
}

export interface HalfPassData {
  half: number;
  passes: PassEvent[];
  totalPasses: number;
  successfulPasses: number;
  unsuccessfulPasses: number;
  forwardPasses: number;
  backwardPasses: number;
  passesDefensiveThird: number;
  passesMiddleThird: number;
  passesFinalThird: number;
}

export interface PlayerPassData {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  passes: PassEvent[];
  totalPasses: number;
  successfulPasses: number;
  unsuccessfulPasses: number;
  forwardPasses: number;
  backwardPasses: number;
  passesDefensiveThird: number;
  passesMiddleThird: number;
  passesFinalThird: number;
  byHalf: HalfPassData[];
}

const PASS_EVENT_TYPES = ['pass', 'key_pass', 'assist', 'cross', 'cutback', 'penalty_area_pass', 'throw_in', 'corner', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart'];

export function usePlayerPassEvents(teamSlug: string, matchFilter: 'last1' | 'last3' | 'all' = 'last1') {
  return useQuery({
    queryKey: ['player-pass-events', teamSlug, matchFilter],
    queryFn: async (): Promise<PlayerPassData[]> => {
      // Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('slug', teamSlug)
        .single();

      if (!team) throw new Error('Team not found');

      // Get matches for the team based on filter
      const matchesQuery = supabase
        .from('matches')
        .select('id, match_date')
        .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
        .eq('status', 'completed')
        .order('match_date', { ascending: false });

      if (matchFilter === 'last1') {
        matchesQuery.limit(1);
      } else if (matchFilter === 'last3') {
        matchesQuery.limit(3);
      }

      const { data: matches } = await matchesQuery;
      if (!matches || matches.length === 0) return [];

      const matchIds = matches.map(m => m.id);

      // Fetch all pass events for these matches with pagination
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
            half,
            player:players!match_events_player_id_fkey(id, name, jersey_number, team_id)
          `)
          .in('match_id', matchIds)
          .in('event_type', PASS_EVENT_TYPES)
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

      // Filter to team's players and group by player
      const playerPassMap = new Map<string, PlayerPassData>();

      allEvents.forEach((event) => {
        const player = event.player as any;
        if (!player || player.team_id !== team.id) return;

        if (!playerPassMap.has(player.id)) {
          playerPassMap.set(player.id, {
            playerId: player.id,
            playerName: player.name,
            jerseyNumber: player.jersey_number,
            passes: [],
            totalPasses: 0,
            successfulPasses: 0,
            unsuccessfulPasses: 0,
            forwardPasses: 0,
            backwardPasses: 0,
            passesDefensiveThird: 0,
            passesMiddleThird: 0,
            passesFinalThird: 0,
            byHalf: [
              { half: 1, passes: [], totalPasses: 0, successfulPasses: 0, unsuccessfulPasses: 0, forwardPasses: 0, backwardPasses: 0, passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0 },
              { half: 2, passes: [], totalPasses: 0, successfulPasses: 0, unsuccessfulPasses: 0, forwardPasses: 0, backwardPasses: 0, passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0 },
            ],
          });
        }

        const playerData = playerPassMap.get(player.id)!;
        const x = Number(event.x) || 0;
        const y = Number(event.y) || 0;
        const endX = event.end_x !== null ? Number(event.end_x) : null;
        const endY = event.end_y !== null ? Number(event.end_y) : null;
        const half = event.half || 1;
        const halfIndex = half === 1 ? 0 : 1;

        const passEvent: PassEvent = {
          id: event.id,
          x,
          y,
          endX,
          endY,
          successful: event.successful,
          eventType: event.event_type,
          half,
        };

        playerData.passes.push(passEvent);
        playerData.byHalf[halfIndex].passes.push(passEvent);

        playerData.totalPasses++;
        playerData.byHalf[halfIndex].totalPasses++;

        if (event.successful) {
          playerData.successfulPasses++;
          playerData.byHalf[halfIndex].successfulPasses++;
        } else {
          playerData.unsuccessfulPasses++;
          playerData.byHalf[halfIndex].unsuccessfulPasses++;
        }

        // Determine forward/backward based on end position
        if (endX !== null) {
          if (endX > x) {
            playerData.forwardPasses++;
            playerData.byHalf[halfIndex].forwardPasses++;
          } else if (endX < x) {
            playerData.backwardPasses++;
            playerData.byHalf[halfIndex].backwardPasses++;
          }
        }

        // Determine which third the pass originated from (0-33: defensive, 34-66: middle, 67-100: final)
        if (x <= 33) {
          playerData.passesDefensiveThird++;
          playerData.byHalf[halfIndex].passesDefensiveThird++;
        } else if (x <= 66) {
          playerData.passesMiddleThird++;
          playerData.byHalf[halfIndex].passesMiddleThird++;
        } else {
          playerData.passesFinalThird++;
          playerData.byHalf[halfIndex].passesFinalThird++;
        }
      });

      return Array.from(playerPassMap.values()).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
    },
  });
}

// Hook to fetch pass events for a single player by name
export function useSinglePlayerPassEvents(
  teamSlug: string,
  playerName: string | undefined,
  matchFilter: 'last1' | 'last3' | 'all' | string = 'last1'
) {
  return useQuery({
    queryKey: ['single-player-pass-events', teamSlug, playerName, matchFilter],
    enabled: !!playerName,
    queryFn: async (): Promise<PlayerPassData | null> => {
      if (!playerName) return null;

      const decodedName = decodeURIComponent(playerName);

      // Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id, name')
        .eq('slug', teamSlug)
        .single();

      if (!team) throw new Error('Team not found');

      // Get player
      const { data: playerData } = await supabase
        .from('players')
        .select('id, name, jersey_number')
        .eq('team_id', team.id)
        .eq('name', decodedName)
        .single();

      if (!playerData) return null;

      // Determine match IDs
      let matchIds: string[] = [];
      const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);

      if (isSpecificMatch) {
        matchIds = [matchFilter];
      } else {
        const matchesQuery = supabase
          .from('matches')
          .select('id, match_date')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .eq('status', 'completed')
          .order('match_date', { ascending: false });

        if (matchFilter === 'last1') {
          matchesQuery.limit(1);
        } else if (matchFilter === 'last3') {
          matchesQuery.limit(3);
        }

        const { data: matches } = await matchesQuery;
        if (!matches || matches.length === 0) return null;
        matchIds = matches.map(m => m.id);
      }

      // Fetch pass events for this player with pagination
      const PAGE_SIZE = 1000;
      let allEvents: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: events, error } = await supabase
          .from('match_events')
          .select(`
            id,
            event_type,
            x,
            y,
            end_x,
            end_y,
            successful,
            half
          `)
          .eq('player_id', playerData.id)
          .in('match_id', matchIds)
          .in('event_type', PASS_EVENT_TYPES)
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

      // Build the pass data
      const result: PlayerPassData = {
        playerId: playerData.id,
        playerName: playerData.name,
        jerseyNumber: playerData.jersey_number,
        passes: [],
        totalPasses: 0,
        successfulPasses: 0,
        unsuccessfulPasses: 0,
        forwardPasses: 0,
        backwardPasses: 0,
        passesDefensiveThird: 0,
        passesMiddleThird: 0,
        passesFinalThird: 0,
        byHalf: [
          { half: 1, passes: [], totalPasses: 0, successfulPasses: 0, unsuccessfulPasses: 0, forwardPasses: 0, backwardPasses: 0, passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0 },
          { half: 2, passes: [], totalPasses: 0, successfulPasses: 0, unsuccessfulPasses: 0, forwardPasses: 0, backwardPasses: 0, passesDefensiveThird: 0, passesMiddleThird: 0, passesFinalThird: 0 },
        ],
      };

      allEvents.forEach((event) => {
        const x = Number(event.x) || 0;
        const y = Number(event.y) || 0;
        const endX = event.end_x !== null ? Number(event.end_x) : null;
        const endY = event.end_y !== null ? Number(event.end_y) : null;
        const half = event.half || 1;
        const halfIndex = half === 1 ? 0 : 1;

        const passEvent: PassEvent = {
          id: event.id,
          x,
          y,
          endX,
          endY,
          successful: event.successful,
          eventType: event.event_type,
          half,
        };

        result.passes.push(passEvent);
        result.byHalf[halfIndex].passes.push(passEvent);

        result.totalPasses++;
        result.byHalf[halfIndex].totalPasses++;

        if (event.successful) {
          result.successfulPasses++;
          result.byHalf[halfIndex].successfulPasses++;
        } else {
          result.unsuccessfulPasses++;
          result.byHalf[halfIndex].unsuccessfulPasses++;
        }

        if (endX !== null) {
          if (endX > x) {
            result.forwardPasses++;
            result.byHalf[halfIndex].forwardPasses++;
          } else if (endX < x) {
            result.backwardPasses++;
            result.byHalf[halfIndex].backwardPasses++;
          }
        }

        if (x <= 33) {
          result.passesDefensiveThird++;
          result.byHalf[halfIndex].passesDefensiveThird++;
        } else if (x <= 66) {
          result.passesMiddleThird++;
          result.byHalf[halfIndex].passesMiddleThird++;
        } else {
          result.passesFinalThird++;
          result.byHalf[halfIndex].passesFinalThird++;
        }
      });

      return result;
    },
  });
}
