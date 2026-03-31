/**
 * Squad Selection Queries Hook
 * Extracts query logic from AdminSquadSelection for better code organization
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Player {
    id: string;
    name: string;
    jersey_number: number;
    role: string | null;
    team_id: string;
}

export function useSquadSelectionQueries(matchId: string | undefined) {
    // Fetch match details
    const matchQuery = useQuery({
        queryKey: ['match', matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('matches')
                .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, slug),
          away_team:teams!matches_away_team_id_fkey(id, name, slug)
        `)
                .eq('id', matchId)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!matchId,
    });

    const homeTeamId = matchQuery.data?.home_team_id;
    const awayTeamId = matchQuery.data?.away_team_id;

    // Fetch home team players (excluding hidden)
    const homePlayersQuery = useQuery({
        queryKey: ['players', homeTeamId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', homeTeamId)
                .eq('hidden', false)
                .order('jersey_number');

            if (error) throw error;
            return data as Player[];
        },
        enabled: !!homeTeamId,
    });

    // Fetch away team players (excluding hidden)
    const awayPlayersQuery = useQuery({
        queryKey: ['players', awayTeamId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', awayTeamId)
                .eq('hidden', false)
                .order('jersey_number');

            if (error) throw error;
            return data as Player[];
        },
        enabled: !!awayTeamId,
    });

    return {
        matchQuery,
        homePlayersQuery,
        awayPlayersQuery,
        // Convenience accessors
        match: matchQuery.data,
        homePlayers: homePlayersQuery.data,
        awayPlayers: awayPlayersQuery.data,
        // Loading states
        matchLoading: matchQuery.isLoading,
        homePlayersLoading: homePlayersQuery.isLoading,
        awayPlayersLoading: awayPlayersQuery.isLoading,
        isLoading: matchQuery.isLoading,
    };
}

export type { Player };
