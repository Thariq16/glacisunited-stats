import { useState, useMemo } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePlayerStats, MatchFilter } from "@/hooks/usePlayerStats";
import { MatchFilterSelect } from "@/components/MatchFilterSelect";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SquadAnalysisView } from "@/components/views/SquadAnalysisView";
import { useMatchVisualizationData } from "@/hooks/useMatchVisualizationData";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LaneStats } from "@/components/views/AttackingThreatMap";

export default function SquadAnalysis() {
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('last1');

  // Fetch team ID for Glacis
  const { data: glacisTeam } = useQuery({
    queryKey: ['glacis-team-id'],
    queryFn: async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .eq('slug', 'glacis-united-fc')
        .single();
      return data;
    }
  });

  // Fetch relevant match IDs based on filter
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

  // Derive latest match (first in the list) for visualization data
  const latestMatch = filteredMatches?.[0] || null;
  const allMatchIds = (filteredMatches || []).map((m: any) => m.id);

  const { data: players, isLoading: isPlayersLoading } = usePlayerStats(
    'glacis-united-fc',
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

  // Determine which team is Glacis United (Focus Team)
  const isGlacisHome = (latestMatch as any)?.home_team?.name?.toLowerCase()?.includes('glacis');
  const focusTeamId = isGlacisHome
    ? (latestMatch as any)?.home_team_id
    : (latestMatch as any)?.away_team_id;
  const opponentTeamId = isGlacisHome
    ? (latestMatch as any)?.away_team_id
    : (latestMatch as any)?.home_team_id;

  // Swap set piece data so Glacis data is always primary
  const glacisSetPieceData = isGlacisHome
    ? (visualizationData as any)?.setPieceData
    : (visualizationData as any)?.opponentSetPieceData;
  const opponentSetPieceData = isGlacisHome
    ? (visualizationData as any)?.opponentSetPieceData
    : (visualizationData as any)?.setPieceData;
  const glacisName = isGlacisHome
    ? (latestMatch as any)?.home_team?.name
    : (latestMatch as any)?.away_team?.name;
  const opponentName = isGlacisHome
    ? (latestMatch as any)?.away_team?.name
    : (latestMatch as any)?.home_team?.name;

  // For multi-match, derive opponent team IDs from all matches
  const allOpponentTeamIds = (filteredMatches || []).map((m: any) => {
    const isHome = m.home_team?.name?.toLowerCase()?.includes('glacis');
    return isHome ? m.away_team_id : m.home_team_id;
  });

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
      </main>
      <Footer />
    </div>
  );
}
