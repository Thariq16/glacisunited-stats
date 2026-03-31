/**
 * Match Event Queries Hook
 * Extracts query logic from AdminMatchEvents for better code organization
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMatchEventQueries(matchId: string | undefined) {
    // Match and teams data
    const matchQuery = useQuery({
        queryKey: ['match-for-events', matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('matches')
                .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `)
                .eq('id', matchId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!matchId,
    });

    // Load existing phases from database
    const phasesQuery = useQuery({
        queryKey: ['attacking-phases', matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attacking_phases')
                .select('*')
                .eq('match_id', matchId)
                .order('phase_number');
            if (error) throw error;
            return data;
        },
        enabled: !!matchId,
    });

    // Load 1st half events from database
    const firstHalfEventsQuery = useQuery({
        queryKey: ['match-events-half1', matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('match_events')
                .select(`
          *,
          player:players!match_events_player_id_fkey(id, name, jersey_number, team_id),
          substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number),
          target:players!match_events_target_player_id_fkey(id, name, jersey_number)
        `)
                .eq('match_id', matchId)
                .eq('half', 1)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!matchId,
    });

    // Load 2nd half events from database
    const secondHalfEventsQuery = useQuery({
        queryKey: ['match-events-half2', matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('match_events')
                .select(`
          *,
          player:players!match_events_player_id_fkey(id, name, jersey_number, team_id),
          substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number),
          target:players!match_events_target_player_id_fkey(id, name, jersey_number)
        `)
                .eq('match_id', matchId)
                .eq('half', 2)
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data;
        },
        enabled: !!matchId,
    });

    // Fetch squad from database
    const squadQuery = useQuery({
        queryKey: ['match-squad', matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('match_squad')
                .select(`
          *,
          player:players!match_squad_player_id_fkey(id, name, jersey_number, role)
        `)
                .eq('match_id', matchId);
            if (error) throw error;
            return data;
        },
        enabled: !!matchId,
    });

    return {
        matchQuery,
        phasesQuery,
        firstHalfEventsQuery,
        secondHalfEventsQuery,
        squadQuery,
        // Convenience accessors
        matchData: matchQuery.data,
        savedPhases: phasesQuery.data ?? [],
        firstHalfEvents: firstHalfEventsQuery.data ?? [],
        secondHalfEvents: secondHalfEventsQuery.data ?? [],
        dbSquad: squadQuery.data,
        // Loading states
        isLoading: matchQuery.isLoading || phasesQuery.isLoading ||
            firstHalfEventsQuery.isLoading || secondHalfEventsQuery.isLoading,
        matchLoading: matchQuery.isLoading,
        phasesLoading: phasesQuery.isLoading,
        eventsLoading: firstHalfEventsQuery.isLoading || secondHalfEventsQuery.isLoading,
        squadLoading: squadQuery.isLoading,
    };
}
