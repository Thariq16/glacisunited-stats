import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculatePlayerXGStats, PlayerXGStats, ShotEvent } from '@/utils/xGCalculation';

interface UsePlayerXGStatsOptions {
  playerId?: string;
  playerName?: string;
  teamSlug?: string;
  matchIds?: string[];
}

/**
 * Fetch shot events and calculate xG stats for a player
 */
export function usePlayerXGStats({ playerId, playerName, teamSlug, matchIds }: UsePlayerXGStatsOptions) {
  return useQuery({
    queryKey: ['playerXGStats', playerId, playerName, teamSlug, matchIds],
    queryFn: async (): Promise<PlayerXGStats | null> => {
      // First, get the player ID if we only have name and team
      let resolvedPlayerId = playerId;
      
      if (!resolvedPlayerId && playerName && teamSlug) {
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .eq('slug', teamSlug)
          .single();
        
        if (!team) return null;
        
        const { data: player } = await supabase
          .from('players')
          .select('id')
          .eq('team_id', team.id)
          .eq('name', playerName)
          .single();
        
        if (!player) return null;
        resolvedPlayerId = player.id;
      }
      
      if (!resolvedPlayerId) return null;
      
      // Build query for shot events
      let query = supabase
        .from('match_events')
        .select('x, y, shot_outcome, aerial_outcome, event_type')
        .eq('player_id', resolvedPlayerId)
        .eq('event_type', 'shot');
      
      // Filter by match IDs if provided
      if (matchIds && matchIds.length > 0) {
        query = query.in('match_id', matchIds);
      }
      
      const { data: shotEvents, error } = await query;
      
      if (error) {
        console.error('Error fetching shot events:', error);
        return null;
      }
      
      if (!shotEvents || shotEvents.length === 0) {
        return {
          totalXG: 0,
          actualGoals: 0,
          overperformance: 0,
          shotCount: 0,
          xGPerShot: 0,
          shots: [],
        };
      }
      
      // Convert to ShotEvent format
      const shots: ShotEvent[] = shotEvents.map(event => ({
        x: event.x,
        y: event.y,
        shotOutcome: event.shot_outcome,
        isHeader: event.aerial_outcome !== null,
        isPenalty: event.shot_outcome === 'penalty_goal' || event.shot_outcome === 'penalty_miss',
      }));
      
      // Count actual goals
      const actualGoals = shotEvents.filter(
        e => e.shot_outcome === 'goal' || e.shot_outcome === 'penalty_goal'
      ).length;
      
      return calculatePlayerXGStats(shots, actualGoals);
    },
    enabled: !!(playerId || (playerName && teamSlug)),
  });
}

/**
 * Fetch xG stats for all players in specified matches
 */
export function useTeamXGStats(teamSlug: string, matchIds?: string[]) {
  return useQuery({
    queryKey: ['teamXGStats', teamSlug, matchIds],
    queryFn: async () => {
      // Get team ID
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', teamSlug)
        .single();
      
      if (!team) return null;
      
      // Get all players for this team
      const { data: players } = await supabase
        .from('players')
        .select('id, name, jersey_number')
        .eq('team_id', team.id);
      
      if (!players) return null;
      
      const playerIds = players.map(p => p.id);
      
      // Build query for all shot events by these players
      let query = supabase
        .from('match_events')
        .select('player_id, x, y, shot_outcome, aerial_outcome')
        .in('player_id', playerIds)
        .eq('event_type', 'shot');
      
      if (matchIds && matchIds.length > 0) {
        query = query.in('match_id', matchIds);
      }
      
      const { data: shotEvents, error } = await query;
      
      if (error) {
        console.error('Error fetching team shot events:', error);
        return null;
      }
      
      // Group shots by player
      const shotsByPlayer = new Map<string, ShotEvent[]>();
      const goalsByPlayer = new Map<string, number>();
      
      shotEvents?.forEach(event => {
        const shots = shotsByPlayer.get(event.player_id) || [];
        shots.push({
          x: event.x,
          y: event.y,
          shotOutcome: event.shot_outcome,
          isHeader: event.aerial_outcome !== null,
          isPenalty: event.shot_outcome === 'penalty_goal' || event.shot_outcome === 'penalty_miss',
        });
        shotsByPlayer.set(event.player_id, shots);
        
        if (event.shot_outcome === 'goal' || event.shot_outcome === 'penalty_goal') {
          goalsByPlayer.set(event.player_id, (goalsByPlayer.get(event.player_id) || 0) + 1);
        }
      });
      
      // Calculate xG stats for each player
      const playerXGStats = players.map(player => {
        const shots = shotsByPlayer.get(player.id) || [];
        const goals = goalsByPlayer.get(player.id) || 0;
        const stats = calculatePlayerXGStats(shots, goals);
        
        return {
          playerId: player.id,
          playerName: player.name,
          jerseyNumber: player.jersey_number,
          ...stats,
        };
      }).filter(p => p.shotCount > 0);
      
      // Calculate team totals
      const teamTotalXG = playerXGStats.reduce((sum, p) => sum + p.totalXG, 0);
      const teamTotalGoals = playerXGStats.reduce((sum, p) => sum + p.actualGoals, 0);
      const teamTotalShots = playerXGStats.reduce((sum, p) => sum + p.shotCount, 0);
      
      return {
        players: playerXGStats.sort((a, b) => b.totalXG - a.totalXG),
        teamTotals: {
          totalXG: Math.round(teamTotalXG * 100) / 100,
          actualGoals: teamTotalGoals,
          overperformance: Math.round((teamTotalGoals - teamTotalXG) * 100) / 100,
          shotCount: teamTotalShots,
          xGPerShot: teamTotalShots > 0 ? Math.round((teamTotalXG / teamTotalShots) * 100) / 100 : 0,
        },
      };
    },
    enabled: !!teamSlug,
  });
}
