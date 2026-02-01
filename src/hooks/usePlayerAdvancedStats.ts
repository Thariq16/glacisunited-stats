import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PossessionLossEvent } from '@/components/views/LostPossessionHeatmap';
import { LaneStats } from '@/components/views/AttackingThreatMap';

export interface PlayerAdvancedStats {
    possessionLossEvents: PossessionLossEvent[];
    attackingThreat: {
        all: LaneStats[];
        firstHalf: LaneStats[];
        secondHalf: LaneStats[];
    };
}

const PASS_EVENTS = ['pass', 'key_pass', 'assist', 'cross', 'penalty_area_pass', 'long_ball', 'through_ball', 'throw_in', 'cut_back'];

export function usePlayerAdvancedStats(
    teamSlug: string,
    playerName: string | undefined,
    matchFilter: 'last1' | 'last3' | 'all' | string = 'last1'
) {
    return useQuery({
        queryKey: ['player-advanced-stats', teamSlug, playerName, matchFilter],
        enabled: !!playerName,
        queryFn: async (): Promise<PlayerAdvancedStats | null> => {
            if (!playerName) return null;

            const decodedName = decodeURIComponent(playerName);

            // Get team
            const { data: team } = await supabase
                .from('teams')
                .select('id')
                .eq('slug', teamSlug)
                .single();

            if (!team) throw new Error('Team not found');

            // Get player
            const { data: playerData } = await supabase
                .from('players')
                .select('id, name, jersey_number')
                .eq('team_id', team.id)
                .eq('name', decodedName)
                .single();

            if (!playerData) return null;

            // Determine match IDs
            let matchIds: string[] = [];
            const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);

            if (isSpecificMatch) {
                matchIds = [matchFilter];
            } else {
                const matchesQuery = supabase
                    .from('matches')
                    .select('id, match_date')
                    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
                    .eq('status', 'completed')
                    .order('match_date', { ascending: false });

                if (matchFilter === 'last1') {
                    matchesQuery.limit(1);
                } else if (matchFilter === 'last3') {
                    matchesQuery.limit(3);
                }

                const { data: matches } = await matchesQuery;
                if (!matches || matches.length === 0) return null;
                matchIds = matches.map(m => m.id);
            }

            // Fetch relevant events
            const PAGE_SIZE = 1000;
            let allEvents: any[] = [];
            let offset = 0;
            let hasMore = true;

            const RELEVANT_EVENTS = [...PASS_EVENTS, 'dispossession', 'dribble'];

            while (hasMore) {
                const { data: events, error } = await supabase
                    .from('match_events')
                    .select(`
            id,
            event_type,
            x,
            y,
            successful,
            half,
            player_id
          `)
                    .eq('player_id', playerData.id)
                    .in('match_id', matchIds)
                    .in('event_type', RELEVANT_EVENTS)
                    .range(offset, offset + PAGE_SIZE - 1);

                if (error) throw error;

                if (events && events.length > 0) {
                    allEvents = [...allEvents, ...events];
                    offset += events.length;
                    hasMore = events.length === PAGE_SIZE;
                } else {
                    hasMore = false;
                }
            }

            // Initialize Stats
            const possessionLossEvents: PossessionLossEvent[] = [];

            const createLaneStats = () => ({
                left: { passes: 0, xg: 0 },
                center: { passes: 0, xg: 0 },
                right: { passes: 0, xg: 0 }
            });

            const laneStats = {
                all: createLaneStats(),
                firstHalf: createLaneStats(),
                secondHalf: createLaneStats()
            };

            allEvents.forEach((event) => {
                const halfKey = event.half === 1 ? 'firstHalf' : 'secondHalf';

                // 1. Possession Loss
                if (event.event_type === 'dispossession' || (['pass', 'dribble'].includes(event.event_type) && event.successful === false)) {
                    possessionLossEvents.push({
                        id: event.id,
                        x: event.x,
                        y: event.y,
                        player: playerData.name
                    });
                }

                // 2. Attacking Threat (Passes by Lane)
                if (PASS_EVENTS.includes(event.event_type)) {
                    const statsArray = [laneStats.all, laneStats[halfKey]];
                    statsArray.forEach(stats => {
                        if (event.y < 33.33) stats.left.passes++;
                        else if (event.y > 66.66) stats.right.passes++;
                        else stats.center.passes++;
                    });
                }
            });

            // Format Lane Stats
            const formatLaneStats = (stats: any): LaneStats[] => {
                const totalPasses = stats.left.passes + stats.center.passes + stats.right.passes;
                return [
                    { lane: 'left', passCount: stats.left.passes, threatPercent: totalPasses ? Math.round((stats.left.passes / totalPasses) * 100) : 0, xg: 0 },
                    { lane: 'center', passCount: stats.center.passes, threatPercent: totalPasses ? Math.round((stats.center.passes / totalPasses) * 100) : 0, xg: 0 },
                    { lane: 'right', passCount: stats.right.passes, threatPercent: totalPasses ? Math.round((stats.right.passes / totalPasses) * 100) : 0, xg: 0 },
                ];
            };

            return {
                possessionLossEvents,
                attackingThreat: {
                    all: formatLaneStats(laneStats.all),
                    firstHalf: formatLaneStats(laneStats.firstHalf),
                    secondHalf: formatLaneStats(laneStats.secondHalf),
                }
            };
        },
    });
}
