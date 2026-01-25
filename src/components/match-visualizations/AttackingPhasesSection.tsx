import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttackingPhase } from "@/hooks/useMatchVisualizationData";
import { AttackingPhaseCard } from "./AttackingPhaseCard";
import { Badge } from "@/components/ui/badge";

interface AttackingPhasesSectionProps {
  teamName: string;
  phases: AttackingPhase[];
  isHomeTeam?: boolean;
}

export function AttackingPhasesSection({ teamName, phases, isHomeTeam }: AttackingPhasesSectionProps) {
  // Separate phases by half
  const firstHalfPhases = phases.filter(p => p.half === 1);
  const secondHalfPhases = phases.filter(p => p.half === 2);

  // Count outcomes
  const goalCount = phases.filter(p => p.outcome.toLowerCase() === 'goal').length;
  const shotCount = phases.filter(p => p.outcome.toLowerCase() === 'shot').length;
  const lostPossessionCount = phases.filter(p => !['goal', 'shot'].includes(p.outcome.toLowerCase())).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant={isHomeTeam ? "default" : "secondary"}>
              {isHomeTeam ? 'Home' : 'Away'}
            </Badge>
            {teamName} Attacking Phases
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Badge className="bg-green-500 text-white">{goalCount} Goals</Badge>
            <Badge className="bg-amber-500 text-white">{shotCount} Shots</Badge>
            <Badge className="bg-red-500 text-white">{lostPossessionCount} Lost</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {phases.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No attacking phases recorded for this team.
          </p>
        ) : (
          <>
            {/* First Half */}
            {firstHalfPhases.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <span>1st Half</span>
                  <span className="text-muted-foreground">({firstHalfPhases.length} phases)</span>
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {firstHalfPhases.map((phase) => (
                    <AttackingPhaseCard key={phase.id} phase={phase} />
                  ))}
                </div>
              </div>
            )}

            {/* Second Half */}
            {secondHalfPhases.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <span>2nd Half</span>
                  <span className="text-muted-foreground">({secondHalfPhases.length} phases)</span>
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {secondHalfPhases.map((phase) => (
                    <AttackingPhaseCard key={phase.id} phase={phase} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
