import { useMemo } from "react";
import { useMatchVisualizationData } from "@/hooks/useMatchVisualizationData";
import { AttackingPhasesSection } from "./AttackingPhasesSection";
import { TeamPassesByThirdChart } from "./TeamPassesByThirdChart";
import { MatchEventStatsChart } from "./MatchEventStatsChart";
import { TeamGoalMouthMap } from "./TeamGoalMouthMap";
import { Skeleton } from "@/components/ui/skeleton";

interface MatchVisualizationsTabProps {
  matchId: string;
  homeTeamId: string | undefined;
  awayTeamId: string | undefined;
  homeTeamName: string;
  awayTeamName: string;
}

export function MatchVisualizationsTab({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
}: MatchVisualizationsTabProps) {
  const { data, isLoading, error } = useMatchVisualizationData(
    matchId,
    homeTeamId,
    awayTeamId,
    homeTeamName,
    awayTeamName
  );

  const homeShots = useMemo(() =>
    data?.shots?.filter((s: any) => s.team_id === homeTeamId) || [],
    [data?.shots, homeTeamId]
  );

  const awayShots = useMemo(() =>
    data?.shots?.filter((s: any) => s.team_id === awayTeamId) || [],
    [data?.shots, awayTeamId]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load visualization data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Match Event Stats Chart */}
      <MatchEventStatsChart
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        home={data.matchEventStats.home}
        away={data.matchEventStats.away}
      />

      {/* Goal Mouth Maps */}
      <TeamGoalMouthMap shots={homeShots} teamName={homeTeamName} />
      <TeamGoalMouthMap shots={awayShots} teamName={awayTeamName} />

      {/* Passes by Third Chart */}
      <TeamPassesByThirdChart
        homeTeam={data.homePassesByThird}
        awayTeam={data.awayPassesByThird}
      />

      {/* Home Team Attacking Phases */}
      <AttackingPhasesSection
        teamName={homeTeamName}
        phases={data.homePhases}
        isHomeTeam={true}
      />

      {/* Away Team Attacking Phases */}
      <AttackingPhasesSection
        teamName={awayTeamName}
        phases={data.awayPhases}
        isHomeTeam={false}
      />
    </div>
  );
}
