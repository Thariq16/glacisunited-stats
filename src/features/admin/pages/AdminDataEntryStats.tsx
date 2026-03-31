import { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Timer, TrendingUp, Coffee, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const BREAK_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/** Calculate active working time from sorted timestamps, excluding gaps > 1 hour */
function calcActiveTime(timestamps: number[]): { activeMs: number; breakMs: number; breakCount: number } {
  if (timestamps.length < 2) return { activeMs: 0, breakMs: 0, breakCount: 0 };
  let activeMs = 0;
  let breakMs = 0;
  let breakCount = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap > BREAK_THRESHOLD_MS) {
      breakMs += gap;
      breakCount++;
    } else {
      activeMs += gap;
    }
  }
  return { activeMs, breakMs, breakCount };
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

interface MatchEntryData {
  matchId: string;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  eventCount: number;
  firstEventAt: string;
  lastEventAt: string;
  activeMs: number;
  breakMs: number;
  breakCount: number;
}

interface DayStats {
  date: string;
  activeMs: number;
  breakMs: number;
  breakCount: number;
  eventCount: number;
  matches: MatchEntryData[];
}

function AdminDataEntryStatsContent() {
  const navigate = useNavigate();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['data-entry-stats-v2'],
    queryFn: async () => {
      // Fetch all matches
      const { data: matches, error: matchErr } = await supabase
        .from('matches')
        .select(`
          id, match_date, home_score, away_score, status,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .order('match_date', { ascending: false });
      if (matchErr) throw matchErr;

      const results: MatchEntryData[] = [];

      for (const match of matches || []) {
        // Fetch all created_at timestamps for this match (paginated)
        let allTimestamps: number[] = [];
        let from = 0;
        const pageSize = 1000;
        while (true) {
          const { data: page } = await supabase
            .from('match_events')
            .select('created_at')
            .eq('match_id', match.id)
            .order('created_at', { ascending: true })
            .range(from, from + pageSize - 1);
          if (!page || page.length === 0) break;
          allTimestamps.push(...page.map(e => new Date(e.created_at).getTime()));
          if (page.length < pageSize) break;
          from += pageSize;
        }

        if (allTimestamps.length === 0) continue;

        const { activeMs, breakMs, breakCount } = calcActiveTime(allTimestamps);

        results.push({
          matchId: match.id,
          matchDate: match.match_date,
          homeTeam: (match.home_team as any)?.name || 'Unknown',
          awayTeam: (match.away_team as any)?.name || 'Unknown',
          homeScore: match.home_score,
          awayScore: match.away_score,
          eventCount: allTimestamps.length,
          firstEventAt: new Date(allTimestamps[0]).toISOString(),
          lastEventAt: new Date(allTimestamps[allTimestamps.length - 1]).toISOString(),
          activeMs,
          breakMs,
          breakCount,
        });
      }

      return results;
    },
  });

  // Group by day (using the date of the first event entry)
  const dayStats = useMemo((): DayStats[] => {
    if (!rawData) return [];
    const dayMap = new Map<string, DayStats>();

    for (const m of rawData) {
      const dayKey = format(new Date(m.firstEventAt), 'yyyy-MM-dd');
      const existing = dayMap.get(dayKey);
      if (existing) {
        existing.activeMs += m.activeMs;
        existing.breakMs += m.breakMs;
        existing.breakCount += m.breakCount;
        existing.eventCount += m.eventCount;
        existing.matches.push(m);
      } else {
        dayMap.set(dayKey, {
          date: dayKey,
          activeMs: m.activeMs,
          breakMs: m.breakMs,
          breakCount: m.breakCount,
          eventCount: m.eventCount,
          matches: [m],
        });
      }
    }

    return Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [rawData]);

  // Totals
  const totalActiveMs = dayStats.reduce((s, d) => s + d.activeMs, 0);
  const totalEvents = dayStats.reduce((s, d) => s + d.eventCount, 0);
  const totalBreaks = dayStats.reduce((s, d) => s + d.breakCount, 0);

  const avgActivePerMatch = rawData && rawData.length > 0
    ? totalActiveMs / rawData.length
    : 0;

  const avgSecondsPerEvent = totalEvents > 0
    ? Math.round(totalActiveMs / totalEvents / 1000)
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
            Active working time per day. Gaps over 1 hour between events are counted as breaks.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Total Active Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-2xl font-bold text-foreground">{formatDuration(totalActiveMs)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Avg. Active per Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-2xl font-bold text-foreground">{formatDuration(avgActivePerMatch)}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg. Sec per Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold text-foreground">{avgSecondsPerEvent}s</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Total Breaks Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold text-foreground">{totalBreaks}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-day breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Daily Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : dayStats.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Matches</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Active Time</TableHead>
                    <TableHead className="text-right">Breaks</TableHead>
                    <TableHead className="text-right">Break Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayStats.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {format(new Date(day.date), 'EEE, dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-right font-mono">{day.matches.length}</TableCell>
                      <TableCell className="text-right font-mono">{day.eventCount}</TableCell>
                      <TableCell className="text-right font-semibold">{formatDuration(day.activeMs)}</TableCell>
                      <TableCell className="text-right font-mono">{day.breakCount}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {day.breakMs > 0 ? formatDuration(day.breakMs) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Accumulated total row */}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{rawData?.length ?? 0}</TableCell>
                    <TableCell className="text-right">{totalEvents}</TableCell>
                    <TableCell className="text-right">{formatDuration(totalActiveMs)}</TableCell>
                    <TableCell className="text-right">{totalBreaks}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDuration(dayStats.reduce((s, d) => s + d.breakMs, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No match event data found.</p>
            )}
          </CardContent>
        </Card>

        {/* Per-match detail */}
        <Card>
          <CardHeader>
            <CardTitle>Per Match Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : rawData && rawData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Events</TableHead>
                    <TableHead className="text-right">Active Time</TableHead>
                    <TableHead className="text-right">Breaks</TableHead>
                    <TableHead className="text-right">Sec/Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawData.map((s) => {
                    const secPerEvent = s.eventCount > 1 ? Math.round(s.activeMs / s.eventCount / 1000) : '-';
                    return (
                      <TableRow key={s.matchId}>
                        <TableCell className="font-medium">{s.homeTeam} vs {s.awayTeam}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(s.matchDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="font-mono">{s.homeScore} - {s.awayScore}</TableCell>
                        <TableCell className="text-right font-mono">{s.eventCount}</TableCell>
                        <TableCell className="text-right font-semibold">{formatDuration(s.activeMs)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {s.breakCount > 0 ? `${s.breakCount} (${formatDuration(s.breakMs)})` : '-'}
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
