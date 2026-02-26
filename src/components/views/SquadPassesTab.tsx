import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from "lucide-react";
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
      // Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('slug', teamSlug)
        .single();
      if (!team) return [];

      // Get matches
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
          .order('match_date', { ascending: true });
        if (matchFilter === 'last1') matchesQuery.limit(1);
        else if (matchFilter === 'last3') matchesQuery.limit(3);
      }

      const { data: matches } = await matchesQuery;
      if (!matches || matches.length === 0) return [];

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

      // Build per-player per-match data
      const matchMap = new Map<string, { label: string; date: string }>(matches.map(m => {
        const isHome = m.home_team_id === team.id;
        const opponent = isHome ? (m.away_team as any)?.name : (m.home_team as any)?.name;
        const date = new Date(m.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        return [m.id, { label: `vs ${opponent || 'Unknown'}`, date }];
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
          const matchInfo = matchMap.get(matchId) || { label: 'Unknown', date: '' };
          matchPlayers.set(player.id, {
            matchLabel: matchInfo.label,
            matchDate: matchInfo.date,
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

      return { grouped, matchMap, matches };
    },
  });

  const { playerMatchData, playerList, matchLabels } = useMemo(() => {
    if (!data || !('grouped' in data)) return { playerMatchData: [], playerList: [], matchLabels: [] };

    const { grouped, matches } = data;
    const playerSet = new Map<string, { name: string; jersey: number }>();

    // Collect all players
    grouped.forEach(matchPlayers => {
      matchPlayers.forEach((row, playerId) => {
        if (!playerSet.has(playerId)) {
          playerSet.set(playerId, { name: row.playerName, jersey: row.jerseyNumber });
        }
      });
    });

    const sortedPlayers = Array.from(playerSet.entries())
      .sort((a, b) => a[1].jersey - b[1].jersey);

    // Build chart data: one entry per match, with player-specific keys
    const successFailData: any[] = [];
    const fwdBwdData: any[] = [];

    matches.forEach((m: any) => {
      const matchPlayers = grouped.get(m.id);
      if (!matchPlayers) return;

      const matchInfo = data.matchMap.get(m.id) || { label: 'Unknown', date: '' };
      const sfEntry: any = { match: `${matchInfo.date}\n${matchInfo.label}` };
      const fbEntry: any = { match: `${matchInfo.date}\n${matchInfo.label}` };

      matchPlayers.forEach((row, playerId) => {
        const key = `#${row.jerseyNumber} ${row.playerName}`;
        sfEntry[`${key}_success`] = row.successful;
        sfEntry[`${key}_fail`] = row.failed;
        fbEntry[`${key}_forward`] = row.forward;
        fbEntry[`${key}_backward`] = row.backward;
      });

      successFailData.push(sfEntry);
      fwdBwdData.push(fbEntry);
    });

    return {
      playerMatchData: { successFailData, fwdBwdData },
      playerList: sortedPlayers,
      matchLabels: matches.map((m: any) => {
        const info = data.matchMap.get(m.id);
        return info ? `${info.date}\n${info.label}` : '';
      }),
    };
  }, [data]);

  // Build per-player bar data (one bar per match)
  const { perPlayerSuccessFail, perPlayerFwdBwd } = useMemo(() => {
    if (!data || !('grouped' in data)) return { perPlayerSuccessFail: [], perPlayerFwdBwd: [] };

    const { grouped, matches } = data;
    const playerTotals = new Map<string, { name: string; jersey: number; rows: MatchPassRow[] }>();

    grouped.forEach(matchPlayers => {
      matchPlayers.forEach((row, playerId) => {
        if (!playerTotals.has(playerId)) {
          playerTotals.set(playerId, { name: row.playerName, jersey: row.jerseyNumber, rows: [] });
        }
        playerTotals.get(playerId)!.rows.push(row);
      });
    });

    // Sort by jersey number
    const sorted = Array.from(playerTotals.values()).sort((a, b) => a.jersey - b.jersey);

    const sfData = sorted.map(p => ({
      name: `#${p.jersey} ${p.name}`,
      Successful: p.rows.reduce((s, r) => s + r.successful, 0),
      Failed: p.rows.reduce((s, r) => s + r.failed, 0),
    }));

    const fbData = sorted.map(p => ({
      name: `#${p.jersey} ${p.name}`,
      Forward: p.rows.reduce((s, r) => s + r.forward, 0),
      Backward: p.rows.reduce((s, r) => s + r.backward, 0),
    }));

    return { perPlayerSuccessFail: sfData, perPlayerFwdBwd: fbData };
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const chartHeight = Math.max(300, perPlayerSuccessFail.length * 35);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Successful Passes vs Failed Passes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perPlayerSuccessFail.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pass data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={perPlayerSuccessFail}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Successful" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="Failed" stackId="a" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Forward Passes vs Backward Passes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perPlayerFwdBwd.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pass data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={perPlayerFwdBwd}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Forward" stackId="a" fill="hsl(142, 76%, 36%)" />
                <Bar dataKey="Backward" stackId="a" fill="hsl(38, 92%, 50%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
