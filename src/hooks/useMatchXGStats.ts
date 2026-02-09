import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateShotXG, ShotEvent } from '@/utils/xGCalculation';

interface TeamXGResult {
    totalXG: number;
    shotCount: number;
    goals: number;
    xGPerShot: number;
}

interface MatchXGStats {
    home: TeamXGResult;
    away: TeamXGResult;
}

/**
 * Fetch xG stats for a specific match, grouped by team
 */
export function useMatchXGStats(matchId: string | undefined, homeTeamId?: string, awayTeamId?: string) {
    return useQuery({
        queryKey: ['matchXGStats', matchId, homeTeamId, awayTeamId],
        queryFn: async (): Promise<MatchXGStats | null> => {
            if (!matchId) return null;

            // Get all shot events for this match
            const { data: shotEvents, error } = await supabase
                .from('match_events')
                .select('x, y, shot_outcome, aerial_outcome, player_id, players!match_events_player_id_fkey(team_id)')
                .eq('match_id', matchId)
                .eq('event_type', 'shot');

            if (error) {
                console.error('Error fetching match shot events:', error);
                return null;
            }

            if (!shotEvents || shotEvents.length === 0) {
                return {
                    home: { totalXG: 0, shotCount: 0, goals: 0, xGPerShot: 0 },
                    away: { totalXG: 0, shotCount: 0, goals: 0, xGPerShot: 0 },
                };
            }

            // Calculate xG for each team
            let homeXG = 0, awayXG = 0;
            let homeShots = 0, awayShots = 0;
            let homeGoals = 0, awayGoals = 0;

            shotEvents.forEach((event: any) => {
                const shot: ShotEvent = {
                    x: event.x,
                    y: event.y,
                    shotOutcome: event.shot_outcome,
                    isHeader: event.aerial_outcome !== null,
                    isPenalty: event.shot_outcome === 'penalty_goal' || event.shot_outcome === 'penalty_miss',
                };

                const xgResult = calculateShotXG(shot);
                const isGoal = event.shot_outcome === 'goal' || event.shot_outcome === 'penalty_goal';
                const playerTeamId = event.players?.team_id;

                if (playerTeamId === homeTeamId) {
                    homeXG += xgResult.xG;
                    homeShots++;
                    if (isGoal) homeGoals++;
                } else if (playerTeamId === awayTeamId) {
                    awayXG += xgResult.xG;
                    awayShots++;
                    if (isGoal) awayGoals++;
                }
            });

            return {
                home: {
                    totalXG: Math.round(homeXG * 100) / 100,
                    shotCount: homeShots,
                    goals: homeGoals,
                    xGPerShot: homeShots > 0 ? Math.round((homeXG / homeShots) * 100) / 100 : 0,
                },
                away: {
                    totalXG: Math.round(awayXG * 100) / 100,
                    shotCount: awayShots,
                    goals: awayGoals,
                    xGPerShot: awayShots > 0 ? Math.round((awayXG / awayShots) * 100) / 100 : 0,
                },
            };
        },
        enabled: !!matchId,
    });
}
