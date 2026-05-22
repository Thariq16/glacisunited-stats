import { useMemo } from "react";
import { useMatchVisualizationData } from "@/hooks/useMatchVisualizationData";
import { AttackingPhasesSection } from "./AttackingPhasesSection";
import { TeamPassesByThirdChart } from "./TeamPassesByThirdChart";
import { MatchEventStatsChart } from "./MatchEventStatsChart";
import { TeamGoalMouthMap } from "./TeamGoalMouthMap";
import { ZonesOfControl } from "./ZonesOfControl";
import { PassDistributionGrid } from "./PassDistributionGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollReveal } from "@/components/ScrollReveal";

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
      <ScrollReveal animation="fade-up">
        <div data-shareable data-share-title="Match Event Statistics">
          <MatchEventStatsChart
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            home={data.matchEventStats.home}
            away={data.matchEventStats.away}
          />
        </div>
      </ScrollReveal>

      {data.zonesOfControl && (
        <ScrollReveal animation="scale">
          <div data-shareable data-share-title="Zones of Control">
            <ZonesOfControl
              zones={data.zonesOfControl}
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
            />
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal animation="fade-left">
        <div data-shareable data-share-title={`Goal Mouth Map — ${homeTeamName}`}>
          <TeamGoalMouthMap shots={homeShots} teamName={homeTeamName} />
        </div>
      </ScrollReveal>
      <ScrollReveal animation="fade-right">
        <div data-shareable data-share-title={`Goal Mouth Map — ${awayTeamName}`}>
          <TeamGoalMouthMap shots={awayShots} teamName={awayTeamName} />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade-up">
        <div data-shareable data-share-title="Passes by Third">
          <TeamPassesByThirdChart
            homeTeam={data.homePassesByThird}
            awayTeam={data.awayPassesByThird}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={100}>
        <div data-shareable data-share-title={`Pass Distribution — ${homeTeamName}`}>
          <PassDistributionGrid matchId={matchId} teamId={homeTeamId} teamName={homeTeamName} />
        </div>
      </ScrollReveal>
      <ScrollReveal animation="fade-up" delay={100}>
        <div data-shareable data-share-title={`Pass Distribution — ${awayTeamName}`}>
          <PassDistributionGrid matchId={matchId} teamId={awayTeamId} teamName={awayTeamName} />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade-up">
        <div data-shareable data-share-title={`Attacking Phases — ${homeTeamName}`}>
          <AttackingPhasesSection
            teamName={homeTeamName}
            phases={data.homePhases}
            isHomeTeam={true}
          />
        </div>
      </ScrollReveal>

      <ScrollReveal animation="fade-up">
        <div data-shareable data-share-title={`Attacking Phases — ${awayTeamName}`}>
          <AttackingPhasesSection
            teamName={awayTeamName}
            phases={data.awayPhases}
            isHomeTeam={false}
          />
        </div>
      </ScrollReveal>
    </div>
  );
}
