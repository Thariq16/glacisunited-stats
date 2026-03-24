import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSeasons, useSeasonMatches, Season } from "@/hooks/useSeasons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, ChevronRight, Target, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

function useSeasonAggregateStats(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['season-aggregate-stats', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      // Get matches for this season
      const { data: matches, error: mErr } = await supabase
        .from('matches')
        .select('id, home_score, away_score, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
        .eq('season_id', seasonId!);
      if (mErr) throw mErr;
      if (!matches || matches.length === 0) return null;

      // Identify "our" team (Glacis United) — appears most as home or away
      const teamCount: Record<string, { name: string; count: number }> = {};
      matches.forEach(m => {
        [{ id: m.home_team_id, name: (m.home_team as any)?.name }, { id: m.away_team_id, name: (m.away_team as any)?.name }].forEach(t => {
          if (!teamCount[t.id]) teamCount[t.id] = { name: t.name || 'Unknown', count: 0 };
          teamCount[t.id].count++;
        });
      });
      const sortedTeams = Object.entries(teamCount).sort((a, b) => b[1].count - a[1].count);
      const ourTeamId = sortedTeams[0][0];
      const ourTeamName = sortedTeams[0][1].name;

      let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
      matches.forEach(m => {
        const isHome = m.home_team_id === ourTeamId;
        const gf = isHome ? m.home_score : m.away_score;
        const ga = isHome ? m.away_score : m.home_score;
        goalsFor += gf;
        goalsAgainst += ga;
        if (gf > ga) wins++;
        else if (gf === ga) draws++;
        else losses++;
      });

      return {
        teamName: ourTeamName,
        teamId: ourTeamId,
        played: matches.length,
        wins, draws, losses,
        goalsFor, goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
        winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
      };
    },
  });
}

function SeasonOverview({ season }: { season: Season }) {
  const { data: stats, isLoading } = useSeasonAggregateStats(season.id);

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  if (!stats) return null;

  const statCards = [
    { label: 'Played', value: stats.played, icon: Calendar, color: 'text-muted-foreground' },
    { label: 'Record', value: `${stats.wins}W ${stats.draws}D ${stats.losses}L`, icon: Trophy, color: 'text-primary' },
    { label: 'Goals', value: `${stats.goalsFor} - ${stats.goalsAgainst}`, icon: Target, color: 'text-accent' },
    { label: 'Win Rate', value: `${stats.winRate}%`, icon: TrendingUp, color: stats.winRate >= 50 ? 'text-green-500' : 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {statCards.map(s => (
        <Card key={s.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.color} shrink-0`} />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SeasonMatchList({ season }: { season: Season }) {
  const { data: matches, isLoading } = useSeasonMatches(season.id);
  const navigate = useNavigate();

  if (isLoading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!matches || matches.length === 0) return <p className="text-sm text-muted-foreground py-4">No matches in this season yet.</p>;

  return (
    <div className="space-y-2">
      {matches.map(m => {
        const home = (m.home_team as any)?.name || 'Home';
        const away = (m.away_team as any)?.name || 'Away';
        return (
          <Card
            key={m.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/match/${m.id}`)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-xs text-muted-foreground w-20 shrink-0">
                  {format(new Date(m.match_date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium text-foreground text-sm">{home}</span>
                  <span className="text-lg font-bold text-foreground">{m.home_score}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-lg font-bold text-foreground">{m.away_score}</span>
                  <span className="font-medium text-foreground text-sm">{away}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Seasons() {
  const { data: seasons, isLoading } = useSeasons();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-expand the first active season
  const activeSeasonId = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const active = seasons.find(s => s.status === 'active');
    return active?.id || seasons[0].id;
  }, [seasons]);

  const currentExpanded = expandedId ?? activeSeasonId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Seasons</h1>
          </div>
          <p className="text-muted-foreground">Browse match results and statistics by season</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : !seasons || seasons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No seasons available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {seasons.map(season => {
              const isExpanded = currentExpanded === season.id;
              return (
                <div key={season.id}>
                  <Card
                    className={`cursor-pointer transition-colors ${isExpanded ? 'border-primary' : 'hover:border-primary/50'}`}
                    onClick={() => setExpandedId(isExpanded ? null : season.id)}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-6 w-6 text-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">{season.name}</h3>
                            <Badge variant={season.status === 'active' ? 'default' : 'secondary'}>
                              {season.status === 'active' ? 'Current' : 'Completed'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(season.start_date), 'MMM yyyy')} — {format(new Date(season.end_date), 'MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </CardContent>
                  </Card>

                  {isExpanded && (
                    <div className="mt-4 pl-2">
                      <SeasonOverview season={season} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Matches</h3>
                      <SeasonMatchList season={season} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
