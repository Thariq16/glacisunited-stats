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
  opponent?: string;
}

interface PlayerShotMapProps {
  shots: ShotEvent[];
  attacksRight?: boolean;
}

const OUTCOME_CONFIG: Record<string, { color: string; label: string; symbol: string }> = {
  goal: { color: '#22c55e', label: 'Goal', symbol: '★' },
  on_target: { color: '#f59e0b', label: 'On Target', symbol: '●' },
  off_target: { color: '#ef4444', label: 'Off Target', symbol: '×' },
  blocked: { color: '#94a3b8', label: 'Blocked', symbol: '■' },
};

// Pitch dimensions in SVG viewBox
const PITCH_W = 100;
const PITCH_H = 68;

export function PlayerShotMap({ shots, attacksRight = true }: PlayerShotMapProps) {
  // Normalize shots so they all go toward the right goal
  const normalizedShots = useMemo(() =>
    shots.map(s => {
      const x = Number(s.x);
      const y = (Number(s.y) / 100) * PITCH_H;
      // If attacking right, shots should be on right half (x > 50). If not, flip.
      const needsFlip = attacksRight ? x < 50 : x > 50;
      return {
        ...s,
        nx: needsFlip ? PITCH_W - x : x,
        ny: needsFlip ? PITCH_H - y : y,
      };
    }),
    [shots, attacksRight]
  );

  const stats = useMemo(() => {
    const total = shots.length;
    const goals = shots.filter(s => s.shot_outcome === 'goal').length;
    const onTarget = shots.filter(s => s.shot_outcome === 'on_target').length;
    const offTarget = shots.filter(s => s.shot_outcome === 'off_target').length;
    const blocked = shots.filter(s => s.shot_outcome === 'blocked').length;
    return { total, goals, onTarget, offTarget, blocked };
  }, [shots]);

  if (!shots.length) {
    return null;
  }

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
                <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.symbol}</span>
                <span className="text-muted-foreground">{cfg.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{count}</Badge>
              </div>
            );
          })}
        </div>

        {/* Pitch SVG — only show attacking half */}
        <div className="relative w-full" style={{ aspectRatio: '1.2 / 1' }}>
          <svg
            viewBox="45 0 55 68"
            className="w-full h-full"
            style={{ background: 'hsl(142 40% 28%)' }}
          >
            {/* Pitch markings */}
            {/* Pitch border */}
            <rect x="0" y="0" width="100" height="68" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
            {/* Halfway line */}
            <line x1="50" y1="0" x2="50" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
            {/* Penalty area */}
            <rect x="83" y="13.84" width="17" height="40.32" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
            {/* 6-yard box */}
            <rect x="94.2" y="24.84" width="5.8" height="18.32" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.3" />
            {/* Goal */}
            <rect x="100" y="29.84" width="1.5" height="8.32" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" />
            {/* Penalty spot */}
            <circle cx="88" cy="34" r="0.4" fill="rgba(255,255,255,0.5)" />
            {/* Arc */}
            <path d="M 83 27 A 8 8 0 0 0 83 41" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
            {/* Center circle partial */}
            <path d="M 50 27 A 7 7 0 0 1 50 41" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />

            {/* Shot markers */}
            {normalizedShots.map((shot, i) => {
              const cfg = OUTCOME_CONFIG[shot.shot_outcome] || OUTCOME_CONFIG.off_target;
              const isGoal = shot.shot_outcome === 'goal';
              return (
                <g key={shot.id || i}>
                  {isGoal ? (
                    <text
                      x={shot.nx}
                      y={shot.ny}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={cfg.color}
                      fontSize="4"
                      fontWeight="bold"
                    >
                      ★
                    </text>
                  ) : shot.shot_outcome === 'blocked' ? (
                    <rect
                      x={shot.nx - 1.2}
                      y={shot.ny - 1.2}
                      width={2.4}
                      height={2.4}
                      fill={cfg.color}
                      opacity={0.85}
                      rx={0.3}
                    />
                  ) : shot.shot_outcome === 'off_target' ? (
                    <text
                      x={shot.nx}
                      y={shot.ny}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={cfg.color}
                      fontSize="4.5"
                      fontWeight="bold"
                    >
                      ×
                    </text>
                  ) : (
                    <circle
                      cx={shot.nx}
                      cy={shot.ny}
                      r={1.5}
                      fill={cfg.color}
                      opacity={0.85}
                    />
                  )}
                  {/* Tooltip on hover */}
                  <title>{`${cfg.label} — ${shot.minute}' (${shot.half === 1 ? '1st' : '2nd'} Half)`}</title>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div>
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-500">{stats.goals}</p>
            <p className="text-[10px] text-muted-foreground">Goals</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-500">{stats.onTarget}</p>
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
