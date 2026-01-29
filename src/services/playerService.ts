/**
 * Player Service
 * Centralized data access for player-related operations
 */
import { supabase } from '@/integrations/supabase/client';

export const playerService = {
    /**
     * Get all players for a team
     */
    getByTeamId: async (teamId: string, includeHidden: boolean = false) => {
        let query = supabase
            .from('players')
            .select('id, name, jersey_number, role, team_id, hidden')
            .eq('team_id', teamId)
            .order('jersey_number');

        if (!includeHidden) {
            query = query.or('hidden.is.null,hidden.eq.false');
        }

        return query;
    },

    /**
     * Get all players for a team by team slug
     */
    getByTeamSlug: async (teamSlug: string, includeHidden: boolean = false) => {
        // First get the team ID
        const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('slug', teamSlug)
            .single();

        if (!team) return { data: [], error: null };

        let query = supabase
            .from('players')
            .select('id, name, jersey_number, role, team_id, hidden')
            .eq('team_id', team.id)
            .order('jersey_number');

        if (!includeHidden) {
            query = query.or('hidden.is.null,hidden.eq.false');
        }

        return query;
    },

    /**
     * Get player match stats for a specific match
     */
    getMatchStats: async (matchId: string) => {
        return supabase
            .from('player_match_stats')
            .select(`
        *,
        player:players(id, jersey_number, name, role, team_id)
      `)
            .eq('match_id', matchId);
    },

    /**
     * Get player match stats for multiple matches
     */
    getMatchStatsForMatches: async (matchIds: string[]) => {
        return supabase
            .from('player_match_stats')
            .select(`
        *,
        player:players(id, jersey_number, name, role, team_id)
      `)
            .in('match_id', matchIds);
    },

    /**
     * Create a new player
     */
    create: async (player: {
        team_id: string;
        name: string;
        jersey_number: number;
        role?: string;
    }) => {
        return supabase
            .from('players')
            .insert(player)
            .select()
            .single();
    },

    /**
     * Update a player
     */
    update: async (playerId: string, updates: {
        name?: string;
        jersey_number?: number;
        role?: string;
        hidden?: boolean;
    }) => {
        return supabase
            .from('players')
            .update(updates)
            .eq('id', playerId);
    },

    /**
     * Delete a player
     */
    delete: async (playerId: string) => {
        return supabase
            .from('players')
            .delete()
            .eq('id', playerId);
    },
};
