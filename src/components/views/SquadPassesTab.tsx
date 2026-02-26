import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Activity, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PASS_EVENT_TYPES = ['pass', 'key_pass', 'assist', 'cross', 'cutback', 'penalty_area_pass', 'throw_in', 'corner', 'free_kick', 'goal_kick', 'kick_off', 'goal_restart'];

interface SquadPassesTabProps {
  focusTeamId?: string;
  matchFilter: string;
  teamSlug?: string;
}

interface MatchPassRow {
  matchLabel: string;
  matchDate: string;
  matchId: string;
  playerName: string;
  jerseyNumber: number;
  playerId: string;
  successful: number;
  failed: number;
  forward: number;
  backward: number;
  total: number;
}

interface PlayerMatchSummary {
  playerId: string;
  name: string;
  jersey: number;
  role: string;
  matchStats: {
    matchId: string;
    matchLabel: string;
    successful: number;
    failed: number;
    forward: number;
    backward: number;
    total: number;
    accuracy: number;
  }[];
  totalPasses: number;
  totalSuccessful: number;
  totalFailed: number;
  totalForward: number;
  totalBackward: number;
  avgAccuracy: number;
}

// Match bar colors
const MATCH_COLORS = [
  'hsl(var(--primary))',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(350, 89%, 60%)',
  'hsl(174, 72%, 40%)',
  'hsl(16, 85%, 57%)',
  'hsl(280, 65%, 60%)',
  'hsl(45, 93%, 47%)',
];

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 85) return 'hsl(142, 76%, 36%)';
  if (accuracy >= 70) return 'hsl(38, 92%, 50%)';
  return 'hsl(var(--destructive))';
}

function getAccuracyBadgeVariant(accuracy: number): 'default' | 'secondary' | 'destructive' {
  if (accuracy >= 85) return 'default';
  if (accuracy >= 70) return 'secondary';
  return 'destructive';
}

function TrendIndicator({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const diff = last - prev;
  if (diff > 0) return <ChevronUp className="h-4 w-4 text-green-500 inline" />;
  if (diff < 0) return <ChevronDown className="h-4 w-4 text-red-500 inline" />;
  return <span className="text-muted-foreground text-xs">—</span>;
}

export function SquadPassesTab({ focusTeamId, matchFilter, teamSlug = 'glacis-united-fc' }: SquadPassesTabProps) {
  const [view, setView] = useState<'summary' | 'byMatch'>('summary');

  const { data, isLoading } = useQuery({
    queryKey: ['squad-passes-by-match', teamSlug, matchFilter],
    queryFn: async () => {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', teamSlug)
        .single();
      if (!team) return null;

      const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);
      let matchesQuery;
      if (isSpecificMatch) {
        matchesQuery = supabase
          .from('matches')
          .select('id, match_date, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
          .eq('id', matchFilter);
      } else {
        matchesQuery = supabase
          .from('matches')
          .select('id, match_date, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .in('status', ['completed', 'in_progress'])
          .order('match_date', { ascending: false });
        if (matchFilter === 'last1') matchesQuery.limit(1);
        else if (matchFilter === 'last3') matchesQuery.limit(3);
      }

      const { data: matches } = await matchesQuery;
      if (!matches || matches.length === 0) return null;

      const matchIds = matches.map(m => m.id);

      // Fetch pass events with pagination
      const PAGE_SIZE = 1000;
      let allEvents: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: events, error } = await supabase
          .from('match_events')
          .select('id, match_id, player_id, event_type, x, end_x, successful, player:players!match_events_player_id_fkey(id, name, jersey_number, team_id, role)')
          .in('match_id', matchIds)
          .in('event_type', PASS_EVENT_TYPES)
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

      // Sort matches chronologically
      const sortedMatches = [...matches].sort((a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      );

      const matchMap = new Map(sortedMatches.map(m => {
        const isHome = m.home_team_id === team.id;
        const opponent = isHome ? (m.away_team as any)?.name : (m.home_team as any)?.name;
        const date = new Date(m.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return [m.id, { label: `${date} vs ${opponent || 'Unknown'}`, date, shortLabel: `vs ${opponent || '?'}` }];
      }));

      // Group: matchId -> playerId -> stats
      const grouped = new Map<string, Map<string, MatchPassRow>>();

      allEvents.forEach(event => {
        const player = event.player as any;
        if (!player || player.team_id !== team.id) return;

        const matchId = event.match_id;
        if (!grouped.has(matchId)) grouped.set(matchId, new Map());
        const matchPlayers = grouped.get(matchId)!;

        if (!matchPlayers.has(player.id)) {
          const matchInfo = matchMap.get(matchId) || { label: 'Unknown', date: '', shortLabel: '?' };
          matchPlayers.set(player.id, {
            matchLabel: matchInfo.label,
            matchDate: matchInfo.date,
            matchId,
            playerName: player.name,
            jerseyNumber: player.jersey_number,
            playerId: player.id,
            successful: 0,
            failed: 0,
            forward: 0,
            backward: 0,
            total: 0,
          });
        }

        const row = matchPlayers.get(player.id)!;
        row.total++;
        if (event.successful) row.successful++;
        else row.failed++;

        const x = Number(event.x) || 0;
        const endX = event.end_x !== null ? Number(event.end_x) : null;
        if (endX !== null) {
          if (endX > x) row.forward++;
          else if (endX < x) row.backward++;
        }
      });

      // Build player roles map
      const playerRoles = new Map<string, string>();
      allEvents.forEach(event => {
        const player = event.player as any;
        if (player && player.team_id === team.id && !playerRoles.has(player.id)) {
          playerRoles.set(player.id, player.role || '');
        }
      });

      return { grouped, matchMap, sortedMatches, teamId: team.id, playerRoles };
    },
  });

  // Build player summaries
  const playerSummaries: PlayerMatchSummary[] = useMemo(() => {
    if (!data) return [];

    const { grouped, matchMap, sortedMatches, playerRoles } = data;
    const playerMap = new Map<string, PlayerMatchSummary>();

    sortedMatches.forEach((m: any) => {
      const matchPlayers = grouped.get(m.id);
      if (!matchPlayers) return;

      matchPlayers.forEach((row, playerId) => {
        if (!playerMap.has(playerId)) {
          playerMap.set(playerId, {
            playerId,
            name: row.playerName,
            jersey: row.jerseyNumber,
            role: playerRoles.get(playerId) || '',
            matchStats: [],
            totalPasses: 0,
            totalSuccessful: 0,
            totalFailed: 0,
            totalForward: 0,
            totalBackward: 0,
            avgAccuracy: 0,
          });
        }

        const summary = playerMap.get(playerId)!;
        const accuracy = row.total > 0 ? Math.round((row.successful / row.total) * 100) : 0;

        summary.matchStats.push({
          matchId: m.id,
          matchLabel: matchMap.get(m.id)?.label || 'Unknown',
          successful: row.successful,
          failed: row.failed,
          forward: row.forward,
          backward: row.backward,
          total: row.total,
          accuracy,
        });

        summary.totalPasses += row.total;
        summary.totalSuccessful += row.successful;
        summary.totalFailed += row.failed;
        summary.totalForward += row.forward;
        summary.totalBackward += row.backward;
      });
    });

    // Calculate avg accuracy
    playerMap.forEach(summary => {
      summary.avgAccuracy = summary.totalPasses > 0
        ? Math.round((summary.totalSuccessful / summary.totalPasses) * 100)
        : 0;
    });

    return Array.from(playerMap.values()).sort((a, b) => a.jersey - b.jersey);
  }, [data]);

  const isMultiMatch = data?.sortedMatches && data.sortedMatches.length > 1;
  const matchLabels = useMemo(() => {
    if (!data) return [];
    return data.sortedMatches.map((m: any) => ({
      id: m.id,
      label: data.matchMap.get(m.id)?.label || '',
      shortLabel: data.matchMap.get(m.id)?.shortLabel || '',
    }));
  }, [data]);

  // Per-match grouped bar data for the comparison chart
  const comparisonChartData = useMemo(() => {
    if (!data || !isMultiMatch) return [];

    return playerSummaries
      .filter(p => p.totalPasses > 0)
      .map(player => {
        const entry: any = { name: `#${player.jersey} ${player.name}` };
        player.matchStats.forEach((ms, idx) => {
          entry[ms.matchLabel] = ms.total;
        });
        return entry;
      });
  }, [playerSummaries, isMultiMatch, data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || playerSummaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">No pass data available for the selected matches.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Heatmap Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Pass Summary {isMultiMatch ? 'by Match' : ''}
          </CardTitle>
          {isMultiMatch && (
            <CardDescription>
              Each column shows a match — compare players across games at a glance
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Tabs defaultValue="accuracy" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="accuracy">Pass Accuracy</TabsTrigger>
              <TabsTrigger value="volume">Pass Volume</TabsTrigger>
              <TabsTrigger value="direction">Forward vs Backward</TabsTrigger>
            </TabsList>

            {/* ACCURACY VIEW */}
            <TabsContent value="accuracy">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-foreground sticky left-0 bg-card z-10 min-w-[140px]">Player</th>
                      {isMultiMatch && matchLabels.map(ml => (
                        <th key={ml.id} className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[100px]">
                          <div className="text-xs leading-tight">{ml.label}</div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 font-semibold text-foreground min-w-[80px]">
                        {isMultiMatch ? 'Avg' : 'Accuracy'}
                      </th>
                      {isMultiMatch && (
                        <th className="text-center py-3 px-2 font-semibold text-foreground min-w-[60px]">Trend</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {playerSummaries.filter(p => p.totalPasses > 0).map(player => (
                      <tr key={player.playerId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-2 sticky left-0 bg-card z-10">
                          <div className="font-medium text-foreground">#{player.jersey} {player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </td>
                        {isMultiMatch && matchLabels.map(ml => {
                          const ms = player.matchStats.find(s => s.matchId === ml.id);
                          if (!ms) return <td key={ml.id} className="text-center py-2.5 px-2 text-muted-foreground">—</td>;
                          return (
                            <td key={ml.id} className="text-center py-2.5 px-2">
                              <div
                                className="inline-flex items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-bold min-w-[48px]"
                                style={{
                                  backgroundColor: `${getAccuracyColor(ms.accuracy)}20`,
                                  color: getAccuracyColor(ms.accuracy),
                                }}
                              >
                                {ms.accuracy}%
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {ms.successful}/{ms.total}
                              </div>
                            </td>
                          );
                        })}
                        <td className="text-center py-2.5 px-2">
                          <Badge variant={getAccuracyBadgeVariant(player.avgAccuracy)} className="font-mono text-xs">
                            {player.avgAccuracy}%
                          </Badge>
                        </td>
                        {isMultiMatch && (
                          <td className="text-center py-2.5 px-2">
                            <TrendIndicator values={player.matchStats.map(ms => ms.accuracy)} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* VOLUME VIEW */}
            <TabsContent value="volume">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-foreground sticky left-0 bg-card z-10 min-w-[140px]">Player</th>
                      {isMultiMatch && matchLabels.map(ml => (
                        <th key={ml.id} className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[100px]">
                          <div className="text-xs leading-tight">{ml.label}</div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 font-semibold text-foreground min-w-[80px]">Total</th>
                      {isMultiMatch && (
                        <th className="text-center py-3 px-2 font-semibold text-foreground min-w-[60px]">Trend</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {playerSummaries.filter(p => p.totalPasses > 0).map(player => {
                      const maxTotal = Math.max(...player.matchStats.map(ms => ms.total), 1);
                      return (
                        <tr key={player.playerId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2 sticky left-0 bg-card z-10">
                            <div className="font-medium text-foreground">#{player.jersey} {player.name}</div>
                            <div className="text-xs text-muted-foreground">{player.role}</div>
                          </td>
                          {isMultiMatch && matchLabels.map(ml => {
                            const ms = player.matchStats.find(s => s.matchId === ml.id);
                            if (!ms) return <td key={ml.id} className="text-center py-2.5 px-2 text-muted-foreground">—</td>;
                            const barWidth = Math.max(10, (ms.total / maxTotal) * 100);
                            return (
                              <td key={ml.id} className="py-2.5 px-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 h-5 bg-muted/50 rounded-sm overflow-hidden relative">
                                    <div
                                      className="h-full rounded-sm transition-all"
                                      style={{
                                        width: `${barWidth}%`,
                                        background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))`,
                                      }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                                      {ms.total}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          <td className="text-center py-2.5 px-2">
                            <span className="font-bold text-foreground">{player.totalPasses}</span>
                          </td>
                          {isMultiMatch && (
                            <td className="text-center py-2.5 px-2">
                              <TrendIndicator values={player.matchStats.map(ms => ms.total)} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* DIRECTION VIEW */}
            <TabsContent value="direction">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold text-foreground sticky left-0 bg-card z-10 min-w-[140px]">Player</th>
                      {isMultiMatch && matchLabels.map(ml => (
                        <th key={ml.id} className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[120px]">
                          <div className="text-xs leading-tight">{ml.label}</div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 font-semibold text-foreground min-w-[100px]">Total</th>
                      {isMultiMatch && (
                        <th className="text-center py-3 px-2 font-semibold text-foreground min-w-[60px]">Trend</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {playerSummaries.filter(p => p.totalPasses > 0).map(player => (
                      <tr key={player.playerId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-2 sticky left-0 bg-card z-10">
                          <div className="font-medium text-foreground">#{player.jersey} {player.name}</div>
                          <div className="text-xs text-muted-foreground">{player.role}</div>
                        </td>
                        {isMultiMatch && matchLabels.map(ml => {
                          const ms = player.matchStats.find(s => s.matchId === ml.id);
                          if (!ms) return <td key={ml.id} className="text-center py-2.5 px-2 text-muted-foreground">—</td>;
                          const fwdPct = ms.total > 0 ? Math.round((ms.forward / (ms.forward + ms.backward || 1)) * 100) : 0;
                          return (
                            <td key={ml.id} className="py-2.5 px-2">
                              <div className="flex h-4 rounded-sm overflow-hidden bg-muted/30">
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${fwdPct}%`,
                                    backgroundColor: 'hsl(142, 76%, 36%)',
                                  }}
                                />
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${100 - fwdPct}%`,
                                    backgroundColor: 'hsl(38, 92%, 50%)',
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] mt-0.5">
                                <span style={{ color: 'hsl(142, 76%, 36%)' }}>{ms.forward}↑</span>
                                <span style={{ color: 'hsl(38, 92%, 50%)' }}>{ms.backward}↓</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-2">
                          <div className="flex h-4 rounded-sm overflow-hidden bg-muted/30">
                            <div
                              className="h-full"
                              style={{
                                width: `${player.totalForward + player.totalBackward > 0 ? Math.round((player.totalForward / (player.totalForward + player.totalBackward)) * 100) : 0}%`,
                                backgroundColor: 'hsl(142, 76%, 36%)',
                              }}
                            />
                            <div
                              className="h-full"
                              style={{
                                width: `${player.totalForward + player.totalBackward > 0 ? Math.round((player.totalBackward / (player.totalForward + player.totalBackward)) * 100) : 0}%`,
                                backgroundColor: 'hsl(38, 92%, 50%)',
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] mt-0.5">
                            <span style={{ color: 'hsl(142, 76%, 36%)' }}>{player.totalForward}↑</span>
                            <span style={{ color: 'hsl(38, 92%, 50%)' }}>{player.totalBackward}↓</span>
                          </div>
                        </td>
                        {isMultiMatch && (
                          <td className="text-center py-2.5 px-2">
                            <TrendIndicator values={player.matchStats.map(ms => ms.forward)} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }} />
                  <span>Forward</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(38, 92%, 50%)' }} />
                  <span>Backward</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Comparison Bar Chart (multi-match only) */}
      {isMultiMatch && comparisonChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Total Passes by Match — Player Comparison
            </CardTitle>
            <CardDescription>Compare each player's pass volume across matches</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(350, comparisonChartData.length * 32)}>
              <BarChart
                data={comparisonChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {matchLabels.map((ml, idx) => (
                  <Bar
                    key={ml.id}
                    dataKey={ml.label}
                    fill={MATCH_COLORS[idx % MATCH_COLORS.length]}
                    radius={[0, 2, 2, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
