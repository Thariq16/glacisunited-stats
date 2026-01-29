/**
 * Event Service
 * Centralized data access for match event operations
 */
import { supabase } from '@/integrations/supabase/client';

export const eventService = {
    /**
     * Get events for a match half
     */
    getByMatchAndHalf: async (matchId: string, half: 1 | 2) => {
        return supabase
            .from('match_events')
            .select(`
        *,
        player:players!match_events_player_id_fkey(id, name, jersey_number, team_id),
        substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number),
        target:players!match_events_target_player_id_fkey(id, name, jersey_number)
      `)
            .eq('match_id', matchId)
            .eq('half', half)
            .order('created_at', { ascending: true });
    },

    /**
     * Get all events for a match
     */
    getByMatch: async (matchId: string) => {
        return supabase
            .from('match_events')
            .select(`
        *,
        player:players!match_events_player_id_fkey(id, name, jersey_number, team_id, role),
        substitute:players!match_events_substitute_player_id_fkey(id, name, jersey_number),
        target:players!match_events_target_player_id_fkey(id, name, jersey_number)
      `)
            .eq('match_id', matchId)
            .order('created_at', { ascending: true });
    },

    /**
     * Create a new event
     */
    create: async (event: {
        match_id: string;
        player_id: string;
        event_type: string;
        half: number;
        minute: number;
        seconds?: number;
        x: number;
        y: number;
        end_x?: number;
        end_y?: number;
        successful: boolean;
        shot_outcome?: string;
        aerial_outcome?: string;
        target_player_id?: string;
        substitute_player_id?: string;
        phase_id?: string;
    }) => {
        return supabase
            .from('match_events')
            .insert(event)
            .select()
            .single();
    },

    /**
     * Delete an event
     */
    delete: async (eventId: string) => {
        return supabase
            .from('match_events')
            .delete()
            .eq('id', eventId);
    },

    /**
     * Bulk delete events
     */
    bulkDelete: async (eventIds: string[]) => {
        return supabase
            .from('match_events')
            .delete()
            .in('id', eventIds);
    },
};

export const phaseService = {
    /**
     * Get attacking phases for a match
     */
    getByMatch: async (matchId: string) => {
        return supabase
            .from('attacking_phases')
            .select('*')
            .eq('match_id', matchId)
            .order('phase_number');
    },

    /**
     * Create a new phase
     */
    create: async (phase: {
        match_id: string;
        half: number;
        phase_number: number;
        outcome: string;
        team_id?: string;
    }) => {
        return supabase
            .from('attacking_phases')
            .insert(phase)
            .select()
            .single();
    },

    /**
     * Update a phase
     */
    update: async (phaseId: string, updates: { outcome?: string }) => {
        return supabase
            .from('attacking_phases')
            .update(updates)
            .eq('id', phaseId);
    },

    /**
     * Delete a phase
     */
    delete: async (phaseId: string) => {
        return supabase
            .from('attacking_phases')
            .delete()
            .eq('id', phaseId);
    },
};

export const squadService = {
    /**
     * Get match squad
     */
    getByMatch: async (matchId: string) => {
        return supabase
            .from('match_squad')
            .select(`
        *,
        player:players!match_squad_player_id_fkey(id, name, jersey_number, role)
      `)
            .eq('match_id', matchId);
    },

    /**
     * Set match squad (bulk insert)
     */
    setSquad: async (matchId: string, squad: Array<{
        match_id: string;
        player_id: string;
        team_type: 'home' | 'away';
        status: 'starting' | 'substitute';
    }>) => {
        // First delete existing squad
        await supabase
            .from('match_squad')
            .delete()
            .eq('match_id', matchId);

        // Then insert new squad
        return supabase
            .from('match_squad')
            .insert(squad);
    },
};
