import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttackingPhase } from "@/hooks/useMatchVisualizationData";

interface AttackingPhaseCardProps {
  phase: AttackingPhase;
}

export function AttackingPhaseCard({ phase }: AttackingPhaseCardProps) {
  // Use real pitch proportions (100x68) for consistent coordinates
  const pitchWidth = 100;
  const pitchHeight = 68;

  // Coordinates are stored as 0-100 for both X and Y
  // X maps directly to 0-100, Y needs to be scaled from 0-100 to 0-68
  const scaleX = (x: number) => x;
  const scaleY = (y: number) => (y / 100) * pitchHeight;

  // Sort events by minute and seconds
  const sortedEvents = [...phase.events].sort((a, b) => {
    if (a.minute !== b.minute) return a.minute - b.minute;
    return (a.seconds || 0) - (b.seconds || 0);
  });

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'goal':
        return 'bg-green-500';
      case 'shot':
        return 'bg-amber-500';
      default:
        return 'bg-red-500';
    }
  };

  const getOutcomeLabel = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'goal':
        return 'Goal';
      case 'shot':
        return 'Shot';
      default:
        return 'Lost Possession';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Phase #{phase.phase_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {phase.half === 1 ? '1st Half' : '2nd Half'}
            </Badge>
            <Badge className={`${getOutcomeColor(phase.outcome)} text-white text-xs`}>
              {getOutcomeLabel(phase.outcome)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <svg viewBox={`0 0 ${pitchWidth} ${pitchHeight}`} className="w-full h-auto border rounded bg-green-800/90">
          {/* Pitch markings */}
          <rect x="0" y="0" width={pitchWidth} height={pitchHeight} fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
          
          {/* Center line */}
          <line x1={pitchWidth / 2} y1="0" x2={pitchWidth / 2} y2={pitchHeight} stroke="white" strokeWidth="0.3" opacity="0.5" />
          
          {/* Center circle */}
          <circle cx={pitchWidth / 2} cy={pitchHeight / 2} r="9.15" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          
          {/* Left penalty area */}
          <rect x="0" y={(pitchHeight - 40.32) / 2} width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          
          {/* Right penalty area */}
          <rect x={pitchWidth - 16.5} y={(pitchHeight - 40.32) / 2} width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          
          {/* Goal areas */}
          <rect x="0" y={(pitchHeight - 18.32) / 2} width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <rect x={pitchWidth - 5.5} y={(pitchHeight - 18.32) / 2} width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.3" opacity="0.5" />

          {/* Third dividers */}
          <line x1={pitchWidth / 3} y1="0" x2={pitchWidth / 3} y2={pitchHeight} stroke="white" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.3" />
          <line x1={(pitchWidth / 3) * 2} y1="0" x2={(pitchWidth / 3) * 2} y2={pitchHeight} stroke="white" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.3" />

          {/* Draw pass lines connecting events */}
          {sortedEvents.map((event) => {
            // Draw line from this event to end position (for passes) or to next event
            if (event.end_x !== null && event.end_y !== null) {
              const isShot = event.event_type === 'shot';
              const isGoal = event.shot_outcome === 'goal';
              
              return (
                <line
                  key={`line-${event.id}`}
                  x1={scaleX(event.x)}
                  y1={scaleY(event.y)}
                  x2={scaleX(event.end_x)}
                  y2={scaleY(event.end_y)}
                  stroke={isGoal ? "#22c55e" : isShot ? "#f59e0b" : event.successful ? "#3b82f6" : "#ef4444"}
                  strokeWidth={isShot ? "0.8" : "0.5"}
                  opacity="0.7"
                  markerEnd={isShot ? "url(#arrowhead)" : undefined}
                />
              );
            }
            return null;
          })}

          {/* Arrow marker for shots */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="3"
              markerHeight="3"
              refX="2.5"
              refY="1.5"
              orient="auto"
            >
              <polygon points="0 0, 3 1.5, 0 3" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Draw event points with jersey numbers */}
          {sortedEvents.map((event) => {
            const isShot = event.event_type === 'shot';
            const isGoal = event.shot_outcome === 'goal';
            
            return (
              <g key={`point-${event.id}`}>
                <circle
                  cx={scaleX(event.x)}
                  cy={scaleY(event.y)}
                  r={isShot ? "2.5" : "1.8"}
                  fill={isGoal ? "#22c55e" : isShot ? "#f59e0b" : event.successful ? "#3b82f6" : "#ef4444"}
                  stroke="white"
                  strokeWidth="0.3"
                />
                <text
                  x={scaleX(event.x)}
                  y={scaleY(event.y) + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="2"
                  fontWeight="bold"
                >
                  {event.player?.jersey_number || '?'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Event summary */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>{sortedEvents.length} actions</span>
          {sortedEvents.length > 0 && (
            <span className="ml-2">
              ({sortedEvents[0].minute}' - {sortedEvents[sortedEvents.length - 1].minute}')
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
