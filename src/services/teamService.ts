/**
 * Team Service
 * Centralized data access for team-related operations
 */
import { supabase } from '@/integrations/supabase/client';

export const teamService = {
    /**
     * Get all teams, optionally filtered by organization
     */
    getAll: async (organizationId?: string) => {
        let query = supabase
            .from('teams')
            .select('id, name, slug, organization_id')
            .order('name');

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        return query;
    },

    /**
     * Get a team by slug
     */
    getBySlug: async (slug: string) => {
        return supabase
            .from('teams')
            .select('id, name, slug, organization_id')
            .eq('slug', slug)
            .single();
    },

    /**
     * Get a team by ID
     */
    getById: async (teamId: string) => {
        return supabase
            .from('teams')
            .select('id, name, slug, organization_id')
            .eq('id', teamId)
            .single();
    },

    /**
     * Create a new team
     */
    create: async (team: { name: string; slug: string; organization_id?: string }) => {
        return supabase
            .from('teams')
            .insert(team)
            .select()
            .single();
    },
};
