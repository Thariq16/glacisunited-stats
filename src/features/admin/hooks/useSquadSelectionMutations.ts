/**
 * Squad Selection Mutations Hook
 * Extracts mutation logic from AdminSquadSelection for better code organization
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

interface SquadPlayer {
    id: string;
    name: string;
    jersey_number: number;
    role: string | null;
    team_id: string;
    status: 'starting' | 'substitute';
}

export function useSquadSelectionMutations(matchId: string | undefined) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { currentOrg } = useOrganization();

    // Create player mutation
    const createPlayerMutation = useMutation({
        mutationFn: async (data: { name: string; jersey_number: number; role: string | null; team_id: string }) => {
            const { data: newPlayer, error } = await supabase
                .from('players')
                .insert(data)
                .select()
                .single();

            if (error) throw error;
            return newPlayer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['players'] });
            toast.success('Player created successfully');
        },
        onError: (error) => {
            console.error('Error creating player:', error);
            toast.error('Failed to create player');
        },
    });

    // Create team mutation
    const createTeamMutation = useMutation({
        mutationFn: async (data: { name: string; slug: string }) => {
            const { data: newTeam, error } = await supabase
                .from('teams')
                .insert({ ...data, organization_id: currentOrg?.id })
                .select()
                .single();

            if (error) throw error;
            return newTeam;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            toast.success('Team created successfully');
        },
        onError: (error) => {
            console.error('Error creating team:', error);
            toast.error('Failed to create team');
        },
    });

    // Save squad to database mutation
    const saveSquadMutation = useMutation({
        mutationFn: async (squadData: { homeSquad: SquadPlayer[]; awaySquad: SquadPlayer[] }) => {
            // Delete existing squad entries for this match
            const { error: deleteError } = await supabase
                .from('match_squad')
                .delete()
                .eq('match_id', matchId);

            if (deleteError) throw deleteError;

            // Prepare all squad entries
            const entries = [
                ...squadData.homeSquad.map(p => ({
                    match_id: matchId!,
                    player_id: p.id,
                    team_type: 'home' as const,
                    status: p.status,
                })),
                ...squadData.awaySquad.map(p => ({
                    match_id: matchId!,
                    player_id: p.id,
                    team_type: 'away' as const,
                    status: p.status,
                })),
            ];

            if (entries.length > 0) {
                const { error: insertError } = await supabase
                    .from('match_squad')
                    .insert(entries);

                if (insertError) throw insertError;
            }
        },
    });

    // Handler to save and proceed
    const saveAndProceed = async (homeSquad: SquadPlayer[], awaySquad: SquadPlayer[]) => {
        try {
            await saveSquadMutation.mutateAsync({ homeSquad, awaySquad });

            // Also store in session storage for immediate access
            sessionStorage.setItem(`match-${matchId}-home-squad`, JSON.stringify(homeSquad));
            sessionStorage.setItem(`match-${matchId}-away-squad`, JSON.stringify(awaySquad));

            navigate(`/admin/match-events/${matchId}`);
        } catch (error) {
            console.error('Failed to save squad:', error);
            toast.error('Failed to save squad selection');
            throw error;
        }
    };

    return {
        createPlayerMutation,
        createTeamMutation,
        saveSquadMutation,
        saveAndProceed,
    };
}

export type { SquadPlayer };
