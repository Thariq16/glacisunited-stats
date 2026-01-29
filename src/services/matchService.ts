/**
 * Match Service
 * Centralized data access for match-related operations
 */
import { supabase } from '@/integrations/supabase/client';

// Match with teams - used for detail views
export const matchService = {
    /**
     * Get a single match by ID with team details
     */
    getById: async (matchId: string) => {
        return supabase
            .from('matches')
            .select(`
        id,
        match_date,
        home_score,
        away_score,
        venue,
        competition,
        status,
        home_team_id,
        away_team_id,
        home_attacks_left,
        home_team:teams!matches_home_team_id_fkey(id, name, slug),
        away_team:teams!matches_away_team_id_fkey(id, name, slug)
      `)
            .eq('id', matchId)
            .maybeSingle();
    },

    /**
     * Get all matches ordered by date (descending)
     */
    getAll: async () => {
        return supabase
            .from('matches')
            .select(`
        id,
        match_date,
        home_score,
        away_score,
        venue,
        competition,
        status,
        home_team:teams!matches_home_team_id_fkey(id, name, slug),
        away_team:teams!matches_away_team_id_fkey(id, name, slug)
      `)
            .order('match_date', { ascending: false });
    },

    /**
     * Get matches for a specific team
     */
    getByTeamSlug: async (teamSlug: string) => {
        // First get the team ID
        const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('slug', teamSlug)
            .single();

        if (!team) return { data: [], error: null };

        return supabase
            .from('matches')
            .select(`
        id,
        match_date,
        home_score,
        away_score,
        venue,
        competition,
        status,
        home_team_id,
        away_team_id,
        home_team:teams!matches_home_team_id_fkey(id, name, slug),
        away_team:teams!matches_away_team_id_fkey(id, name, slug)
      `)
            .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
            .order('match_date', { ascending: false });
    },

    /**
     * Update match status
     */
    updateStatus: async (matchId: string, status: string) => {
        return supabase
            .from('matches')
            .update({ status })
            .eq('id', matchId);
    },

    /**
     * Update match attack direction
     */
    updateAttackDirection: async (matchId: string, homeAttacksLeft: boolean) => {
        return supabase
            .from('matches')
            .update({ home_attacks_left: homeAttacksLeft })
            .eq('id', matchId);
    },

    /**
     * Create a new match
     */
    create: async (match: {
        home_team_id: string;
        away_team_id: string;
        match_date: string;
        venue?: string;
        competition?: string;
    }) => {
        return supabase
            .from('matches')
            .insert(match)
            .select()
            .single();
    },

    /**
     * Delete a match
     */
    delete: async (matchId: string) => {
        return supabase
            .from('matches')
            .delete()
            .eq('id', matchId);
    },
};
