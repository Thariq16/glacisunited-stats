import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair } from "lucide-react";

interface ShotData {
  id: string;
  x: number;
  y: number;
  end_x: number | null;
  end_y: number | null;
  event_type: string;
  shot_outcome: string | null;
  half: number;
  minute: number;
  seconds: number | null;
  player: {
    name: string;
    jersey_number: number;
  } | null;
}

interface TeamGoalMouthMapProps {
  shots: ShotData[];
  teamName: string;
  className?: string;
}

// Map pitch end_y (0-100) to goal mouth horizontal position (15-85 in SVG)
// Map vertical position based on shot outcome or distribute evenly
function mapToGoalMouth(shot: ShotData, index: number, total: number) {
  // Horizontal: use end_y if available, otherwise use origin y
  const pitchY = shot.end_y ?? shot.y;
  // Map pitch Y (0-100) to goal width (15-85)
  const gmX = 15 + (pitchY / 100) * 70;

  // Vertical: distribute based on outcome
  // Goals/on-target: inside goal frame (25-85)
  // Off target/blocked: outside or edge
  const outcome = shot.shot_outcome;
  let gmY: number;

  if (outcome === 'goal') {
    // Spread goals across the net area (30-75)
    gmY = 30 + ((index * 17) % 45);
  } else if (outcome === 'on_target') {
    // On target but saved - mid area (35-70)
    gmY = 35 + ((index * 13) % 35);
  } else if (outcome === 'off_target') {
    // Off target - outside frame
    const side = index % 3;
    if (side === 0) gmY = 12; // over the bar
    else if (side === 1) gmY = 14; // just over
    else gmY = 92; // under/wide
  } else if (outcome === 'blocked') {
    // Blocked - lower area
    gmY = 75 + ((index * 7) % 15);
  } else {
    gmY = 50;
  }

  return { gmX: Math.max(3, Math.min(97, gmX)), gmY };
}

function getOutcomeColor(outcome: string | null) {
  switch (outcome) {
    case 'goal': return { fill: '#22C55E', stroke: '#15803d', label: 'Goal' };
    case 'on_target': return { fill: '#F59E0B', stroke: '#ca8a04', label: 'On Target' };
    case 'off_target': return { fill: '#EF4444', stroke: '#b91c1c', label: 'Off Target' };
    case 'blocked': return { fill: '#6B7280', stroke: '#374151', label: 'Blocked' };
    default: return { fill: '#3B82F6', stroke: '#1d4ed8', label: 'Unknown' };
  }
}

export function TeamGoalMouthMap({ shots, teamName, className }: TeamGoalMouthMapProps) {
  const stats = useMemo(() => {
    const total = shots.length;
    const goals = shots.filter(s => s.shot_outcome === 'goal').length;
    const onTarget = shots.filter(s => s.shot_outcome === 'on_target' || s.shot_outcome === 'goal').length;
    const blocked = shots.filter(s => s.shot_outcome === 'blocked').length;
    const offTarget = total - onTarget - blocked;
    const penalties = shots.filter(s => s.event_type === 'penalty').length;

    return { total, goals, onTarget, blocked, offTarget, penalties,
      conversionRate: total > 0 ? Math.round((goals / total) * 100) : 0,
      accuracyRate: total > 0 ? Math.round((onTarget / total) * 100) : 0,
    };
  }, [shots]);

  const mappedShots = useMemo(() =>
    shots.map((shot, i) => ({
      ...shot,
      ...mapToGoalMouth(shot, i, shots.length),
    })),
    [shots]
  );

  if (shots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="h-5 w-5 text-primary" />
            {teamName} — Shot Placement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic text-center py-6">No shots recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="h-5 w-5 text-primary" />
            {teamName} — Shot Placement
          </CardTitle>
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200 text-xs">
              {stats.goals} Goals
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.total} Shots
            </Badge>
            {stats.penalties > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-200">
                {stats.penalties} Pen
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Goal Mouth SVG */}
          <div className="lg:col-span-2">
            <svg
              viewBox="0 0 100 100"
              className="w-full max-w-md mx-auto border rounded-lg bg-gradient-to-b from-sky-200 to-sky-100 dark:from-sky-900 dark:to-sky-800"
            >
              {/* Crowd/stands */}
              <rect x="0" y="0" width="100" height="20" fill="rgba(100, 100, 100, 0.3)" />

              {/* Goal frame - crossbar */}
              <rect x="14" y="18" width="72" height="3" fill="#FFFFFF" stroke="#666" strokeWidth="0.5" rx="1" />
              {/* Left post */}
              <rect x="12" y="18" width="3" height="75" fill="#FFFFFF" stroke="#666" strokeWidth="0.5" rx="1" />
              {/* Right post */}
              <rect x="85" y="18" width="3" height="75" fill="#FFFFFF" stroke="#666" strokeWidth="0.5" rx="1" />

              {/* Goal net background */}
              <rect x="15" y="21" width="70" height="69" fill="rgba(255, 255, 255, 0.4)" />

              {/* Net mesh */}
              {[...Array(8)].map((_, i) => (
                <line key={`v-${i}`} x1={15 + (i + 1) * 7.77} y1="21" x2={15 + (i + 1) * 7.77} y2="90"
                  stroke="rgba(200, 200, 200, 0.6)" strokeWidth="0.3" />
              ))}
              {[...Array(7)].map((_, i) => (
                <line key={`h-${i}`} x1="15" y1={21 + (i + 1) * 9.86} x2="85" y2={21 + (i + 1) * 9.86}
                  stroke="rgba(200, 200, 200, 0.6)" strokeWidth="0.3" />
              ))}

              {/* Zone labels */}
              <text x="50" y="12" fill="rgba(255,255,255,0.6)" fontSize="4" textAnchor="middle">OVER</text>
              <text x="6" y="55" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle" transform="rotate(-90, 6, 55)">WIDE</text>
              <text x="94" y="55" fill="rgba(255,255,255,0.5)" fontSize="3" textAnchor="middle" transform="rotate(90, 94, 55)">WIDE</text>

              {/* Shot markers */}
              {mappedShots.map((shot) => {
                const colors = getOutcomeColor(shot.shot_outcome);
                const isPenalty = shot.event_type === 'penalty';
                const radius = shot.shot_outcome === 'goal' ? 4.5 : 3.5;

                return (
                  <g key={shot.id} className="cursor-pointer">
                    {/* Outer glow for goals */}
                    {shot.shot_outcome === 'goal' && (
                      <circle cx={shot.gmX} cy={shot.gmY} r={6} fill={colors.fill} opacity="0.2">
                        <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Penalty ring */}
                    {isPenalty && (
                      <circle cx={shot.gmX} cy={shot.gmY} r={radius + 1.5}
                        fill="none" stroke="#3B82F6" strokeWidth="0.6" strokeDasharray="1.5,1" />
                    )}

                    {/* Main marker */}
                    <circle cx={shot.gmX} cy={shot.gmY} r={radius}
                      fill={colors.fill} stroke={colors.stroke} strokeWidth="0.5" />

                    {/* Jersey number */}
                    <text x={shot.gmX} y={shot.gmY} dy=".35em" textAnchor="middle"
                      fontSize="2.8" fontWeight="bold" fill="white" pointerEvents="none" className="select-none">
                      {shot.player?.jersey_number}
                    </text>

                    <title>{`${shot.minute}'${shot.seconds ? `:${String(shot.seconds).padStart(2, '0')}` : ''} — ${shot.player?.name || 'Unknown'} (#${shot.player?.jersey_number})\n${colors.label}${isPenalty ? ' (Penalty)' : ''}\nHalf: ${shot.half}`}</title>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex gap-3 justify-center mt-3 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Goal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span>On Target</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Off Target</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <circle cx="6" cy="6" r="4" fill="none" stroke="#3B82F6" strokeWidth="1" strokeDasharray="2,1" />
                </svg>
                <span>Penalty</span>
              </div>
            </div>
          </div>

          {/* Stats panel */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Conversion</p>
                <p className="text-xl font-bold">{stats.conversionRate}%</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-xl font-bold">{stats.accuracyRate}%</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2">Breakdown</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Goals
                  </span>
                  <span className="font-bold">{stats.goals}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Saved
                  </span>
                  <span className="font-bold">{stats.onTarget - stats.goals}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Off Target
                  </span>
                  <span className="font-bold">{stats.offTarget}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Blocked
                  </span>
                  <span className="font-bold">{stats.blocked}</span>
                </div>
              </div>
            </div>

            {/* Shot list */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Shot Details</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {shots
                  .sort((a, b) => a.half - b.half || a.minute - b.minute || (a.seconds || 0) - (b.seconds || 0))
                  .map((shot) => {
                    const colors = getOutcomeColor(shot.shot_outcome);
                    const isPenalty = shot.event_type === 'penalty';
                    return (
                      <div key={shot.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.fill }} />
                        <span className="font-mono text-muted-foreground w-8">
                          {shot.minute}'{shot.seconds ? `:${String(shot.seconds).padStart(2, '0')}` : ''}
                        </span>
                        <span className="font-bold w-5">#{shot.player?.jersey_number}</span>
                        <span className="truncate flex-1">{shot.player?.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          backgroundColor: `${colors.fill}20`,
                          color: colors.fill,
                        }}>
                          {colors.label}{isPenalty ? ' (P)' : ''}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
