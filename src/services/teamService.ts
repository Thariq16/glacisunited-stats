/**
 * Team Service
 * Centralized data access for team-related operations
 */
import { supabase } from '@/integrations/supabase/client';

export const teamService = {
    /**
     * Get all teams
     */
    getAll: async () => {
        return supabase
            .from('teams')
            .select('id, name, slug')
            .order('name');
    },

    /**
     * Get a team by slug
     */
    getBySlug: async (slug: string) => {
        return supabase
            .from('teams')
            .select('id, name, slug')
            .eq('slug', slug)
            .single();
    },

    /**
     * Get a team by ID
     */
    getById: async (teamId: string) => {
        return supabase
            .from('teams')
            .select('id, name, slug')
            .eq('id', teamId)
            .single();
    },

    /**
     * Create a new team
     */
    create: async (team: { name: string; slug: string }) => {
        return supabase
            .from('teams')
            .insert(team)
            .select()
            .single();
    },
};
