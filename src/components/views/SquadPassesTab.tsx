import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Activity, TrendingUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";

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
  successful: number;
  failed: number;
  forward: number;
  backward: number;
  total: number;
}

export function SquadPassesTab({ focusTeamId, matchFilter, teamSlug = 'glacis-united-fc' }: SquadPassesTabProps) {
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
          .select('id, match_id, player_id, event_type, x, end_x, successful, player:players!match_events_player_id_fkey(id, name, jersey_number, team_id)')
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

      // Sort matches chronologically for trend display
      const sortedMatches = [...matches].sort((a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      );

      const matchMap = new Map<string, { label: string; date: string; shortLabel: string }>(sortedMatches.map(m => {
        const isHome = m.home_team_id === team.id;
        const opponent = isHome ? (m.away_team as any)?.name : (m.home_team as any)?.name;
        const date = new Date(m.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return [m.id, {
          label: `${date} vs ${opponent || 'Unknown'}`,
          date,
          shortLabel: `vs ${opponent || 'Unknown'}`
        }];
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
          const matchInfo = matchMap.get(matchId) || { label: 'Unknown', date: '', shortLabel: 'Unknown' };
          matchPlayers.set(player.id, {
            matchLabel: matchInfo.label,
            matchDate: matchInfo.date,
            matchId,
            playerName: player.name,
            jerseyNumber: player.jersey_number,
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

      return { grouped, matchMap, sortedMatches: sortedMatches, teamId: team.id };
    },
  });

  const isMultiMatch = data?.sortedMatches && data.sortedMatches.length > 1;

  // Per-match bar chart data: one card per match
  const perMatchData = useMemo(() => {
    if (!data) return [];

    const { grouped, matchMap, sortedMatches } = data;

    return sortedMatches.map((m: any) => {
      const matchPlayers = grouped.get(m.id);
      const matchInfo = matchMap.get(m.id) || { label: 'Unknown', date: '', shortLabel: 'Unknown' };

      if (!matchPlayers || matchPlayers.size === 0) return null;

      const sorted = Array.from(matchPlayers.values()).sort((a, b) => a.jerseyNumber - b.jerseyNumber);

      const sfData = sorted.map(p => ({
        name: `#${p.jerseyNumber} ${p.playerName}`,
        Successful: p.successful,
        Failed: p.failed,
      }));

      const fbData = sorted.map(p => ({
        name: `#${p.jerseyNumber} ${p.playerName}`,
        Forward: p.forward,
        Backward: p.backward,
      }));

      return { matchInfo, sfData, fbData, matchId: m.id };
    }).filter(Boolean);
  }, [data]);

  // Trend data: per player across matches (for multi-match view)
  const trendData = useMemo(() => {
    if (!data || !isMultiMatch) return { successFailTrend: [], fwdBwdTrend: [], players: [] };

    const { grouped, matchMap, sortedMatches } = data;

    // Collect all players
    const playerSet = new Map<string, { name: string; jersey: number }>();
    grouped.forEach(matchPlayers => {
      matchPlayers.forEach((row, playerId) => {
        if (!playerSet.has(playerId)) {
          playerSet.set(playerId, { name: row.playerName, jersey: row.jerseyNumber });
        }
      });
    });

    const players = Array.from(playerSet.entries())
      .sort((a, b) => a[1].jersey - b[1].jersey);

    // Build trend: X-axis = matches, lines = players
    const successFailTrend = sortedMatches.map((m: any) => {
      const matchPlayers = grouped.get(m.id);
      const matchInfo = matchMap.get(m.id);
      const entry: any = { match: matchInfo?.label || 'Unknown' };

      players.forEach(([playerId, info]) => {
        const playerData = matchPlayers?.get(playerId);
        entry[`#${info.jersey} ${info.name}`] = playerData ? playerData.successful : 0;
      });

      return entry;
    });

    const fwdBwdTrend = sortedMatches.map((m: any) => {
      const matchPlayers = grouped.get(m.id);
      const matchInfo = matchMap.get(m.id);
      const entry: any = { match: matchInfo?.label || 'Unknown' };

      players.forEach(([playerId, info]) => {
        const playerData = matchPlayers?.get(playerId);
        entry[`#${info.jersey} ${info.name}`] = playerData ? playerData.forward : 0;
      });

      return entry;
    });

    return { successFailTrend, fwdBwdTrend, players };
  }, [data, isMultiMatch]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || perMatchData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">No pass data available for the selected matches.</p>
        </CardContent>
      </Card>
    );
  }

  // Colors for trend lines (up to 20 players)
  const PLAYER_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--destructive))',
    'hsl(142, 76%, 36%)',
    'hsl(38, 92%, 50%)',
    'hsl(262, 83%, 58%)',
    'hsl(199, 89%, 48%)',
    'hsl(350, 89%, 60%)',
    'hsl(174, 72%, 40%)',
    'hsl(45, 93%, 47%)',
    'hsl(280, 65%, 60%)',
    'hsl(16, 85%, 57%)',
    'hsl(200, 75%, 45%)',
    'hsl(120, 60%, 45%)',
    'hsl(330, 70%, 55%)',
    'hsl(60, 80%, 45%)',
    'hsl(240, 60%, 60%)',
    'hsl(0, 70%, 50%)',
    'hsl(160, 65%, 45%)',
    'hsl(300, 60%, 50%)',
    'hsl(80, 70%, 40%)',
  ];

  return (
    <div className="space-y-8">
      {/* Trend Charts (only for multi-match) */}
      {isMultiMatch && trendData.players.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Successful Passes Trend by Match
              </CardTitle>
              <CardDescription>How each player's successful passes are trending across matches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData.successFailTrend} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="match"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {trendData.players.map(([, info], idx) => (
                    <Line
                      key={`#${info.jersey} ${info.name}`}
                      type="monotone"
                      dataKey={`#${info.jersey} ${info.name}`}
                      stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Forward Passes Trend by Match
              </CardTitle>
              <CardDescription>How each player's forward passes are trending across matches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData.fwdBwdTrend} margin={{ top: 5, right: 30, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="match"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {trendData.players.map(([, info], idx) => (
                    <Line
                      key={`#${info.jersey} ${info.name}`}
                      type="monotone"
                      dataKey={`#${info.jersey} ${info.name}`}
                      stroke={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Per-Match Breakdown */}
      {perMatchData.map((matchData: any) => {
        const chartHeight = Math.max(280, matchData.sfData.length * 32);
        return (
          <div key={matchData.matchId} className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2 border-border">
              {matchData.matchInfo.label}
            </h3>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Successful vs Failed Passes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                      data={matchData.sfData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Successful" stackId="a" fill="hsl(var(--primary))" />
                      <Bar dataKey="Failed" stackId="a" fill="hsl(var(--destructive))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Forward vs Backward Passes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                      data={matchData.fbData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Forward" stackId="a" fill="hsl(142, 76%, 36%)" />
                      <Bar dataKey="Backward" stackId="a" fill="hsl(38, 92%, 50%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}
