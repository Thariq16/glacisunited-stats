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

  // 1. Fetch Latest COMPLETED Match to visualize
  const { data: latestMatch } = useQuery({
    queryKey: ['latest-match-glacis', 'completed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id, 
          match_date,
          home_team_id,
          away_team_id,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .in('status', ['completed', 'in_progress'])
        .order('match_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest match:', error);
        return null;
      }
      return data;
    }
  });

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
  const focusTeamId = (latestMatch as any)?.home_team?.name?.toLowerCase()?.includes('glacis')
    ? (latestMatch as any)?.home_team_id
    : (latestMatch as any)?.away_team_id;

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
            setPieceData={(visualizationData as any)?.setPieceData}
            defensiveEvents={visualizationData?.defensiveEvents || []}
            attackingThreat={visualizationData?.attackingThreat as any}
            opponentAttackingThreat={visualizationData?.opponentAttackingThreat as any}
            possessionLossEvents={visualizationData?.possessionLossEvents || []}
            teamName={(latestMatch as any)?.home_team?.name || 'Home Team'}
            focusTeamId={focusTeamId}
            matchCount={matchFilter === 'last1' ? 1 : matchFilter === 'last3' ? 1 : 1} // Temporary: defaulting to 1 for safety till robust query specific to 'last3' is added. Assuming primary use case is single match analysis.
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
