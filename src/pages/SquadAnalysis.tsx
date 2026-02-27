import { useState, useMemo } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePlayerStats, MatchFilter, useAllMatches } from "@/hooks/usePlayerStats";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { Users, BarChart3, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SquadAnalysisView } from "@/components/views/SquadAnalysisView";
import { useMatchVisualizationData } from "@/hooks/useMatchVisualizationData";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LaneStats } from "@/components/views/AttackingThreatMap";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { usePrimaryTeam } from "@/hooks/usePrimaryTeam";

// ── Overall Squad Analysis (multi-match, Glacis only) ──────────────────────
function OverallSquadAnalysis() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');
  const { primaryTeam, teamSlug, teamName } = usePrimaryTeam();

  const glacisTeam = primaryTeam;

  const { data: filteredMatches } = useQuery({
    queryKey: ['filtered-matches-glacis', matchFilter, glacisTeam?.id],
    queryFn: async () => {
      if (!glacisTeam?.id) return [];
      const isSpecificMatch = matchFilter && !['all', 'last1', 'last3'].includes(matchFilter);

      if (isSpecificMatch) {
        const { data } = await supabase
          .from('matches')
          .select(`id, match_date, home_team_id, away_team_id,
            home_team:teams!matches_home_team_id_fkey(name),
            away_team:teams!matches_away_team_id_fkey(name)`)
          .eq('id', matchFilter)
          .single();
        return data ? [data] : [];
      }

      const query = supabase
        .from('matches')
        .select(`id, match_date, home_team_id, away_team_id,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)`)
        .or(`home_team_id.eq.${glacisTeam.id},away_team_id.eq.${glacisTeam.id}`)
        .in('status', ['completed', 'in_progress'])
        .order('match_date', { ascending: false });

      if (matchFilter === 'last1') query.limit(1);
      else if (matchFilter === 'last3') query.limit(3);

      const { data } = await query;
      return data || [];
    },
    enabled: !!glacisTeam?.id
  });

  const latestMatch = filteredMatches?.[0] || null;
  const allMatchIds = (filteredMatches || []).map((m: any) => m.id);

  const { data: players, isLoading: isPlayersLoading } = usePlayerStats(
    teamSlug || '',
    (matchFilter === 'last1' && latestMatch?.id) ? latestMatch.id : matchFilter
  );

  const { data: visualizationData, isLoading: isVisLoading } = useMatchVisualizationData(
    (latestMatch as any)?.id,
    (latestMatch as any)?.home_team_id,
    (latestMatch as any)?.away_team_id,
    (latestMatch as any)?.home_team?.name || 'Home',
    (latestMatch as any)?.away_team?.name || 'Away'
  );

  const isLoading = isPlayersLoading || isVisLoading;

  const isPrimaryHome = glacisTeam?.id && (latestMatch as any)?.home_team_id === glacisTeam.id;
  const focusTeamId = isPrimaryHome
    ? (latestMatch as any)?.home_team_id
    : (latestMatch as any)?.away_team_id;
  const opponentTeamId = isPrimaryHome
    ? (latestMatch as any)?.away_team_id
    : (latestMatch as any)?.home_team_id;

  const primarySetPieceData = isPrimaryHome
    ? (visualizationData as any)?.setPieceData
    : (visualizationData as any)?.opponentSetPieceData;
  const opponentSetPieceData = isPrimaryHome
    ? (visualizationData as any)?.opponentSetPieceData
    : (visualizationData as any)?.setPieceData;
  const primaryName = isPrimaryHome
    ? (latestMatch as any)?.home_team?.name
    : (latestMatch as any)?.away_team?.name;
  const opponentName = isPrimaryHome
    ? (latestMatch as any)?.away_team?.name
    : (latestMatch as any)?.home_team?.name;

  return (
    <>
      <div className="mb-6">
        <MatchFilterSelect
          value={matchFilter}
          onValueChange={setMatchFilter}
          teamSlug="glacis-united-fc"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <SquadAnalysisView
          players={players || []}
          phases={visualizationData?.homePhases || []}
          shots={visualizationData?.shots || []}
          events={[]}
          history={[]}
          setPieceStats={(visualizationData as any)?.setPieceStats || []}
          playerSetPieceStats={visualizationData?.playerSetPieceStats || []}
          setPieceData={glacisSetPieceData}
          opponentSetPieceData={opponentSetPieceData}
          defensiveEvents={visualizationData?.defensiveEvents || []}
          attackingThreat={visualizationData?.attackingThreat as any}
          opponentAttackingThreat={visualizationData?.opponentAttackingThreat as any}
          possessionLossEvents={visualizationData?.possessionLossEvents || []}
          teamName={glacisName || 'Glacis United'}
          opponentName={opponentName || 'Opposition'}
          focusTeamId={focusTeamId}
          matchCount={allMatchIds.length || 1}
          matchId={(latestMatch as any)?.id}
          matchIds={allMatchIds}
          opponentTeamId={opponentTeamId}
          teamPassEvents={
            ((visualizationData as any)?.teamPassEvents || [])
              .filter((p: any) => !focusTeamId || p.teamId === focusTeamId)
          }
          matchFilter={matchFilter === 'last1' && latestMatch?.id ? latestMatch.id : matchFilter}
        />
      )}
    </>
  );
}

// ── Per Match Team Analysis (single match, both teams) ─────────────────────
function PerMatchTeamAnalysis() {
  const { data: allMatches, isLoading: matchesLoading } = useAllMatches();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // Auto-select latest match
  const effectiveMatchId = selectedMatchId || allMatches?.[0]?.id || '';

  const selectedMatch = useMemo(
    () => allMatches?.find(m => m.id === effectiveMatchId),
    [allMatches, effectiveMatchId]
  );

  const homeTeamName = (selectedMatch as any)?.home_team?.name || 'Home';
  const awayTeamName = (selectedMatch as any)?.away_team?.name || 'Away';
  const homeTeamId = (selectedMatch as any)?.home_team?.id || '';
  const awayTeamId = (selectedMatch as any)?.away_team?.id || '';
  const homeTeamSlug = (selectedMatch as any)?.home_team?.slug || '';
  const awayTeamSlug = (selectedMatch as any)?.away_team?.slug || '';

  const { data: visualizationData, isLoading: isVisLoading } = useMatchVisualizationData(
    effectiveMatchId || undefined,
    homeTeamId || undefined,
    awayTeamId || undefined,
    homeTeamName,
    awayTeamName
  );

  // Home team players
  const { data: homePlayers, isLoading: isHomeLoading } = usePlayerStats(
    homeTeamSlug,
    effectiveMatchId || 'last1'
  );

  // Away team players
  const { data: awayPlayers, isLoading: isAwayLoading } = usePlayerStats(
    awayTeamSlug,
    effectiveMatchId || 'last1'
  );

  const isLoading = isVisLoading || isHomeLoading || isAwayLoading;

  if (matchesLoading) {
    return <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (!allMatches || allMatches.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-muted-foreground">No matches available</CardContent></Card>
    );
  }

  return (
    <>
      {/* Match Selector */}
      <div className="mb-6">
        <Select value={effectiveMatchId} onValueChange={setSelectedMatchId}>
          <SelectTrigger className="w-full max-w-md">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select a match" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {allMatches.map((match: any) => {
              const home = match.home_team?.name || 'Home';
              const away = match.away_team?.name || 'Away';
              const date = format(new Date(match.match_date), 'MMM d, yyyy');
              const score = `${match.home_score}-${match.away_score}`;
              return (
                <SelectItem key={match.id} value={match.id}>
                  <div className="flex flex-col">
                    <span>{home} vs {away}</span>
                    <span className="text-xs text-muted-foreground">{date} • {score}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Match Header */}
      {selectedMatch && (
        <div className="mb-6 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold">{homeTeamName}</div>
            <div className="text-2xl font-extrabold text-primary">
              {(selectedMatch as any).home_score} - {(selectedMatch as any).away_score}
            </div>
            <div className="text-lg font-bold">{awayTeamName}</div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-1">
            {format(new Date((selectedMatch as any).match_date), 'EEEE, MMMM d, yyyy')}
            {(selectedMatch as any).venue && ` • ${(selectedMatch as any).venue}`}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : (
        <Tabs defaultValue="home" className="space-y-4">
          <TabsList>
            <TabsTrigger value="home">{homeTeamName}</TabsTrigger>
            <TabsTrigger value="away">{awayTeamName}</TabsTrigger>
          </TabsList>

          <TabsContent value="home">
            <SquadAnalysisView
              players={homePlayers || []}
              phases={visualizationData?.homePhases || []}
              shots={visualizationData?.shots || []}
              events={[]}
              history={[]}
              setPieceStats={(visualizationData as any)?.setPieceStats || []}
              playerSetPieceStats={visualizationData?.playerSetPieceStats || []}
              setPieceData={(visualizationData as any)?.setPieceData}
              opponentSetPieceData={(visualizationData as any)?.opponentSetPieceData}
              defensiveEvents={visualizationData?.defensiveEvents || []}
              attackingThreat={visualizationData?.attackingThreat as any}
              opponentAttackingThreat={visualizationData?.opponentAttackingThreat as any}
              possessionLossEvents={visualizationData?.possessionLossEvents || []}
              teamName={homeTeamName}
              opponentName={awayTeamName}
              focusTeamId={homeTeamId}
              matchCount={1}
              matchId={effectiveMatchId}
              matchIds={[effectiveMatchId]}
              opponentTeamId={awayTeamId}
              teamPassEvents={
                ((visualizationData as any)?.teamPassEvents || [])
                  .filter((p: any) => p.teamId === homeTeamId)
              }
              matchFilter={effectiveMatchId}
            />
          </TabsContent>

          <TabsContent value="away">
            <SquadAnalysisView
              players={awayPlayers || []}
              phases={visualizationData?.awayPhases || []}
              shots={visualizationData?.shots || []}
              events={[]}
              history={[]}
              setPieceStats={(visualizationData as any)?.opponentSetPieceStats || []}
              playerSetPieceStats={(visualizationData as any)?.opponentPlayerSetPieceStats || []}
              setPieceData={(visualizationData as any)?.opponentSetPieceData}
              opponentSetPieceData={(visualizationData as any)?.setPieceData}
              defensiveEvents={visualizationData?.defensiveEvents || []}
              attackingThreat={visualizationData?.opponentAttackingThreat as any}
              opponentAttackingThreat={visualizationData?.attackingThreat as any}
              possessionLossEvents={visualizationData?.possessionLossEvents || []}
              teamName={awayTeamName}
              opponentName={homeTeamName}
              focusTeamId={awayTeamId}
              matchCount={1}
              matchId={effectiveMatchId}
              matchIds={[effectiveMatchId]}
              opponentTeamId={homeTeamId}
              teamPassEvents={
                ((visualizationData as any)?.teamPassEvents || [])
                  .filter((p: any) => p.teamId === awayTeamId)
              }
              matchFilter={effectiveMatchId}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SquadAnalysis() {
  const [mode, setMode] = useState<'overall' | 'per-match'>('overall');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Squad Analysis</h1>
          </div>
          <p className="text-muted-foreground mb-6">Comprehensive team intelligence and composition analysis</p>

          {/* Mode Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setMode('overall')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                mode === 'overall'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Overall Squad Analysis
            </button>
            <button
              onClick={() => setMode('per-match')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                mode === 'per-match'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/50'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Per Match Analysis
            </button>
          </div>
        </div>

        {mode === 'overall' ? <OverallSquadAnalysis /> : <PerMatchTeamAnalysis />}
      </main>
      <Footer />
    </div>
  );
}
