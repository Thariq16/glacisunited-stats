import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Zone thresholds
const DEFENSIVE_THIRD_MAX = 33.33;
const MIDDLE_THIRD_MAX = 66.66;

function getZone(x: number): 'defensive' | 'middle' | 'final' {
    if (x < DEFENSIVE_THIRD_MAX) return 'defensive';
    if (x < MIDDLE_THIRD_MAX) return 'middle';
    return 'final';
}

function getSide(y: number): 'left' | 'right' {
    return y < 50 ? 'left' : 'right';
}

export interface SetPieceStats {
    type: 'throw_in' | 'corner' | 'free_kick';
    total: number;
    successful: number;
    failed: number;
    successRate: number;
}

export interface ZoneStats {
    zone: 'defensive' | 'middle' | 'final';
    side: 'left' | 'right';
    total: number;
    successful: number;
    failed: number;
    successRate: number;
}

export interface PlayerSetPieceStats {
    playerId: string;
    playerName: string;
    jerseyNumber: number;
    throwIns: { total: number; successful: number; rate: number };
    corners: { total: number; successful: number; rate: number };
    freeKicks: { total: number; successful: number; rate: number };
}

export interface PossessionLossEvent {
    id: string;
    x: number;
    y: number;
    zone: 'defensive' | 'middle' | 'final';
    type: 'dispossession' | 'turnover' | 'bad_touch' | 'failed_pass';
    playerName: string;
    jerseyNumber: number;
    minute: number;
    half: number;
}

export interface SetPieceAnalyticsData {
    overview: SetPieceStats[];
    throwInsByZone: ZoneStats[];
    cornersByZone: ZoneStats[];
    playerStats: PlayerSetPieceStats[];
    possessionLosses: PossessionLossEvent[];
    possessionLossByZone: { zone: string; count: number; percentage: number }[];
}

export function useSetPieceAnalytics(
    matchId: string | undefined,
    teamId: string | undefined,
    half?: number | null
) {
    return useQuery({
        queryKey: ['set-piece-analytics', matchId, teamId, half],
        queryFn: async (): Promise<SetPieceAnalyticsData> => {
            if (!matchId || !teamId) throw new Error('Match ID and Team ID required');

            // Fetch all events for this match
            const PAGE_SIZE = 1000;
            let allEvents: any[] = [];
            let offset = 0;
            let hasMore = true;

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
            minute,
            player:players!match_events_player_id_fkey(id, name, jersey_number, team_id)
          `)
                    .eq('match_id', matchId)
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

            // Filter to team's events only, and optionally by half
            const teamEvents = allEvents.filter((e: any) => {
                if (e.player?.team_id !== teamId) return false;
                if (half != null && e.half !== half) return false;
                return true;
            });

            // 1. Calculate Overview Stats
            const throwIns = teamEvents.filter((e: any) => e.event_type === 'throw_in');
            const corners = teamEvents.filter((e: any) => e.event_type === 'corner');
            const freeKicks = teamEvents.filter((e: any) => e.event_type === 'free_kick');

            const overview: SetPieceStats[] = [
                {
                    type: 'throw_in',
                    total: throwIns.length,
                    successful: throwIns.filter((e: any) => e.successful).length,
                    failed: throwIns.filter((e: any) => !e.successful).length,
                    successRate: throwIns.length > 0
                        ? Math.round((throwIns.filter((e: any) => e.successful).length / throwIns.length) * 100)
                        : 0
                },
                {
                    type: 'corner',
                    total: corners.length,
                    successful: corners.filter((e: any) => e.successful).length,
                    failed: corners.filter((e: any) => !e.successful).length,
                    successRate: corners.length > 0
                        ? Math.round((corners.filter((e: any) => e.successful).length / corners.length) * 100)
                        : 0
                },
                {
                    type: 'free_kick',
                    total: freeKicks.length,
                    successful: freeKicks.filter((e: any) => e.successful).length,
                    failed: freeKicks.filter((e: any) => !e.successful).length,
                    successRate: freeKicks.length > 0
                        ? Math.round((freeKicks.filter((e: any) => e.successful).length / freeKicks.length) * 100)
                        : 0
                }
            ];

            // 2. Throw-ins by Zone
            const throwInZoneMap = new Map<string, { total: number; successful: number }>();
            throwIns.forEach((e: any) => {
                const zone = getZone(e.x);
                const side = getSide(e.y);
                const key = `${zone}-${side}`;
                const current = throwInZoneMap.get(key) || { total: 0, successful: 0 };
                current.total++;
                if (e.successful) current.successful++;
                throwInZoneMap.set(key, current);
            });

            const throwInsByZone: ZoneStats[] = [];
            ['defensive', 'middle', 'final'].forEach(zone => {
                ['left', 'right'].forEach(side => {
                    const key = `${zone}-${side}`;
                    const stats = throwInZoneMap.get(key) || { total: 0, successful: 0 };
                    throwInsByZone.push({
                        zone: zone as 'defensive' | 'middle' | 'final',
                        side: side as 'left' | 'right',
                        total: stats.total,
                        successful: stats.successful,
                        failed: stats.total - stats.successful,
                        successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0
                    });
                });
            });

            // 3. Corners by Zone (inswing/outswing based on side)
            const cornerZoneMap = new Map<string, { total: number; successful: number }>();
            corners.forEach((e: any) => {
                const side = getSide(e.y);
                const current = cornerZoneMap.get(side) || { total: 0, successful: 0 };
                current.total++;
                if (e.successful) current.successful++;
                cornerZoneMap.set(side, current);
            });

            const cornersByZone: ZoneStats[] = ['left', 'right'].map(side => {
                const stats = cornerZoneMap.get(side) || { total: 0, successful: 0 };
                return {
                    zone: 'final' as const,
                    side: side as 'left' | 'right',
                    total: stats.total,
                    successful: stats.successful,
                    failed: stats.total - stats.successful,
                    successRate: stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0
                };
            });

            // 4. Player Stats
            const playerMap = new Map<string, PlayerSetPieceStats>();

            [...throwIns, ...corners, ...freeKicks].forEach((e: any) => {
                if (!e.player) return;
                const playerId = e.player.id;

                if (!playerMap.has(playerId)) {
                    playerMap.set(playerId, {
                        playerId,
                        playerName: e.player.name,
                        jerseyNumber: e.player.jersey_number,
                        throwIns: { total: 0, successful: 0, rate: 0 },
                        corners: { total: 0, successful: 0, rate: 0 },
                        freeKicks: { total: 0, successful: 0, rate: 0 }
                    });
                }

                const stats = playerMap.get(playerId)!;

                if (e.event_type === 'throw_in') {
                    stats.throwIns.total++;
                    if (e.successful) stats.throwIns.successful++;
                } else if (e.event_type === 'corner') {
                    stats.corners.total++;
                    if (e.successful) stats.corners.successful++;
                } else if (e.event_type === 'free_kick') {
                    stats.freeKicks.total++;
                    if (e.successful) stats.freeKicks.successful++;
                }
            });

            // Calculate rates
            playerMap.forEach(stats => {
                stats.throwIns.rate = stats.throwIns.total > 0
                    ? Math.round((stats.throwIns.successful / stats.throwIns.total) * 100)
                    : 0;
                stats.corners.rate = stats.corners.total > 0
                    ? Math.round((stats.corners.successful / stats.corners.total) * 100)
                    : 0;
                stats.freeKicks.rate = stats.freeKicks.total > 0
                    ? Math.round((stats.freeKicks.successful / stats.freeKicks.total) * 100)
                    : 0;
            });

            const playerStats = Array.from(playerMap.values())
                .filter(p => p.throwIns.total > 0 || p.corners.total > 0 || p.freeKicks.total > 0)
                .sort((a, b) => (b.throwIns.total + b.corners.total) - (a.throwIns.total + a.corners.total));

            // 5. Possession Losses
            const lossEventTypes = ['dispossession', 'turnover', 'bad_touch'];
            const failedPasses = teamEvents.filter((e: any) =>
                ['pass', 'throw_in', 'cross'].includes(e.event_type) && !e.successful
            );

            const possessionLosses: PossessionLossEvent[] = [
                ...teamEvents
                    .filter((e: any) => lossEventTypes.includes(e.event_type))
                    .map((e: any) => ({
                        id: e.id,
                        x: e.x,
                        y: e.y,
                        zone: getZone(e.x),
                        type: e.event_type as 'dispossession' | 'turnover' | 'bad_touch',
                        playerName: e.player?.name || 'Unknown',
                        jerseyNumber: e.player?.jersey_number || 0,
                        minute: e.minute,
                        half: e.half
                    })),
                ...failedPasses.map((e: any) => ({
                    id: e.id,
                    x: e.x,
                    y: e.y,
                    zone: getZone(e.x),
                    type: 'failed_pass' as const,
                    playerName: e.player?.name || 'Unknown',
                    jerseyNumber: e.player?.jersey_number || 0,
                    minute: e.minute,
                    half: e.half
                }))
            ];

            // 6. Possession Loss by Zone
            const lossZoneCount = { defensive: 0, middle: 0, final: 0 };
            possessionLosses.forEach(loss => {
                lossZoneCount[loss.zone]++;
            });

            const totalLosses = possessionLosses.length;
            const possessionLossByZone = Object.entries(lossZoneCount).map(([zone, count]) => ({
                zone,
                count,
                percentage: totalLosses > 0 ? Math.round((count / totalLosses) * 100) : 0
            }));

            return {
                overview,
                throwInsByZone,
                cornersByZone,
                playerStats,
                possessionLosses,
                possessionLossByZone
            };
        },
        enabled: !!matchId && !!teamId
    });
}
