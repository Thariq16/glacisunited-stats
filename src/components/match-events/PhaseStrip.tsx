import { Phase, PhaseOutcome } from './types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Target, Goal as GoalIcon, XCircle } from 'lucide-react';

interface PhaseStripProps {
  phases: Phase[];
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamId?: string;
  events: Array<{ id: string; teamId?: string }>;
  onPhaseClick?: (phaseId: string) => void;
  selectedPhaseId?: string | null;
}

const OUTCOME_CONFIG: Record<PhaseOutcome, { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bgClass: string;
  textClass: string;
}> = {
  goal: {
    icon: GoalIcon,
    label: 'Goal',
    bgClass: 'bg-green-100 dark:bg-green-900/40',
    textClass: 'text-green-700 dark:text-green-400',
  },
  shot: {
    icon: Target,
    label: 'Shot',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/40',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
  lost_possession: {
    icon: XCircle,
    label: 'Lost',
    bgClass: 'bg-red-100 dark:bg-red-900/40',
    textClass: 'text-red-700 dark:text-red-400',
  },
};

export function PhaseStrip({
  phases,
  homeTeamName = 'Home',
  awayTeamName = 'Away',
  homeTeamId,
  events,
  onPhaseClick,
  selectedPhaseId,
}: PhaseStripProps) {
  if (phases.length === 0) return null;

  // Determine team for each phase based on majority of events in that phase
  const getPhaseTeam = (phase: Phase): 'home' | 'away' | null => {
    const phaseEvents = events.filter(e => phase.eventIds.includes(e.id));
    if (phaseEvents.length === 0) return null;

    const homeCount = phaseEvents.filter(e => e.teamId === homeTeamId).length;
    const awayCount = phaseEvents.length - homeCount;

    return homeCount >= awayCount ? 'home' : 'away';
  };

  return (
    <div className="w-full">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Attacking Phases ({phases.length})
      </h4>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {phases.map((phase) => {
            const team = getPhaseTeam(phase);
            const outcome = phase.outcome ? OUTCOME_CONFIG[phase.outcome] : null;
            const OutcomeIcon = outcome?.icon;
            const isSelected = selectedPhaseId === phase.id;
            const teamName = team === 'home' ? homeTeamName : awayTeamName;

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseClick?.(phase.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                  ${isSelected 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-border hover:border-primary/50'
                  }
                  ${outcome?.bgClass || 'bg-muted/50'}
                `}
              >
                {/* Phase number */}
                <span className="text-xs font-bold text-muted-foreground">
                  #{phase.phaseNumber}
                </span>

                {/* Team indicator */}
                <span className={`
                  text-[10px] font-medium px-1.5 py-0.5 rounded
                  ${team === 'home' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                  }
                `}>
                  {teamName?.slice(0, 3).toUpperCase()}
                </span>

                {/* Outcome */}
                {outcome && OutcomeIcon && (
                  <div className={`flex items-center gap-1 ${outcome.textClass}`}>
                    <OutcomeIcon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{outcome.label}</span>
                  </div>
                )}

                {/* Event count */}
                <span className="text-[10px] text-muted-foreground">
                  ({phase.eventIds.length})
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
