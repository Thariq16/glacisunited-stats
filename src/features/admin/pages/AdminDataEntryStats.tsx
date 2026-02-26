import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Timer, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface MatchEntryStats {
  matchId: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  eventCount: number;
  firstEventAt: string;
  lastEventAt: string;
  durationMs: number;
  status: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function AdminDataEntryStatsContent() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['data-entry-stats'],
    queryFn: async () => {
      // Fetch all matches with team info
      const { data: matches, error: matchErr } = await supabase
        .from('matches')
        .select(`
          id, match_date, home_score, away_score, status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .order('match_date', { ascending: false });
      if (matchErr) throw matchErr;

      // For each match, get first and last event timestamps + count
      const results: MatchEntryStats[] = [];

      for (const match of matches || []) {
        // Get earliest event
        const { data: firstEvents } = await supabase
          .from('match_events')
          .select('created_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: true })
          .limit(1);

        // Get latest event
        const { data: lastEvents } = await supabase
          .from('match_events')
          .select('created_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get count
        const { count } = await supabase
          .from('match_events')
          .select('id', { count: 'exact', head: true })
          .eq('match_id', match.id);

        if (firstEvents?.length && lastEvents?.length && count && count > 0) {
          const firstAt = new Date(firstEvents[0].created_at).getTime();
          const lastAt = new Date(lastEvents[0].created_at).getTime();

          results.push({
            matchId: match.id,
            matchDate: match.match_date,
            homeTeam: (match.home_team as any)?.name || 'Unknown',
            awayTeam: (match.away_team as any)?.name || 'Unknown',
            homeScore: match.home_score,
            awayScore: match.away_score,
            eventCount: count,
            firstEventAt: firstEvents[0].created_at,
            lastEventAt: lastEvents[0].created_at,
            durationMs: lastAt - firstAt,
            status: match.status,
          });
        }
      }

      return results;
    },
  });

  const avgDuration = stats && stats.length > 0
    ? stats.reduce((sum, s) => sum + s.durationMs, 0) / stats.length
    : 0;

  const avgEventsPerMatch = stats && stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.eventCount, 0) / stats.length)
    : 0;

  const avgSecondsPerEvent = stats && stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + (s.eventCount > 1 ? s.durationMs / s.eventCount : 0), 0) / stats.length / 1000)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Timer className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Data Entry Statistics</h1>
          </div>
          <p className="text-muted-foreground">
            Track how long it takes to complete match event data entry from first to last event logged.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg. Entry Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{formatDuration(avgDuration)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Events per Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{avgEventsPerMatch}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Avg. Seconds per Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{avgSecondsPerEvent}s</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Match table */}
        <Card>
          <CardHeader>
            <CardTitle>Match Entry Durations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats && stats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Finished</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Sec/Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((s) => {
                    const secPerEvent = s.eventCount > 1 ? Math.round(s.durationMs / s.eventCount / 1000) : '-';
                    return (
                      <TableRow key={s.matchId}>
                        <TableCell className="font-medium">
                          {s.homeTeam} vs {s.awayTeam}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(s.matchDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="font-mono">
                          {s.homeScore} - {s.awayScore}
                        </TableCell>
                        <TableCell className="text-right font-mono">{s.eventCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(s.firstEventAt), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(s.lastEventAt), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatDuration(s.durationMs)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {secPerEvent}{typeof secPerEvent === 'number' ? 's' : ''}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No match event data found.</p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function AdminDataEntryStats() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminDataEntryStatsContent />
    </ProtectedRoute>
  );
}
