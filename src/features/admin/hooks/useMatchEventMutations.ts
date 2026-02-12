/**
 * Match Event Mutations Hook
 * Extracts mutation logic from AdminMatchEvents for better code organization
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventPayload {
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
    corner_delivery_type?: string;
    target_player_id?: string;
    substitute_player_id?: string;
    phase_id?: string;
}

interface PhasePayload {
    match_id: string;
    half: number;
    phase_number: number;
    outcome: string;
    team_id?: string;
}

export function useMatchEventMutations(matchId: string | undefined) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Invalidate event queries helper
    const invalidateEventQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['match-events-half1', matchId] });
        queryClient.invalidateQueries({ queryKey: ['match-events-half2', matchId] });
        // Also invalidate match detail and player stats so aggregated data refreshes
        queryClient.invalidateQueries({ queryKey: ['match-detail', matchId] });
        queryClient.invalidateQueries({ queryKey: ['player-stats'] });
        queryClient.invalidateQueries({ queryKey: ['player-advanced-stats'] });
        queryClient.invalidateQueries({ queryKey: ['player-pass-events'] });
        queryClient.invalidateQueries({ queryKey: ['team-with-players'] });
    };

    // Save event mutation
    const saveEventMutation = useMutation({
        mutationFn: async (event: EventPayload) => {
            const { data, error } = await supabase
                .from('match_events')
                .insert(event)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: invalidateEventQueries,
    });

    // Delete event mutation
    const deleteEventMutation = useMutation({
        mutationFn: async (eventId: string) => {
            const { error } = await supabase
                .from('match_events')
                .delete()
                .eq('id', eventId);
            if (error) throw error;
        },
        onSuccess: invalidateEventQueries,
    });

    // Complete match mutation
    const completeMatchMutation = useMutation({
        mutationFn: async () => {
            // Get match details before completing for notification
            const { data: matchData } = await supabase
                .from('matches')
                .select(`
                    id, home_score, away_score,
                    home_team:teams!matches_home_team_id_fkey(name),
                    away_team:teams!matches_away_team_id_fkey(name)
                `)
                .eq('id', matchId)
                .single();

            const { error } = await supabase
                .from('matches')
                .update({ status: 'completed' })
                .eq('id', matchId);
            if (error) throw error;

            // Send push notifications (fire and forget)
            if (matchData) {
                supabase.functions.invoke('send-match-notification', {
                    body: {
                        match_id: matchId,
                        home_team: (matchData.home_team as any)?.name || 'Home',
                        away_team: (matchData.away_team as any)?.name || 'Away',
                        home_score: matchData.home_score,
                        away_score: matchData.away_score,
                    },
                }).catch(e => console.error('Push notification error:', e));
            }
        },
        onSuccess: () => {
            toast.success('Match marked as completed');
            navigate('/admin/matches');
        },
    });

    // Create phase mutation
    const createPhaseMutation = useMutation({
        mutationFn: async (phase: PhasePayload) => {
            const { data, error } = await supabase
                .from('attacking_phases')
                .insert(phase)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attacking-phases', matchId] });
        },
    });

    // Update phase mutation
    const updatePhaseMutation = useMutation({
        mutationFn: async ({ phaseId, outcome }: { phaseId: string; outcome: string }) => {
            const { error } = await supabase
                .from('attacking_phases')
                .update({ outcome })
                .eq('id', phaseId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attacking-phases', matchId] });
        },
    });

    // Delete phase mutation
    const deletePhaseMutation = useMutation({
        mutationFn: async (phaseId: string) => {
            // First, unlink all events from this phase
            await supabase
                .from('match_events')
                .update({ phase_id: null })
                .eq('phase_id', phaseId);

            // Then delete the phase
            const { error } = await supabase
                .from('attacking_phases')
                .delete()
                .eq('id', phaseId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attacking-phases', matchId] });
            invalidateEventQueries();
        },
    });

    // Update attack direction mutation
    const updateDirectionMutation = useMutation({
        mutationFn: async (homeAttacksLeft: boolean) => {
            const { error } = await supabase
                .from('matches')
                .update({ home_attacks_left: homeAttacksLeft })
                .eq('id', matchId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['match-for-events', matchId] });
            toast.success('Attack direction saved');
        },
        onError: () => {
            toast.error('Failed to save attack direction');
        },
    });

    return {
        saveEventMutation,
        deleteEventMutation,
        completeMatchMutation,
        createPhaseMutation,
        updatePhaseMutation,
        deletePhaseMutation,
        updateDirectionMutation,
        invalidateEventQueries,
    };
}

export type { EventPayload, PhasePayload };
