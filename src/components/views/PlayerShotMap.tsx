import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface ShotEvent {
  id: string;
  x: number;
  y: number;
  goal_mouth_x: number | null;
  goal_mouth_y: number | null;
  shot_outcome: string;
  half: number;
  minute: number;
}

interface PlayerShotMapProps {
  shots: ShotEvent[];
}

const OUTCOME_CONFIG: Record<string, { color: string; label: string }> = {
  goal: { color: '#22C55E', label: 'Goal' },
  on_target: { color: '#F59E0B', label: 'On Target' },
  off_target: { color: '#EF4444', label: 'Off Target' },
  blocked: { color: '#94A3B8', label: 'Blocked' },
};

const PITCH_HEIGHT = 68;
const toSvgY = (y: number) => (y / 100) * PITCH_HEIGHT;

export function PlayerShotMap({ shots }: PlayerShotMapProps) {
  const stats = useMemo(() => {
    const total = shots.length;
    const goals = shots.filter(s => s.shot_outcome === 'goal').length;
    const onTarget = shots.filter(s => s.shot_outcome === 'on_target').length;
    const offTarget = shots.filter(s => s.shot_outcome === 'off_target').length;
    const blocked = shots.filter(s => s.shot_outcome === 'blocked').length;
    return { total, goals, onTarget, offTarget, blocked };
  }, [shots]);

  if (!shots.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-primary" />
          Shot Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {Object.entries(OUTCOME_CONFIG).map(([key, cfg]) => {
            const count = shots.filter(s => s.shot_outcome === key).length;
            if (!count) return null;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-muted-foreground">{cfg.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{count}</Badge>
              </div>
            );
          })}
        </div>

        {/* Pitch SVG — same style as PitchDiagram */}
        <svg
          viewBox="-3 0 106 68"
          className="w-full border-2 border-green-800 rounded-lg bg-green-50 dark:bg-green-950"
        >
          {/* Pitch outline */}
          <rect x="0" y="0" width="100" height="68" fill="none" stroke="#22c55e" strokeWidth="0.5" />

          {/* Halfway line */}
          <line x1="50" y1="0" x2="50" y2="68" stroke="#22c55e" strokeWidth="0.3" />

          {/* Center circle */}
          <circle cx="50" cy="34" r="9.15" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          <circle cx="50" cy="34" r="0.5" fill="#22c55e" />

          {/* Left penalty area */}
          <rect x="0" y="13.84" width="16.5" height="40.32" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" strokeWidth="0.3" />
          <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          <circle cx="11" cy="34" r="0.4" fill="#22c55e" />
          <path d="M 16.5 27.5 A 9.15 9.15 0 0 1 16.5 40.5" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          {/* Left goal */}
          <rect x="-2.5" y="29.84" width="3" height="8.32" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0.5" />
          <line x1="-2" y1="31" x2="-2" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="-1" y1="31" x2="-1" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="-2.5" y1="32" x2="0" y2="32" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="-2.5" y1="34" x2="0" y2="34" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="-2.5" y1="36" x2="0" y2="36" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />

          {/* Right penalty area */}
          <rect x="83.5" y="13.84" width="16.5" height="40.32" fill="rgba(34, 197, 94, 0.05)" stroke="#22c55e" strokeWidth="0.3" />
          <rect x="94.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          <circle cx="89" cy="34" r="0.4" fill="#22c55e" />
          <path d="M 83.5 27.5 A 9.15 9.15 0 0 0 83.5 40.5" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          {/* Right goal */}
          <rect x="99.5" y="29.84" width="3" height="8.32" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="0.5" />
          <line x1="101" y1="31" x2="101" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="102" y1="31" x2="102" y2="37" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="100" y1="32" x2="102.5" y2="32" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="100" y1="34" x2="102.5" y2="34" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />
          <line x1="100" y1="36" x2="102.5" y2="36" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" />

          {/* Corner arcs */}
          <path d="M 0 1 A 1 1 0 0 0 1 0" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          <path d="M 99 0 A 1 1 0 0 0 100 1" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          <path d="M 0 67 A 1 1 0 0 1 1 68" fill="none" stroke="#22c55e" strokeWidth="0.3" />
          <path d="M 100 67 A 1 1 0 0 0 99 68" fill="none" stroke="#22c55e" strokeWidth="0.3" />

          {/* Zone divider lines */}
          <line x1="33" y1="0" x2="33" y2="68" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" strokeDasharray="1,1" />
          <line x1="67" y1="0" x2="67" y2="68" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.2" strokeDasharray="1,1" />

          {/* Zone labels */}
          <text x="16.5" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">DEF</text>
          <text x="50" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">MID</text>
          <text x="83.5" y="4" fill="rgba(21, 128, 61, 0.5)" fontSize="3" textAnchor="middle">FIN</text>

          {/* Shot markers */}
          {shots.map((shot, i) => {
            const cfg = OUTCOME_CONFIG[shot.shot_outcome] || OUTCOME_CONFIG.off_target;
            const sx = Number(shot.x);
            const sy = toSvgY(Number(shot.y));
            const isGoal = shot.shot_outcome === 'goal';

            return (
              <g key={shot.id || i}>
                {/* Outer ring */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={isGoal ? 2.2 : 1.6}
                  fill={cfg.color}
                  fillOpacity={isGoal ? 0.9 : 0.7}
                  stroke={isGoal ? '#fff' : cfg.color}
                  strokeWidth={isGoal ? 0.4 : 0.2}
                />
                {/* Goal star */}
                {isGoal && (
                  <text
                    x={sx}
                    y={sy + 0.8}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="2.5"
                    fontWeight="bold"
                  >
                    ★
                  </text>
                )}
                {/* Blocked X */}
                {shot.shot_outcome === 'blocked' && (
                  <text
                    x={sx}
                    y={sy + 0.7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="2"
                    fontWeight="bold"
                  >
                    ×
                  </text>
                )}
                <title>{`${cfg.label} — ${shot.minute}' (${shot.half === 1 ? '1st' : '2nd'} Half)`}</title>
              </g>
            );
          })}
        </svg>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div>
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#22C55E' }}>{stats.goals}</p>
            <p className="text-[10px] text-muted-foreground">Goals</p>
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#F59E0B' }}>{stats.onTarget}</p>
            <p className="text-[10px] text-muted-foreground">On Target</p>
          </div>
          <div>
            <p className="text-lg font-bold">
              {stats.total > 0 ? Math.round(((stats.goals + stats.onTarget) / stats.total) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
